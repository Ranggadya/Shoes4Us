package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type resetTokenEntry struct {
	userID    string
	expiresAt time.Time
}

type fakeUserRepo struct {
	mu          sync.RWMutex
	usersByID   map[string]*domain.User
	resetTokens map[string]resetTokenEntry
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{
		usersByID:   make(map[string]*domain.User),
		resetTokens: make(map[string]resetTokenEntry),
	}
}

func (r *fakeUserRepo) Create(_ context.Context, user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	emailLower := strings.ToLower(strings.TrimSpace(user.Email))
	for _, existing := range r.usersByID {
		if strings.EqualFold(existing.Email, emailLower) {
			return domain.NewConflict("User dengan email ini sudah terdaftar")
		}
	}
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now
	cp := *user
	r.usersByID[user.ID] = &cp
	return nil
}

func (r *fakeUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	target := strings.ToLower(strings.TrimSpace(email))
	for _, u := range r.usersByID {
		if strings.EqualFold(u.Email, target) {
			cp := *u
			return &cp, nil
		}
	}
	return nil, nil
}

func (r *fakeUserRepo) FindByID(_ context.Context, id string) (*domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	u, ok := r.usersByID[id]
	if !ok {
		return nil, nil
	}
	cp := *u
	return &cp, nil
}

func (r *fakeUserRepo) ListAll(_ context.Context) ([]domain.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]domain.User, 0, len(r.usersByID))
	for _, u := range r.usersByID {
		out = append(out, *u)
	}
	return out, nil
}

func (r *fakeUserRepo) Update(_ context.Context, user *domain.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existing, ok := r.usersByID[user.ID]
	if !ok {
		return domain.NewNotFound("User tidak ditemukan")
	}
	for id, other := range r.usersByID {
		if id != user.ID && strings.EqualFold(other.Email, user.Email) {
			return domain.NewConflict("Email sudah digunakan")
		}
	}
	existing.Name = user.Name
	existing.Email = user.Email
	existing.Role = user.Role
	existing.IsActive = user.IsActive
	existing.UpdatedAt = time.Now().UTC()
	*user = *existing
	return nil
}

func (r *fakeUserRepo) UpdatePassword(_ context.Context, userID, passwordHash string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existing, ok := r.usersByID[userID]
	if !ok {
		return domain.NewNotFound("User tidak ditemukan")
	}
	existing.PasswordHash = passwordHash
	existing.UpdatedAt = time.Now().UTC()
	return nil
}

func (r *fakeUserRepo) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.usersByID[id]; !ok {
		return domain.NewNotFound("User tidak ditemukan")
	}
	delete(r.usersByID, id)
	return nil
}

func (r *fakeUserRepo) SaveResetToken(_ context.Context, userID, tokenHash string, expiresAt time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.resetTokens[tokenHash] = resetTokenEntry{
		userID:    userID,
		expiresAt: expiresAt,
	}
	return nil
}

func (r *fakeUserRepo) FindValidResetToken(_ context.Context, tokenHash string) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	entry, ok := r.resetTokens[tokenHash]
	if !ok {
		return "", domain.NewNotFound("Token tidak ditemukan atau tidak valid")
	}
	if time.Now().After(entry.expiresAt) {
		return "", domain.NewUnauthorized("Token sudah kadaluarsa")
	}
	return entry.userID, nil
}

func (r *fakeUserRepo) DeleteResetTokensByUser(_ context.Context, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for k, v := range r.resetTokens {
		if v.userID == userID {
			delete(r.resetTokens, k)
		}
	}
	return nil
}

func TestAuthHandler_RegisterLoginAndMe(t *testing.T) {
	repo := newFakeUserRepo()
	jwtMgr := token.NewJWTManager("test-secret-key", 24)
	authSvc := service.NewAuthService(repo, jwtMgr)
	authHandler := handler.NewAuthHandler(authSvc)

	router := handler.NewRouter(handler.RouterDependencies{
		JWTManager:  jwtMgr,
		AuthHandler: authHandler,
	})

	// 1. Register new user
	regBody, _ := json.Marshal(map[string]string{
		"name":     "Rangga Dya",
		"email":    "rangga@shoes4us.com",
		"password": "password123",
	})
	regReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regRec := httptest.NewRecorder()
	router.ServeHTTP(regRec, regReq)

	if regRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on register, got %d: %s", regRec.Code, regRec.Body.String())
	}

	var regResp struct {
		Success bool                `json:"success"`
		Data    domain.AuthResponse `json:"data"`
	}
	if err := json.Unmarshal(regRec.Body.Bytes(), &regResp); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}
	if !regResp.Success || regResp.Data.Token == "" || regResp.Data.User == nil {
		t.Fatalf("unexpected register response: %+v", regResp)
	}
	if regResp.Data.User.Email != "rangga@shoes4us.com" || regResp.Data.User.Role != "USER" {
		t.Fatalf("unexpected registered user: %+v", regResp.Data.User)
	}

	cookies := regRec.Result().Cookies()
	var foundTokenCookie bool
	for _, c := range cookies {
		if c.Name == "token" && c.Value == regResp.Data.Token && c.HttpOnly {
			foundTokenCookie = true
		}
	}
	if !foundTokenCookie {
		t.Fatalf("expected HttpOnly token cookie on register, got cookies: %+v", cookies)
	}

	// 2. Duplicate register should return 409 Conflict
	dupReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(regBody))
	dupReq.Header.Set("Content-Type", "application/json")
	dupRec := httptest.NewRecorder()
	router.ServeHTTP(dupRec, dupReq)
	if dupRec.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict on duplicate email, got %d: %s", dupRec.Code, dupRec.Body.String())
	}

	// 3. Login with wrong password returns 401 Unauthorized
	badLoginBody, _ := json.Marshal(map[string]string{
		"email":    "rangga@shoes4us.com",
		"password": "wrongpassword",
	})
	badLoginReq := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(badLoginBody))
	badLoginReq.Header.Set("Content-Type", "application/json")
	badLoginRec := httptest.NewRecorder()
	router.ServeHTTP(badLoginRec, badLoginReq)
	if badLoginRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized on wrong password, got %d", badLoginRec.Code)
	}

	// 4. Login with valid credentials returns 200 OK and sets cookie
	loginBody, _ := json.Marshal(map[string]string{
		"email":    "rangga@shoes4us.com",
		"password": "password123",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)
	if loginRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on login, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	var loginResp struct {
		Success bool                `json:"success"`
		Data    domain.AuthResponse `json:"data"`
	}
	if err := json.Unmarshal(loginRec.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}
	if !loginResp.Success || loginResp.Data.Token == "" || loginResp.Data.User == nil {
		t.Fatalf("unexpected login response: %+v", loginResp)
	}

	// 5. GET /api/auth/me with Bearer token returns 200 OK with data.user
	meReq := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+loginResp.Data.Token)
	meRec := httptest.NewRecorder()
	router.ServeHTTP(meRec, meReq)
	if meRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on /api/auth/me, got %d: %s", meRec.Code, meRec.Body.String())
	}

	var meResp struct {
		Success bool `json:"success"`
		Data    struct {
			User domain.User `json:"user"`
		} `json:"data"`
	}
	if err := json.Unmarshal(meRec.Body.Bytes(), &meResp); err != nil {
		t.Fatalf("failed to decode /api/auth/me response: %v", err)
	}
	if !meResp.Success || meResp.Data.User.Email != "rangga@shoes4us.com" || meResp.Data.User.Name != "Rangga Dya" {
		t.Fatalf("unexpected /api/auth/me payload: %+v", meResp)
	}

	// 6. GET /api/auth/me without token returns 401 Unauthorized
	unauthMeReq := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	unauthMeRec := httptest.NewRecorder()
	router.ServeHTTP(unauthMeRec, unauthMeReq)
	if unauthMeRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 on unauthenticated /api/auth/me, got %d", unauthMeRec.Code)
	}
}


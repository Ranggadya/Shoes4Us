package service_test

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type stubAuthUserRepo struct {
	usersByID          map[string]*domain.User
	resetTokens        map[string]string
	deleteResetErr     error
	updatePasswordDone bool
}

func newStubAuthUserRepo() *stubAuthUserRepo {
	return &stubAuthUserRepo{
		usersByID:   make(map[string]*domain.User),
		resetTokens: make(map[string]string),
	}
}

func (r *stubAuthUserRepo) Create(_ context.Context, user *domain.User) error {
	for _, existing := range r.usersByID {
		if strings.EqualFold(existing.Email, user.Email) {
			return domain.NewConflict("User dengan email ini sudah terdaftar")
		}
	}
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	cp := *user
	r.usersByID[cp.ID] = &cp
	return nil
}

func (r *stubAuthUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	for _, u := range r.usersByID {
		if strings.EqualFold(u.Email, email) {
			cp := *u
			return &cp, nil
		}
	}
	return nil, nil
}

func (r *stubAuthUserRepo) FindByID(_ context.Context, id string) (*domain.User, error) {
	u, ok := r.usersByID[id]
	if !ok {
		return nil, nil
	}
	cp := *u
	return &cp, nil
}

func (r *stubAuthUserRepo) ListAll(_ context.Context) ([]domain.User, error) {
	return nil, nil
}

func (r *stubAuthUserRepo) Update(_ context.Context, user *domain.User) error {
	cp := *user
	r.usersByID[cp.ID] = &cp
	return nil
}

func (r *stubAuthUserRepo) UpdatePassword(_ context.Context, userID, passwordHash string) error {
	u, ok := r.usersByID[userID]
	if !ok {
		return domain.NewNotFound("User tidak ditemukan")
	}
	u.PasswordHash = passwordHash
	r.updatePasswordDone = true
	return nil
}

func (r *stubAuthUserRepo) Delete(_ context.Context, id string) error {
	delete(r.usersByID, id)
	return nil
}

func (r *stubAuthUserRepo) SaveResetToken(_ context.Context, userID, tokenHash string, _ time.Time) error {
	r.resetTokens[tokenHash] = userID
	return nil
}

func (r *stubAuthUserRepo) FindValidResetToken(_ context.Context, tokenHash string) (string, error) {
	userID, ok := r.resetTokens[tokenHash]
	if !ok {
		return "", domain.NewBadRequest("Token tidak valid")
	}
	return userID, nil
}

func (r *stubAuthUserRepo) DeleteResetTokensByUser(_ context.Context, userID string) error {
	if r.deleteResetErr != nil {
		return r.deleteResetErr
	}
	for k, v := range r.resetTokens {
		if v == userID {
			delete(r.resetTokens, k)
		}
	}
	return nil
}

func assertAppStatus(t *testing.T, err error, wantStatus int) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error with status %d, got nil", wantStatus)
	}
	var appErr *domain.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected *domain.AppError, got %T (%v)", err, err)
	}
	if appErr.Status != wantStatus {
		t.Fatalf("expected HTTP status %d, got %d (%s)", wantStatus, appErr.Status, appErr.Message)
	}
}

func TestAuthService_RegisterValidation(t *testing.T) {
	jwtMgr := token.NewJWTManager("test-secret-with-at-least-32-chars", 24)
	svc := service.NewAuthService(newStubAuthUserRepo(), jwtMgr)
	ctx := context.Background()

	// Single multi-byte rune is still < 2 runes
	_, err := svc.Register(ctx, "Ā", "valid@shoes4us.com", "password123")
	assertAppStatus(t, err, http.StatusBadRequest)

	// Name exceeding 100 runes rejected
	_, err = svc.Register(ctx, strings.Repeat("a", 101), "valid@shoes4us.com", "password123")
	assertAppStatus(t, err, http.StatusBadRequest)

	// Two runes passes name check, then invalid emails rejected
	invalidEmails := []string{
		"",
		"noatsign",
		"with space@shoes4us.com",
		"user@localhost",
		"user@.bad.com",
		"user@bad..com",
		strings.Repeat("a", 250) + "@x.com",
	}
	for _, email := range invalidEmails {
		t.Run("invalid-email-"+email, func(t *testing.T) {
			_, err = svc.Register(ctx, "Āā", email, "password123")
			assertAppStatus(t, err, http.StatusBadRequest)
		})
	}

	// Password < 8 runes rejected
	_, err = svc.Register(ctx, "Rangga", "rangga@shoes4us.com", "1234567")
	assertAppStatus(t, err, http.StatusBadRequest)

	// Password > 72 UTF-8 bytes rejected (37 multi-byte chars = 74 bytes)
	_, err = svc.Register(ctx, "Rangga", "rangga@shoes4us.com", strings.Repeat("é", 37))
	assertAppStatus(t, err, http.StatusBadRequest)

	// Valid registration forces USER role and normalizes email
	res, err := svc.Register(ctx, "  Rangga Dya  ", "  RANGGA@Shoes4Us.com ", "Password123!")
	if err != nil {
		t.Fatalf("expected register to succeed, got %v", err)
	}
	if res.User.Role != domain.RoleUser || res.User.Email != "rangga@shoes4us.com" || res.User.Name != "Rangga Dya" {
		t.Fatalf("unexpected registered user: %+v", res.User)
	}
	if !res.User.IsActive || res.Token == "" {
		t.Fatalf("expected active user and signed JWT token")
	}
}

func TestAuthService_LoginAndGetMeSecurity(t *testing.T) {
	repo := newStubAuthUserRepo()
	jwtMgr := token.NewJWTManager("test-secret-with-at-least-32-chars", 24)
	svc := service.NewAuthService(repo, jwtMgr)
	ctx := context.Background()

	hashed, err := hash.HashPassword("correctPass123")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	inactiveUser := &domain.User{
		ID:           "inactive-1",
		Email:        "inactive@shoes4us.com",
		Name:         "Inactive User",
		PasswordHash: hashed,
		Role:         domain.RoleUser,
		IsActive:     false,
	}
	repo.usersByID[inactiveUser.ID] = inactiveUser

	// Wrong password on inactive account must return 401 (never leak account state)
	_, err = svc.Login(ctx, "inactive@shoes4us.com", "wrongPass123")
	assertAppStatus(t, err, http.StatusUnauthorized)

	// Correct password on inactive account returns 403
	_, err = svc.Login(ctx, "inactive@shoes4us.com", "correctPass123")
	assertAppStatus(t, err, http.StatusForbidden)

	// Unknown user returns 401
	_, err = svc.Login(ctx, "missing@shoes4us.com", "correctPass123")
	assertAppStatus(t, err, http.StatusUnauthorized)

	// GetMe rejects inactive user with 403
	_, err = svc.GetMe(ctx, inactiveUser.ID)
	assertAppStatus(t, err, http.StatusForbidden)

	// GetMe returns 404 for deleted user
	_, err = svc.GetMe(ctx, "non-existent")
	assertAppStatus(t, err, http.StatusNotFound)
}

func TestAuthService_PasswordResetAndUserUpdateValidation(t *testing.T) {
	repo := newStubAuthUserRepo()
	jwtMgr := token.NewJWTManager("test-secret-with-at-least-32-chars", 24)
	authSvc := service.NewAuthService(repo, jwtMgr)
	userSvc := service.NewUserService(repo)
	ctx := context.Background()

	hashed, _ := hash.HashPassword("initialPass123")
	repo.usersByID["user-1"] = &domain.User{
		ID:           "user-1",
		Email:        "user@shoes4us.com",
		Name:         "User One",
		PasswordHash: hashed,
		Role:         domain.RoleUser,
		IsActive:     true,
	}

	// ForgotPassword validates email syntax & keeps unknown emails silent
	assertAppStatus(t, authSvc.ForgotPassword(ctx, "invalid-email"), http.StatusBadRequest)
	if err := authSvc.ForgotPassword(ctx, "unknown@shoes4us.com"); err != nil {
		t.Fatalf("expected anti-enumeration nil error, got %v", err)
	}

	// ResetPassword validates 8..72byte bounds & propagates token deletion error
	rawToken := "reset-token-abc"
	_ = repo.SaveResetToken(ctx, "user-1", hash.HashTokenSHA256(rawToken), time.Now().UTC().Add(time.Hour))

	assertAppStatus(t, authSvc.ResetPassword(ctx, rawToken, "short7"), http.StatusBadRequest)
	assertAppStatus(t, authSvc.ResetPassword(ctx, rawToken, strings.Repeat("a", 73)), http.StatusBadRequest)

	repo.deleteResetErr = errors.New("db cleanup failed")
	if err := authSvc.ResetPassword(ctx, rawToken, "validNewPass123"); err == nil {
		t.Fatalf("expected error from DeleteResetTokensByUser to propagate")
	}

	// UserService UpdatePassword enforces 8..72 byte bounds too
	caller := &token.UserClaims{UserID: "user-1", Role: domain.RoleUser}
	assertAppStatus(t, userSvc.UpdatePassword(ctx, caller, "user-1", "validNewPass123", "1234567"), http.StatusBadRequest)
	assertAppStatus(t, userSvc.UpdatePassword(ctx, caller, "user-1", "validNewPass123", strings.Repeat("b", 73)), http.StatusBadRequest)
}

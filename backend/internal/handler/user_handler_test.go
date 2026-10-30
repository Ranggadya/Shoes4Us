package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

func TestUserHandler_UpdateProfileAndPassword(t *testing.T) {
	repo := newFakeUserRepo()
	jwtMgr := token.NewJWTManager("test-secret-key", 24)
	authSvc := service.NewAuthService(repo, jwtMgr)
	userSvc := service.NewUserService(repo)
	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc)

	router := handler.NewRouter(handler.RouterDependencies{
		JWTManager:  jwtMgr,
		AuthHandler: authHandler,
		UserHandler: userHandler,
	})

	// Seed a regular user and an admin user
	userPassHash, _ := hash.HashPassword("initialPass123")
	normalUser := &domain.User{
		ID:           "user-1",
		Email:        "user1@shoes4us.com",
		Name:         "User Satu",
		PasswordHash: userPassHash,
		Role:         domain.RoleUser,
		IsActive:     true,
	}
	_ = repo.Create(context.Background(), normalUser)

	otherUser := &domain.User{
		ID:           "user-2",
		Email:        "user2@shoes4us.com",
		Name:         "User Dua",
		PasswordHash: userPassHash,
		Role:         domain.RoleUser,
		IsActive:     true,
	}
	_ = repo.Create(context.Background(), otherUser)

	adminUser := &domain.User{
		ID:           "admin-1",
		Email:        "admin@shoes4us.com",
		Name:         "Admin Utama",
		PasswordHash: userPassHash,
		Role:         domain.RoleAdmin,
		IsActive:     true,
	}
	_ = repo.Create(context.Background(), adminUser)

	userToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: normalUser.ID,
		Email:  normalUser.Email,
		Name:   normalUser.Name,
		Role:   normalUser.Role,
	})
	adminToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: adminUser.ID,
		Email:  adminUser.Email,
		Name:   adminUser.Name,
		Role:   adminUser.Role,
	})

	// 1. GET /api/users/me returns current user profile
	getMeReq := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
	getMeReq.Header.Set("Authorization", "Bearer "+userToken)
	getMeRec := httptest.NewRecorder()
	router.ServeHTTP(getMeRec, getMeReq)
	if getMeRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on GET /api/users/me, got %d: %s", getMeRec.Code, getMeRec.Body.String())
	}

	// 2. PATCH /api/users/:id updates user profile and returns expected envelope
	patchBody, _ := json.Marshal(map[string]string{
		"name":  "User Satu Updated",
		"email": "user1.updated@shoes4us.com",
	})
	patchReq := httptest.NewRequest(http.MethodPatch, "/api/users/"+normalUser.ID, bytes.NewReader(patchBody))
	patchReq.Header.Set("Content-Type", "application/json")
	patchReq.Header.Set("Authorization", "Bearer "+userToken)
	patchRec := httptest.NewRecorder()
	router.ServeHTTP(patchRec, patchReq)
	if patchRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on PATCH /api/users/:id, got %d: %s", patchRec.Code, patchRec.Body.String())
	}

	var patchResp struct {
		Success bool        `json:"success"`
		Message string      `json:"message"`
		Data    domain.User `json:"data"`
	}
	if err := json.Unmarshal(patchRec.Body.Bytes(), &patchResp); err != nil {
		t.Fatalf("failed to decode PATCH /api/users/:id response: %v", err)
	}
	if !patchResp.Success || patchResp.Message != "Profil berhasil diperbarui" {
		t.Fatalf("unexpected PATCH message/success: %+v", patchResp)
	}
	if patchResp.Data.ID != normalUser.ID || patchResp.Data.Name != "User Satu Updated" || patchResp.Data.Email != "user1.updated@shoes4us.com" || patchResp.Data.Role != domain.RoleUser {
		t.Fatalf("unexpected PATCH data: %+v", patchResp.Data)
	}

	// 3. PUT /api/users/me also updates current user profile
	putMeBody, _ := json.Marshal(map[string]string{
		"name":  "User Satu Me",
		"email": "user1.me@shoes4us.com",
	})
	putMeReq := httptest.NewRequest(http.MethodPut, "/api/users/me", bytes.NewReader(putMeBody))
	putMeReq.Header.Set("Content-Type", "application/json")
	putMeReq.Header.Set("Authorization", "Bearer "+userToken)
	putMeRec := httptest.NewRecorder()
	router.ServeHTTP(putMeRec, putMeReq)
	if putMeRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on PUT /api/users/me, got %d: %s", putMeRec.Code, putMeRec.Body.String())
	}

	// 4. PATCH /api/users/:id for another user by non-admin returns 403 Forbidden
	forbidReq := httptest.NewRequest(http.MethodPatch, "/api/users/"+otherUser.ID, bytes.NewReader(patchBody))
	forbidReq.Header.Set("Content-Type", "application/json")
	forbidReq.Header.Set("Authorization", "Bearer "+userToken)
	forbidRec := httptest.NewRecorder()
	router.ServeHTTP(forbidRec, forbidReq)
	if forbidRec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden when updating another user's profile, got %d", forbidRec.Code)
	}

	// 5. PATCH /api/users/:id/password with wrong currentPassword fails
	badPassBody, _ := json.Marshal(map[string]string{
		"currentPassword": "wrongCurrentPassword",
		"newPassword":     "updatedPass456",
	})
	badPassReq := httptest.NewRequest(http.MethodPatch, "/api/users/"+normalUser.ID+"/password", bytes.NewReader(badPassBody))
	badPassReq.Header.Set("Content-Type", "application/json")
	badPassReq.Header.Set("Authorization", "Bearer "+userToken)
	badPassRec := httptest.NewRecorder()
	router.ServeHTTP(badPassRec, badPassReq)
	if badPassRec.Code != http.StatusBadRequest && badPassRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 400 or 401 on wrong currentPassword, got %d", badPassRec.Code)
	}

	// 6. PATCH /api/users/:id/password with valid currentPassword succeeds
	goodPassBody, _ := json.Marshal(map[string]string{
		"currentPassword": "initialPass123",
		"newPassword":     "updatedPass456",
	})
	goodPassReq := httptest.NewRequest(http.MethodPatch, "/api/users/"+normalUser.ID+"/password", bytes.NewReader(goodPassBody))
	goodPassReq.Header.Set("Content-Type", "application/json")
	goodPassReq.Header.Set("Authorization", "Bearer "+userToken)
	goodPassRec := httptest.NewRecorder()
	router.ServeHTTP(goodPassRec, goodPassReq)
	if goodPassRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on PATCH /api/users/:id/password, got %d: %s", goodPassRec.Code, goodPassRec.Body.String())
	}

	// Verify login with new password works
	loginBody, _ := json.Marshal(map[string]string{
		"email":    "user1.me@shoes4us.com",
		"password": "updatedPass456",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)
	if loginRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK logging in with updated password, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	// 7. Admin endpoints: GET /api/users and DELETE /api/users/:id
	nonAdminListReq := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	nonAdminListReq.Header.Set("Authorization", "Bearer "+userToken)
	nonAdminListRec := httptest.NewRecorder()
	router.ServeHTTP(nonAdminListRec, nonAdminListReq)
	if nonAdminListRec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for non-admin GET /api/users, got %d", nonAdminListRec.Code)
	}

	adminListReq := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	adminListReq.Header.Set("Authorization", "Bearer "+adminToken)
	adminListRec := httptest.NewRecorder()
	router.ServeHTTP(adminListRec, adminListReq)
	if adminListRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for admin GET /api/users, got %d: %s", adminListRec.Code, adminListRec.Body.String())
	}

	adminDelReq := httptest.NewRequest(http.MethodDelete, "/api/users/"+otherUser.ID, nil)
	adminDelReq.Header.Set("Authorization", "Bearer "+adminToken)
	adminDelRec := httptest.NewRecorder()
	router.ServeHTTP(adminDelRec, adminDelReq)
	if adminDelRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for admin DELETE /api/users/:id, got %d: %s", adminDelRec.Code, adminDelRec.Body.String())
	}
}

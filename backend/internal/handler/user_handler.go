package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// UserHandler handles HTTP requests for `/api/users/*` endpoints.
type UserHandler struct {
	userService domain.UserService
}

// NewUserHandler constructs a UserHandler.
func NewUserHandler(userService domain.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

type updateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// GetMe handles `GET /api/users/me`.
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	user, err := h.userService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Profil user berhasil diambil", user, nil)
}

// UpdateMe handles `PUT /api/users/me`.
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data profil tidak valid"))
		return
	}

	updatedUser, err := h.userService.UpdateProfile(r.Context(), claims, claims.UserID, req.Name, req.Email)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Profil berhasil diperbarui", updatedUser, nil)
}

// UpdateProfile handles `PATCH /api/users/{id}`.
func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	targetID := chi.URLParam(r, "id")
	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data profil tidak valid"))
		return
	}

	updatedUser, err := h.userService.UpdateProfile(r.Context(), claims, targetID, req.Name, req.Email)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Profil berhasil diperbarui", updatedUser, nil)
}

// UpdatePassword handles `PATCH /api/users/{id}/password`.
func (h *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	targetID := chi.URLParam(r, "id")
	var req updatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data password tidak valid"))
		return
	}

	if err := h.userService.UpdatePassword(r.Context(), claims, targetID, req.CurrentPassword, req.NewPassword); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Password berhasil diperbarui", nil, nil)
}

// ListUsers handles `GET /api/users` (Admin).
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.ListUsers(r.Context())
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Daftar user berhasil diambil", users, nil)
}

// DeleteUser handles `DELETE /api/users/{id}` (Admin).
func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	targetID := chi.URLParam(r, "id")
	if err := h.userService.DeleteUser(r.Context(), claims, targetID); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "User berhasil dihapus", nil, nil)
}

package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

const defaultAuthCookieMaxAgeSeconds = 7 * 24 * 60 * 60

// AuthHandler handles HTTP requests for `/api/auth/*` endpoints.
type AuthHandler struct {
	authService         domain.AuthService
	cookieMaxAgeSeconds int
}

// NewAuthHandler constructs an AuthHandler.
func NewAuthHandler(authService domain.AuthService) *AuthHandler {
	return &AuthHandler{
		authService:         authService,
		cookieMaxAgeSeconds: defaultAuthCookieMaxAgeSeconds,
	}
}

// WithCookieMaxAgeSeconds overrides the auth cookie MaxAge in seconds to stay aligned with JWT TTL.
func (h *AuthHandler) WithCookieMaxAgeSeconds(seconds int) *AuthHandler {
	if seconds > 0 {
		h.cookieMaxAgeSeconds = seconds
	}
	return h
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Token       string `json:"token"`
	Password    string `json:"password"`
	NewPassword string `json:"newPassword"`
}

// Register handles `POST /api/auth/register`.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data registrasi tidak valid"))
		return
	}

	res, err := h.authService.Register(r.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	h.setAuthCookie(w, r, res.Token)
	response.WriteCreated(w, "Registrasi berhasil", res)
}

// Login handles `POST /api/auth/login`.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data login tidak valid"))
		return
	}

	res, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	h.setAuthCookie(w, r, res.Token)
	response.WriteSuccess(w, http.StatusOK, "Login berhasil", res, nil)
}

// Logout handles `POST /api/auth/logout` by clearing the HttpOnly auth cookie.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.clearAuthCookie(w, r)
	response.WriteSuccess(w, http.StatusOK, "Logout berhasil", nil, nil)
}

// Me handles `GET /api/auth/me`.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Autentikasi diperlukan"))
		return
	}

	user, err := h.authService.GetMe(r.Context(), claims.UserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Profil user berhasil diambil", map[string]any{
		"user": user,
	}, nil)
}

// ForgotPassword handles `POST /api/auth/forgot-password`.
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req forgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data request tidak valid"))
		return
	}

	if err := h.authService.ForgotPassword(r.Context(), req.Email); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Jika email terdaftar, instruksi reset password telah dikirim", nil, nil)
}

// ResetPassword handles `POST /api/auth/reset-password`.
// Supports both `newPassword` and `password` fields for compatibility with ResetPasswordPage.tsx.
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, domain.NewBadRequest("Data reset password tidak valid"))
		return
	}

	newPassword := req.NewPassword
	if newPassword == "" {
		newPassword = req.Password
	}

	if err := h.authService.ResetPassword(r.Context(), req.Token, newPassword); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Password berhasil direset", nil, nil)
}

func isSecureRequest(r *http.Request) bool {
	if r == nil {
		return false
	}
	if r.TLS != nil {
		return true
	}
	if strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		return true
	}
	if strings.EqualFold(os.Getenv("ENVIRONMENT"), "production") {
		return true
	}
	return false
}

func (h *AuthHandler) setAuthCookie(w http.ResponseWriter, r *http.Request, jwtToken string) {
	maxAge := h.cookieMaxAgeSeconds
	if maxAge <= 0 {
		maxAge = defaultAuthCookieMaxAgeSeconds
	}
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    jwtToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecureRequest(r),
		MaxAge:   maxAge,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearAuthCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecureRequest(r),
		MaxAge:   -1,
		Expires:  time.Unix(0, 0).UTC(),
		SameSite: http.SameSiteLaxMode,
	})
}

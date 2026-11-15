package service

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

// resetTokenTTL is how long a password reset token stays valid (SPEC-backend.md §6.1: 1 hour).
const resetTokenTTL = time.Hour

// dummyBcryptHash keeps login verification latency consistent when no user row exists,
// preventing timing-based email enumeration.
var dummyBcryptHash string

func init() {
	if hashed, err := hash.HashPassword("shoes4us-dummy-timing-guard"); err == nil {
		dummyBcryptHash = hashed
	}
}

// AuthService implements domain.AuthService.
type AuthService struct {
	userRepo      domain.UserRepository
	jwtMgr        *token.JWTManager
	resetURLBase  string
	logResetLinks bool
}

var _ domain.AuthService = (*AuthService)(nil)

// NewAuthService constructs an AuthService with the given user repository and JWT manager.
// Reset links are not logged unless WithDevResetLinkLogging(true) is set.
func NewAuthService(userRepo domain.UserRepository, jwtMgr *token.JWTManager) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		jwtMgr:       jwtMgr,
		resetURLBase: "http://localhost:3000",
	}
}

// WithDevResetLinkLogging enables logging the raw reset link; enable only when SMTP is not configured.
func (s *AuthService) WithDevResetLinkLogging(enabled bool) *AuthService {
	s.logResetLinks = enabled
	return s
}

// WithResetURLBase sets the frontend base URL used to build password reset links.
func (s *AuthService) WithResetURLBase(frontendURL string) *AuthService {
	if trimmed := strings.TrimRight(strings.TrimSpace(frontendURL), "/"); trimmed != "" {
		s.resetURLBase = trimmed
	}
	return s
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (*domain.AuthResponse, error) {
	cleanName, err := validatePersonName(name)
	if err != nil {
		return nil, err
	}
	cleanEmail, err := validateEmailAddress(email)
	if err != nil {
		return nil, err
	}
	if err := validateNewPassword(password, "Password"); err != nil {
		return nil, err
	}

	existing, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, domain.NewConflict("User dengan email ini sudah terdaftar")
	}

	hashedPassword, err := hashPasswordOrErr(password, "Password")
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	user := &domain.User{
		ID:           uuid.NewString(),
		Email:        cleanEmail,
		Name:         cleanName,
		PasswordHash: hashedPassword,
		Role:         domain.RoleUser,
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	signedToken, err := s.jwtMgr.Sign(token.UserClaims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		Role:   user.Role,
	})
	if err != nil {
		return nil, domain.NewInternal("Gagal membuat token autentikasi")
	}

	return &domain.AuthResponse{
		User:  user,
		Token: signedToken,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*domain.AuthResponse, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	if cleanEmail == "" || password == "" {
		return nil, domain.NewBadRequest("Email dan password wajib diisi")
	}

	user, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return nil, err
	}
	if user == nil || user.PasswordHash == "" {
		if dummyBcryptHash != "" {
			_ = hash.CheckPasswordHash(password, dummyBcryptHash)
		}
		return nil, domain.NewUnauthorized("Email atau password salah")
	}
	// Verify password before revealing account activation status so wrong-password probes
	// only receive 401 Unauthorized.
	if !hash.CheckPasswordHash(password, user.PasswordHash) {
		return nil, domain.NewUnauthorized("Email atau password salah")
	}
	if !user.IsActive {
		return nil, domain.NewForbidden("Akun Anda tidak aktif")
	}

	signedToken, err := s.jwtMgr.Sign(token.UserClaims{
		UserID: user.ID,
		Email:  user.Email,
		Name:   user.Name,
		Role:   user.Role,
	})
	if err != nil {
		return nil, domain.NewInternal("Gagal membuat token autentikasi")
	}

	return &domain.AuthResponse{
		User:  user,
		Token: signedToken,
	}, nil
}

func (s *AuthService) GetMe(ctx context.Context, userID string) (*domain.User, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Autentikasi diperlukan")
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domain.NewNotFound("User tidak ditemukan")
	}
	if !user.IsActive {
		return nil, domain.NewForbidden("Akun Anda tidak aktif")
	}

	return user, nil
}

// ForgotPassword generates a single-use reset token for a registered email and stores its SHA-256 hash.
// Returns nil when the email is not registered to prevent user enumeration.
func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	cleanEmail, err := validateEmailAddress(email)
	if err != nil {
		return err
	}

	user, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return err
	}
	if user == nil {
		// Anti-enumeration: do not reveal whether the email exists.
		return nil
	}

	if err := s.userRepo.DeleteResetTokensByUser(ctx, user.ID); err != nil {
		return err
	}

	rawToken := uuid.NewString()
	tokenHash := hash.HashTokenSHA256(rawToken)
	expiresAt := time.Now().UTC().Add(resetTokenTTL)

	if err := s.userRepo.SaveResetToken(ctx, user.ID, tokenHash, expiresAt); err != nil {
		return err
	}

	// SPEC-backend.md §6.1: the reset link may only be logged in development when SMTP is not configured.
	// The raw token grants account takeover, so it is never logged once SMTP is configured.
	if s.logResetLinks {
		log.Printf("[auth][dev] SMTP not configured; password reset link for %s: %s/reset-password?token=%s", user.Email, s.resetURLBase, rawToken)
	} else {
		log.Printf("[auth] password reset requested for user %s (email delivery not yet implemented)", user.ID)
	}
	return nil
}

// ResetPassword hashes the raw reset token with SHA-256, verifies it, and updates the user's password.
func (s *AuthService) ResetPassword(ctx context.Context, rawToken, newPassword string) error {
	cleanToken := strings.TrimSpace(rawToken)
	if cleanToken == "" {
		return domain.NewBadRequest("Token tidak boleh kosong")
	}
	if err := validateNewPassword(newPassword, "Password"); err != nil {
		return err
	}

	tokenHash := hash.HashTokenSHA256(cleanToken)
	userID, err := s.userRepo.FindValidResetToken(ctx, tokenHash)
	if err != nil {
		return err
	}

	hashedPassword, err := hashPasswordOrErr(newPassword, "Password")
	if err != nil {
		return err
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, hashedPassword); err != nil {
		return err
	}

	return s.userRepo.DeleteResetTokensByUser(ctx, userID)
}

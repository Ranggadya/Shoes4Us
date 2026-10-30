package service

import (
	"context"
	"strings"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

// UserService implements domain.UserService.
type UserService struct {
	userRepo domain.UserRepository
}

var _ domain.UserService = (*UserService)(nil)

// NewUserService constructs a UserService with the given user repository.
func NewUserService(userRepo domain.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetProfile retrieves a user's profile by ID.
func (s *UserService) GetProfile(ctx context.Context, userID string) (*domain.User, error) {
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
	return user, nil
}

// UpdateProfile updates the name and email of the target user after verifying ownership or admin privileges.
func (s *UserService) UpdateProfile(ctx context.Context, caller *token.UserClaims, targetUserID, name, email string) (*domain.User, error) {
	if caller == nil || strings.TrimSpace(caller.UserID) == "" {
		return nil, domain.NewUnauthorized("Autentikasi diperlukan")
	}
	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return nil, domain.NewBadRequest("ID user wajib diisi")
	}

	if caller.UserID != targetID && !strings.EqualFold(strings.TrimSpace(caller.Role), domain.RoleAdmin) {
		return nil, domain.NewForbidden("Anda tidak memiliki akses untuk mengubah profil user lain")
	}

	cleanName := strings.TrimSpace(name)
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	if len(cleanName) < 2 {
		return nil, domain.NewBadRequest("Nama minimal 2 karakter")
	}
	if cleanEmail == "" || !strings.Contains(cleanEmail, "@") {
		return nil, domain.NewBadRequest("Format email tidak valid")
	}

	user, err := s.userRepo.FindByID(ctx, targetID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domain.NewNotFound("User tidak ditemukan")
	}

	if !strings.EqualFold(user.Email, cleanEmail) {
		existing, err := s.userRepo.FindByEmail(ctx, cleanEmail)
		if err != nil {
			return nil, err
		}
		if existing != nil && existing.ID != user.ID {
			return nil, domain.NewConflict("Email sudah digunakan")
		}
	}

	user.Name = cleanName
	user.Email = cleanEmail
	user.UpdatedAt = time.Now().UTC()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

// UpdatePassword verifies the current password and updates the target user's password hash.
func (s *UserService) UpdatePassword(ctx context.Context, caller *token.UserClaims, targetUserID, currentPassword, newPassword string) error {
	if caller == nil || strings.TrimSpace(caller.UserID) == "" {
		return domain.NewUnauthorized("Autentikasi diperlukan")
	}
	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return domain.NewBadRequest("ID user wajib diisi")
	}

	if caller.UserID != targetID && !strings.EqualFold(strings.TrimSpace(caller.Role), domain.RoleAdmin) {
		return domain.NewForbidden("Anda tidak memiliki akses untuk mengubah password user lain")
	}

	if currentPassword == "" || newPassword == "" {
		return domain.NewBadRequest("Password saat ini dan password baru wajib diisi")
	}
	if len(newPassword) < 6 {
		return domain.NewBadRequest("Password baru minimal 6 karakter")
	}

	user, err := s.userRepo.FindByID(ctx, targetID)
	if err != nil {
		return err
	}
	if user == nil {
		return domain.NewNotFound("User tidak ditemukan")
	}

	if !hash.CheckPasswordHash(currentPassword, user.PasswordHash) {
		return domain.NewBadRequest("Password saat ini tidak sesuai")
	}

	hashedPassword, err := hash.HashPassword(newPassword)
	if err != nil {
		return domain.NewInternal("Gagal mengenkripsi password")
	}

	return s.userRepo.UpdatePassword(ctx, user.ID, hashedPassword)
}

// ListUsers returns all registered users (admin operation).
func (s *UserService) ListUsers(ctx context.Context) ([]domain.User, error) {
	return s.userRepo.ListAll(ctx)
}

// DeleteUser deletes a user by ID (admin operation).
func (s *UserService) DeleteUser(ctx context.Context, caller *token.UserClaims, targetUserID string) error {
	if caller == nil || strings.TrimSpace(caller.UserID) == "" {
		return domain.NewUnauthorized("Autentikasi diperlukan")
	}
	if !strings.EqualFold(strings.TrimSpace(caller.Role), domain.RoleAdmin) {
		return domain.NewForbidden("Akses ditolak: hanya admin yang diizinkan")
	}

	targetID := strings.TrimSpace(targetUserID)
	if targetID == "" {
		return domain.NewBadRequest("ID user wajib diisi")
	}
	if caller.UserID == targetID {
		return domain.NewBadRequest("Admin tidak dapat menghapus akun sendiri")
	}

	return s.userRepo.Delete(ctx, targetID)
}

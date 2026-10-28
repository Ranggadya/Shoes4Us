package domain

import (
	"context"
	"time"
)

const (
	RoleUser  = "USER"
	RoleAdmin = "ADMIN"
)

// User represents an application user record aligned with the PostgreSQL users table.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// AuthResponse is the payload returned on successful registration or login.
type AuthResponse struct {
	User  *User  `json:"user"`
	Token string `json:"token"`
}

// UserRepository defines persistence operations for users and password reset tokens.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	ListAll(ctx context.Context) ([]User, error)
	Update(ctx context.Context, user *User) error
	UpdatePassword(ctx context.Context, userID, passwordHash string) error
	Delete(ctx context.Context, id string) error
	SaveResetToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error
	FindValidResetToken(ctx context.Context, tokenHash string) (userID string, err error)
	DeleteResetTokensByUser(ctx context.Context, userID string) error
}

// AuthService defines authentication and password recovery business operations.
type AuthService interface {
	Register(ctx context.Context, name, email, password string) (*AuthResponse, error)
	Login(ctx context.Context, email, password string) (*AuthResponse, error)
	GetMe(ctx context.Context, userID string) (*User, error)
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, rawToken, newPassword string) error
}


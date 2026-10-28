package repository

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresUserRepository implements domain.UserRepository backed by pgxpool.Pool.
type PostgresUserRepository struct {
	pool *pgxpool.Pool
}

// NewUserRepository constructs a PostgreSQL-backed UserRepository.
func NewUserRepository(pool *pgxpool.Pool) *PostgresUserRepository {
	return &PostgresUserRepository{pool: pool}
}

func (r *PostgresUserRepository) Create(ctx context.Context, user *domain.User) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	if strings.TrimSpace(user.Role) == "" {
		user.Role = domain.RoleUser
	}
	now := time.Now().UTC()
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	if user.UpdatedAt.IsZero() {
		user.UpdatedAt = now
	}

	const query = `
		INSERT INTO users (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, email, COALESCE(name, ''), COALESCE(password, ''), role::text, "isActive", "createdAt", "updatedAt"
	`

	err := r.pool.QueryRow(
		ctx,
		query,
		user.ID,
		user.Email,
		user.Name,
		user.PasswordHash,
		user.Role,
		user.IsActive,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.NewConflict("User dengan email ini sudah terdaftar")
		}
		return err
	}
	return nil
}

func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	if r.pool == nil {
		return nil, domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		SELECT id, email, COALESCE(name, ''), COALESCE(password, ''), role::text, "isActive", "createdAt", "updatedAt"
		FROM users
		WHERE LOWER(email) = LOWER($1)
		LIMIT 1
	`

	var u domain.User
	err := r.pool.QueryRow(ctx, query, strings.TrimSpace(email)).Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.PasswordHash,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *PostgresUserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	if r.pool == nil {
		return nil, domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		SELECT id, email, COALESCE(name, ''), COALESCE(password, ''), role::text, "isActive", "createdAt", "updatedAt"
		FROM users
		WHERE id = $1
		LIMIT 1
	`

	var u domain.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID,
		&u.Email,
		&u.Name,
		&u.PasswordHash,
		&u.Role,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *PostgresUserRepository) ListAll(ctx context.Context) ([]domain.User, error) {
	if r.pool == nil {
		return nil, domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		SELECT id, email, COALESCE(name, ''), COALESCE(password, ''), role::text, "isActive", "createdAt", "updatedAt"
		FROM users
		ORDER BY "createdAt" DESC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]domain.User, 0)
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(
			&u.ID,
			&u.Email,
			&u.Name,
			&u.PasswordHash,
			&u.Role,
			&u.IsActive,
			&u.CreatedAt,
			&u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *PostgresUserRepository) Update(ctx context.Context, user *domain.User) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		UPDATE users
		SET email = $2, name = $3, role = $4, "isActive" = $5, "updatedAt" = $6
		WHERE id = $1
		RETURNING id, email, COALESCE(name, ''), COALESCE(password, ''), role::text, "isActive", "createdAt", "updatedAt"
	`

	now := time.Now().UTC()
	err := r.pool.QueryRow(
		ctx,
		query,
		user.ID,
		user.Email,
		user.Name,
		user.Role,
		user.IsActive,
		now,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.PasswordHash,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.NewNotFound("User tidak ditemukan")
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.NewConflict("Email sudah digunakan")
		}
		return err
	}
	return nil
}

func (r *PostgresUserRepository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		UPDATE users
		SET password = $2, "updatedAt" = $3
		WHERE id = $1
	`

	tag, err := r.pool.Exec(ctx, query, userID, passwordHash, time.Now().UTC())
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.NewNotFound("User tidak ditemukan")
	}
	return nil
}

func (r *PostgresUserRepository) Delete(ctx context.Context, id string) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}

	const query = `DELETE FROM users WHERE id = $1`

	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.NewNotFound("User tidak ditemukan")
	}
	return nil
}

func (r *PostgresUserRepository) SaveResetToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		INSERT INTO password_reset_tokens (id, "userId", token, "expiresAt", "createdAt")
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.pool.Exec(ctx, query, uuid.NewString(), userID, tokenHash, expiresAt, time.Now().UTC())
	return err
}

func (r *PostgresUserRepository) FindValidResetToken(ctx context.Context, tokenHash string) (string, error) {
	if r.pool == nil {
		return "", domain.NewInternal("Database tidak tersedia")
	}

	const query = `
		SELECT "userId", "expiresAt"
		FROM password_reset_tokens
		WHERE token = $1
		LIMIT 1
	`

	var userID string
	var expiresAt time.Time
	err := r.pool.QueryRow(ctx, query, tokenHash).Scan(&userID, &expiresAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", domain.NewNotFound("Token tidak ditemukan atau tidak valid")
		}
		return "", err
	}
	if time.Now().After(expiresAt) {
		return "", domain.NewUnauthorized("Token sudah kadaluarsa")
	}
	return userID, nil
}

func (r *PostgresUserRepository) DeleteResetTokensByUser(ctx context.Context, userID string) error {
	if r.pool == nil {
		return domain.NewInternal("Database tidak tersedia")
	}

	const query = `DELETE FROM password_reset_tokens WHERE "userId" = $1`

	_, err := r.pool.Exec(ctx, query, userID)
	return err
}


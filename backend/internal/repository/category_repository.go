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

// PostgresCategoryRepository implements domain.CategoryRepository using PostgreSQL.
type PostgresCategoryRepository struct {
	pool *pgxpool.Pool
}

var _ domain.CategoryRepository = (*PostgresCategoryRepository)(nil)

// NewCategoryRepository constructs a PostgreSQL-backed CategoryRepository.
func NewCategoryRepository(pool *pgxpool.Pool) *PostgresCategoryRepository {
	return &PostgresCategoryRepository{pool: pool}
}

// FindAll returns all active categories ordered by name.
func (r *PostgresCategoryRepository) FindAll(ctx context.Context) ([]domain.Category, error) {
	const query = `
		SELECT id, name, slug, "isActive", "createdAt", "updatedAt"
		FROM categories
		WHERE "isActive" = true
		ORDER BY name ASC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, domain.NewInternal("Gagal mengambil data kategori")
	}
	defer rows.Close()

	var categories []domain.Category
	for rows.Next() {
		var c domain.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, domain.NewInternal("Gagal memproses data kategori")
		}
		categories = append(categories, c)
	}

	if err := rows.Err(); err != nil {
		return nil, domain.NewInternal("Terjadi kesalahan membaca data kategori")
	}

	if categories == nil {
		categories = []domain.Category{}
	}

	return categories, nil
}

// FindByID returns a category by its UUID primary key.
func (r *PostgresCategoryRepository) FindByID(ctx context.Context, id string) (*domain.Category, error) {
	const query = `
		SELECT id, name, slug, "isActive", "createdAt", "updatedAt"
		FROM categories
		WHERE id = $1
		LIMIT 1
	`

	var c domain.Category
	err := r.pool.QueryRow(ctx, query, id).Scan(&c.ID, &c.Name, &c.Slug, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, domain.NewInternal("Gagal mengambil data kategori")
	}

	return &c, nil
}

// FindByNameOrSlug searches for a category by matching name or slug (case-insensitive).
func (r *PostgresCategoryRepository) FindByNameOrSlug(ctx context.Context, nameOrSlug string) (*domain.Category, error) {
	const query = `
		SELECT id, name, slug, "isActive", "createdAt", "updatedAt"
		FROM categories
		WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($1)
		LIMIT 1
	`

	clean := strings.TrimSpace(nameOrSlug)
	var c domain.Category
	err := r.pool.QueryRow(ctx, query, clean).Scan(&c.ID, &c.Name, &c.Slug, &c.IsActive, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, domain.NewInternal("Gagal mencari kategori")
	}

	return &c, nil
}

// Create inserts a new category record.
func (r *PostgresCategoryRepository) Create(ctx context.Context, category *domain.Category) error {
	if category.ID == "" {
		category.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	category.CreatedAt = now
	category.UpdatedAt = now
	category.IsActive = true

	const query = `
		INSERT INTO categories (id, name, slug, "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.pool.Exec(ctx, query, category.ID, category.Name, category.Slug, category.IsActive, category.CreatedAt, category.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.NewConflict("Kategori dengan nama atau slug ini sudah terdaftar")
		}
		return domain.NewInternal("Gagal membuat kategori baru")
	}

	return nil
}

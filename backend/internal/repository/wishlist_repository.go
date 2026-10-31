package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresWishlistRepository implements domain.WishlistRepository using PostgreSQL.
type PostgresWishlistRepository struct {
	pool *pgxpool.Pool
}

var _ domain.WishlistRepository = (*PostgresWishlistRepository)(nil)

// NewWishlistRepository constructs a new PostgresWishlistRepository.
func NewWishlistRepository(pool *pgxpool.Pool) *PostgresWishlistRepository {
	return &PostgresWishlistRepository{pool: pool}
}

// FindProductIDsByUserID returns lightweight items containing only product IDs for fast lookups.
func (r *PostgresWishlistRepository) FindProductIDsByUserID(ctx context.Context, userID string) ([]domain.WishlistIDItem, error) {
	if r.pool == nil {
		return []domain.WishlistIDItem{}, nil
	}

	const query = `
		SELECT "productId"
		FROM wishlists
		WHERE "userId" = $1
		ORDER BY "createdAt" DESC
	`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.WishlistIDItem, 0)
	for rows.Next() {
		var it domain.WishlistIDItem
		if err := rows.Scan(&it.ProductID); err != nil {
			return nil, err
		}
		items = append(items, it)
	}

	return items, rows.Err()
}

// FindFullByUserID retrieves full wishlist items including nested product and category details.
func (r *PostgresWishlistRepository) FindFullByUserID(ctx context.Context, userID string) ([]domain.WishlistItem, error) {
	if r.pool == nil {
		return []domain.WishlistItem{}, nil
	}

	const query = `
		SELECT w.id, w."productId", w."createdAt",
		       p.id, p.name, p.price, p."imageUrl", p.stock, p.slug,
		       c.id, c.name, c.slug
		FROM wishlists w
		JOIN products p ON w."productId" = p.id
		LEFT JOIN categories c ON p."categoryId" = c.id
		WHERE w."userId" = $1
		ORDER BY w."createdAt" DESC
	`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.WishlistItem, 0)
	for rows.Next() {
		var (
			it       domain.WishlistItem
			prod     domain.WishlistProduct
			catID    *string
			catName  *string
			catSlug  *string
			imgVal   *string
		)

		err := rows.Scan(
			&it.ID,
			&it.ProductID,
			&it.CreatedAt,
			&prod.ID,
			&prod.Name,
			&prod.Price,
			&imgVal,
			&prod.Stock,
			&prod.Slug,
			&catID,
			&catName,
			&catSlug,
		)
		if err != nil {
			return nil, err
		}

		prod.ImageURL = imgVal
		if catID != nil && catName != nil && catSlug != nil {
			prod.Category = &domain.WishlistCategory{
				ID:   *catID,
				Name: *catName,
				Slug: *catSlug,
			}
		}

		it.Product = &prod
		items = append(items, it)
	}

	return items, rows.Err()
}

// Add idempotently inserts a product into the user's wishlist.
func (r *PostgresWishlistRepository) Add(ctx context.Context, userID, productID string) (*domain.WishlistItem, error) {
	if r.pool == nil {
		return &domain.WishlistItem{
			ID:        uuid.NewString(),
			ProductID: productID,
			CreatedAt: time.Now(),
		}, nil
	}

	now := time.Now()
	newID := uuid.NewString()

	const insertQuery = `
		INSERT INTO wishlists (id, "userId", "productId", "createdAt")
		VALUES ($1, $2, $3, $4)
		ON CONFLICT ("userId", "productId") DO NOTHING
		RETURNING id, "createdAt"
	`

	var (
		actualID  string
		createdAt time.Time
	)
	err := r.pool.QueryRow(ctx, insertQuery, newID, userID, productID, now).Scan(&actualID, &createdAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Item already existed, retrieve existing record
			const selectQuery = `
				SELECT id, "createdAt"
				FROM wishlists
				WHERE "userId" = $1 AND "productId" = $2
				LIMIT 1
			`
			err = r.pool.QueryRow(ctx, selectQuery, userID, productID).Scan(&actualID, &createdAt)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return &domain.WishlistItem{
		ID:        actualID,
		ProductID: productID,
		CreatedAt: createdAt,
	}, nil
}

// Remove deletes a product from the user's wishlist.
func (r *PostgresWishlistRepository) Remove(ctx context.Context, userID, productID string) error {
	if r.pool == nil {
		return nil
	}

	const query = `
		DELETE FROM wishlists
		WHERE "userId" = $1 AND "productId" = $2
	`
	_, err := r.pool.Exec(ctx, query, userID, productID)
	return err
}

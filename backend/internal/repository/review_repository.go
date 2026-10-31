package repository

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresReviewRepository implements domain.ReviewRepository using PostgreSQL.
type PostgresReviewRepository struct {
	pool *pgxpool.Pool
}

var _ domain.ReviewRepository = (*PostgresReviewRepository)(nil)

// NewReviewRepository creates a new PostgresReviewRepository instance.
func NewReviewRepository(pool *pgxpool.Pool) *PostgresReviewRepository {
	return &PostgresReviewRepository{pool: pool}
}

// FindByProductID returns all reviews for a product ordered by newest first.
func (r *PostgresReviewRepository) FindByProductID(ctx context.Context, productID string) ([]domain.Review, error) {
	if r.pool == nil {
		return []domain.Review{}, nil
	}

	query := `
		SELECT r.id, r."productId", r."userId", r.rating, r.title, r.comment, r.verified, r.helpful, r."createdAt", r."updatedAt",
		       u.id, u.name
		FROM reviews r
		JOIN users u ON r."userId" = u.id
		WHERE r."productId" = $1
		ORDER BY r."createdAt" DESC
	`

	rows, err := r.pool.Query(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := make([]domain.Review, 0)
	for rows.Next() {
		var (
			rev   domain.Review
			uID   string
			uName string
		)
		err := rows.Scan(
			&rev.ID,
			&rev.ProductID,
			&rev.UserID,
			&rev.Rating,
			&rev.Title,
			&rev.Comment,
			&rev.Verified,
			&rev.Helpful,
			&rev.CreatedAt,
			&rev.UpdatedAt,
			&uID,
			&uName,
		)
		if err != nil {
			return nil, err
		}
		rev.User = &domain.ReviewUser{
			ID:   uID,
			Name: uName,
		}
		reviews = append(reviews, rev)
	}

	return reviews, rows.Err()
}

// GetSummary calculates aggregate metrics (total, averageRating, star distribution) for a product.
func (r *PostgresReviewRepository) GetSummary(ctx context.Context, productID string) (*domain.ReviewSummary, error) {
	summary := &domain.ReviewSummary{
		Total:         0,
		AverageRating: 0,
		Distribution:  domain.ReviewDistribution{},
	}
	if r.pool == nil {
		return summary, nil
	}

	query := `
		SELECT rating, COUNT(*)
		FROM reviews
		WHERE "productId" = $1
		GROUP BY rating
	`

	rows, err := r.pool.Query(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	total := 0
	sum := 0
	dist := domain.ReviewDistribution{}

	for rows.Next() {
		var rating int
		var count int
		if err := rows.Scan(&rating, &count); err != nil {
			return nil, err
		}
		total += count
		sum += rating * count
		switch rating {
		case 5:
			dist.Five = count
		case 4:
			dist.Four = count
		case 3:
			dist.Three = count
		case 2:
			dist.Two = count
		case 1:
			dist.One = count
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	summary.Total = total
	summary.Distribution = dist
	if total > 0 {
		summary.AverageRating = math.Round((float64(sum)/float64(total))*10) / 10
	}

	return summary, nil
}

// Create inserts a new review into the database.
func (r *PostgresReviewRepository) Create(ctx context.Context, review *domain.Review) error {
	if r.pool == nil {
		return errors.New("database pool not initialized")
	}

	if review.ID == "" {
		review.ID = uuid.NewString()
	}
	now := time.Now()
	if review.CreatedAt.IsZero() {
		review.CreatedAt = now
	}
	if review.UpdatedAt.IsZero() {
		review.UpdatedAt = now
	}

	query := `
		INSERT INTO reviews ("id", "productId", "userId", "rating", "title", "comment", "verified", "helpful", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.pool.Exec(ctx, query,
		review.ID,
		review.ProductID,
		review.UserID,
		review.Rating,
		review.Title,
		review.Comment,
		review.Verified,
		review.Helpful,
		review.CreatedAt,
		review.UpdatedAt,
	)
	return err
}

package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type reviewService struct {
	repo domain.ReviewRepository
}

var _ domain.ReviewService = (*reviewService)(nil)

// NewReviewService constructs a domain.ReviewService implementation.
func NewReviewService(repo domain.ReviewRepository) domain.ReviewService {
	return &reviewService{repo: repo}
}

// GetReviews fetches the list of reviews and rating summary for a product.
func (s *reviewService) GetReviews(ctx context.Context, productID string) ([]domain.Review, *domain.ReviewSummary, error) {
	productID = strings.TrimSpace(productID)
	if productID == "" {
		return nil, nil, domain.NewBadRequest("Product ID is required")
	}

	reviews, err := s.repo.FindByProductID(ctx, productID)
	if err != nil {
		return nil, nil, err
	}

	summary, err := s.repo.GetSummary(ctx, productID)
	if err != nil {
		return nil, nil, err
	}

	return reviews, summary, nil
}

// GetSummary retrieves only the aggregate rating summary for a product.
func (s *reviewService) GetSummary(ctx context.Context, productID string) (*domain.ReviewSummary, error) {
	productID = strings.TrimSpace(productID)
	if productID == "" {
		return nil, domain.NewBadRequest("Product ID is required")
	}

	return s.repo.GetSummary(ctx, productID)
}

// CreateReview validates inputs and persists a new customer review.
func (s *reviewService) CreateReview(ctx context.Context, userID, userName string, input domain.CreateReviewInput) (*domain.Review, error) {
	input.ProductID = strings.TrimSpace(input.ProductID)
	if input.ProductID == "" {
		return nil, domain.NewBadRequest("Product ID is required")
	}

	if input.Rating < 1 || input.Rating > 5 {
		return nil, domain.NewBadRequest("Rating must be between 1 and 5")
	}

	input.Comment = strings.TrimSpace(input.Comment)
	if input.Comment == "" {
		return nil, domain.NewBadRequest("Comment is required")
	}

	var titlePtr *string
	if input.Title != nil {
		trimmedTitle := strings.TrimSpace(*input.Title)
		if trimmedTitle != "" {
			titlePtr = &trimmedTitle
		}
	}

	now := time.Now()
	review := &domain.Review{
		ID:        uuid.NewString(),
		ProductID: input.ProductID,
		UserID:    userID,
		Rating:    input.Rating,
		Title:     titlePtr,
		Comment:   input.Comment,
		Verified:  false,
		Helpful:   0,
		CreatedAt: now,
		UpdatedAt: now,
		User: &domain.ReviewUser{
			ID:   userID,
			Name: userName,
		},
	}

	if err := s.repo.Create(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

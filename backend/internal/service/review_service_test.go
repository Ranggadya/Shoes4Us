package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

type mockReviewRepo struct {
	reviews []domain.Review
	summary *domain.ReviewSummary
	created *domain.Review
	err     error
}

func (m *mockReviewRepo) FindByProductID(ctx context.Context, productID string) ([]domain.Review, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.reviews, nil
}

func (m *mockReviewRepo) GetSummary(ctx context.Context, productID string) (*domain.ReviewSummary, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.summary, nil
}

func (m *mockReviewRepo) Create(ctx context.Context, review *domain.Review) error {
	if m.err != nil {
		return m.err
	}
	m.created = review
	return nil
}

func TestReviewService(t *testing.T) {
	ctx := context.Background()

	t.Run("GetReviews requires non-empty productId", func(t *testing.T) {
		svc := service.NewReviewService(&mockReviewRepo{})
		_, _, err := svc.GetReviews(ctx, "   ")
		if err == nil {
			t.Fatal("expected error for empty productId, got nil")
		}
	})

	t.Run("GetSummary requires non-empty productId", func(t *testing.T) {
		svc := service.NewReviewService(&mockReviewRepo{})
		_, err := svc.GetSummary(ctx, "")
		if err == nil {
			t.Fatal("expected error for empty productId, got nil")
		}
	})

	t.Run("CreateReview validates product, rating, and comment", func(t *testing.T) {
		svc := service.NewReviewService(&mockReviewRepo{})

		// Empty product
		_, err := svc.CreateReview(ctx, "u1", "User", domain.CreateReviewInput{
			ProductID: "",
			Rating:    5,
			Comment:   "Good",
		})
		if err == nil {
			t.Fatal("expected error for empty productId")
		}

		// Rating out of bounds (< 1)
		_, err = svc.CreateReview(ctx, "u1", "User", domain.CreateReviewInput{
			ProductID: "p1",
			Rating:    0,
			Comment:   "Good",
		})
		if err == nil {
			t.Fatal("expected error for rating 0")
		}

		// Rating out of bounds (> 5)
		_, err = svc.CreateReview(ctx, "u1", "User", domain.CreateReviewInput{
			ProductID: "p1",
			Rating:    6,
			Comment:   "Good",
		})
		if err == nil {
			t.Fatal("expected error for rating 6")
		}

		// Empty comment
		_, err = svc.CreateReview(ctx, "u1", "User", domain.CreateReviewInput{
			ProductID: "p1",
			Rating:    5,
			Comment:   "   ",
		})
		if err == nil {
			t.Fatal("expected error for empty comment")
		}

		// Success
		title := "Nice shoes"
		rev, err := svc.CreateReview(ctx, "u1", "User One", domain.CreateReviewInput{
			ProductID: "p1",
			Rating:    5,
			Title:     &title,
			Comment:   "Great quality!",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if rev.ID == "" || rev.ProductID != "p1" || rev.Rating != 5 || *rev.Title != "Nice shoes" {
			t.Fatalf("unexpected review created: %+v", rev)
		}
		if rev.User == nil || rev.User.Name != "User One" {
			t.Fatalf("unexpected user attached: %+v", rev.User)
		}
	})

	t.Run("GetReviews propagates repository error", func(t *testing.T) {
		repoErr := errors.New("db error")
		svc := service.NewReviewService(&mockReviewRepo{err: repoErr})
		_, _, err := svc.GetReviews(ctx, "p1")
		if !errors.Is(err, repoErr) {
			t.Fatalf("expected db error, got %v", err)
		}
	})

	t.Run("GetReviews returns reviews and summary", func(t *testing.T) {
		mockReviews := []domain.Review{
			{
				ID:        "r1",
				ProductID: "p1",
				Rating:    4,
				Comment:   "Comfortable",
				CreatedAt: time.Now(),
			},
		}
		mockSum := &domain.ReviewSummary{
			Total:         1,
			AverageRating: 4.0,
			Distribution:  domain.ReviewDistribution{Four: 1},
		}

		svc := service.NewReviewService(&mockReviewRepo{
			reviews: mockReviews,
			summary: mockSum,
		})

		revs, sum, err := svc.GetReviews(ctx, "p1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(revs) != 1 || sum.Total != 1 {
			t.Fatalf("unexpected results: revs=%d, sum=%+v", len(revs), sum)
		}
	})
}

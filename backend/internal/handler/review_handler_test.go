package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type mockReviewService struct {
	reviews []domain.Review
	summary *domain.ReviewSummary
	created *domain.Review
	err     error
}

func (m *mockReviewService) GetReviews(ctx context.Context, productID string) ([]domain.Review, *domain.ReviewSummary, error) {
	if m.err != nil {
		return nil, nil, m.err
	}
	return m.reviews, m.summary, nil
}

func (m *mockReviewService) GetSummary(ctx context.Context, productID string) (*domain.ReviewSummary, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.summary, nil
}

func (m *mockReviewService) CreateReview(ctx context.Context, userID, userName string, input domain.CreateReviewInput) (*domain.Review, error) {
	if m.err != nil {
		return nil, m.err
	}
	title := input.Title
	m.created = &domain.Review{
		ID:        "rev-123",
		ProductID: input.ProductID,
		UserID:    userID,
		Rating:    input.Rating,
		Title:     title,
		Comment:   input.Comment,
		Verified:  false,
		Helpful:   0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		User: &domain.ReviewUser{
			ID:   userID,
			Name: userName,
		},
	}
	return m.created, nil
}

func TestReviewHandler_SummaryOnlyAndCreate(t *testing.T) {
	jwtSecret := "test-secret-key-very-secure-32b!"
	jwtMgr := token.NewJWTManager(jwtSecret, 1)

	userToken, err := jwtMgr.Sign(token.UserClaims{
		UserID: "user-1",
		Email:  "user@example.com",
		Name:   "Budi Santoso",
		Role:   "USER",
	})
	if err != nil {
		t.Fatalf("failed to sign user token: %v", err)
	}

	title := "Sepatu Keren"
	mockReviews := []domain.Review{
		{
			ID:        "rev-1",
			ProductID: "prod-1",
			UserID:    "user-1",
			Rating:    5,
			Title:     &title,
			Comment:   "Sangat nyaman dipakai",
			Verified:  true,
			Helpful:   3,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			User: &domain.ReviewUser{
				ID:   "user-1",
				Name: "Budi Santoso",
			},
		},
	}
	mockSummary := &domain.ReviewSummary{
		Total:         1,
		AverageRating: 5.0,
		Distribution: domain.ReviewDistribution{
			Five:  1,
			Four:  0,
			Three: 0,
			Two:   0,
			One:   0,
		},
	}

	mockSvc := &mockReviewService{
		reviews: mockReviews,
		summary: mockSummary,
	}

	reviewHandler := handler.NewReviewHandler(mockSvc)
	router := handler.NewRouter(handler.RouterDependencies{
		JWTSecret:     jwtSecret,
		JWTManager:    jwtMgr,
		ReviewHandler: reviewHandler,
	})

	t.Run("GET /api/reviews without productId returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/reviews", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /api/reviews?productId=prod-1&summaryOnly=true returns summary only", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/reviews?productId=prod-1&summaryOnly=true", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				Summary *domain.ReviewSummary `json:"summary"`
				Reviews []domain.Review       `json:"reviews"`
			} `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success {
			t.Fatalf("expected success: true")
		}
		if resp.Data.Summary == nil || resp.Data.Summary.Total != 1 || resp.Data.Summary.AverageRating != 5.0 {
			t.Fatalf("unexpected summary data: %+v", resp.Data.Summary)
		}
		if len(resp.Data.Reviews) != 0 {
			t.Fatalf("expected 0 reviews in summaryOnly mode, got %d", len(resp.Data.Reviews))
		}
	})

	t.Run("GET /api/reviews?productId=prod-1 returns reviews and summary", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/reviews?productId=prod-1", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				Summary *domain.ReviewSummary `json:"summary"`
				Reviews []domain.Review       `json:"reviews"`
			} `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success {
			t.Fatalf("expected success: true")
		}
		if len(resp.Data.Reviews) != 1 {
			t.Fatalf("expected 1 review, got %d", len(resp.Data.Reviews))
		}
		if resp.Data.Reviews[0].User == nil || resp.Data.Reviews[0].User.Name != "Budi Santoso" {
			t.Fatalf("expected review user name 'Budi Santoso', got %+v", resp.Data.Reviews[0].User)
		}
		if resp.Data.Summary == nil || resp.Data.Summary.Total != 1 {
			t.Fatalf("expected summary total 1, got %+v", resp.Data.Summary)
		}
	})

	t.Run("POST /api/reviews unauthenticated returns 401", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-1",
			"rating":    5,
			"comment":   "Bagus",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/reviews", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /api/reviews with valid auth and payload returns 201", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-1",
			"rating":    5,
			"title":     "Mantap",
			"comment":   "Kualitas bahan dan jahitan sangat rapi.",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/reviews", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				Review *domain.Review `json:"review"`
			} `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success {
			t.Fatalf("expected success: true")
		}
		if resp.Data.Review == nil || resp.Data.Review.ID != "rev-123" {
			t.Fatalf("unexpected created review: %+v", resp.Data.Review)
		}
		if resp.Data.Review.User == nil || resp.Data.Review.User.Name != "Budi Santoso" {
			t.Fatalf("expected user name 'Budi Santoso', got %+v", resp.Data.Review.User)
		}
	})

	t.Run("POST /api/reviews with invalid rating returns 400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-1",
			"rating":    6,
			"comment":   "Rating invalid",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/reviews", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})
}

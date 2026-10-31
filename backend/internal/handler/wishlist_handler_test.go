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

type mockWishlistService struct {
	idItems   []domain.WishlistIDItem
	fullItems []domain.WishlistItem
	added     *domain.WishlistItem
	err       error
}

func (m *mockWishlistService) GetWishlistIDs(ctx context.Context, userID string) ([]domain.WishlistIDItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.idItems, nil
}

func (m *mockWishlistService) GetFullWishlist(ctx context.Context, userID string) ([]domain.WishlistItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.fullItems, nil
}

func (m *mockWishlistService) AddToWishlist(ctx context.Context, userID, productID string) (*domain.WishlistItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	if productID == "" {
		return nil, domain.NewBadRequest("Product ID wajib diisi")
	}
	m.added = &domain.WishlistItem{
		ID:        "w-1",
		ProductID: productID,
		CreatedAt: time.Now(),
	}
	return m.added, nil
}

func (m *mockWishlistService) RemoveFromWishlist(ctx context.Context, userID, productID string) error {
	return m.err
}

func TestWishlistHandler_FieldsIDsAndFullList(t *testing.T) {
	jwtSecret := "test-secret-key-very-secure-32b!"
	jwtMgr := token.NewJWTManager(jwtSecret, 1)

	userToken, err := jwtMgr.Sign(token.UserClaims{
		UserID: "user-1",
		Email:  "user@example.com",
		Name:   "Budi Santoso",
		Role:   "USER",
	})
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	img := "https://example.com/shoes.jpg"
	mockSvc := &mockWishlistService{
		idItems: []domain.WishlistIDItem{
			{ProductID: "prod-1"},
			{ProductID: "prod-2"},
		},
		fullItems: []domain.WishlistItem{
			{
				ID:        "w-1",
				ProductID: "prod-1",
				CreatedAt: time.Now(),
				Product: &domain.WishlistProduct{
					ID:       "prod-1",
					Name:     "Nike Air Jordan",
					Price:    1500000,
					ImageURL: &img,
					Stock:    10,
					Slug:     "nike-air-jordan",
					Category: &domain.WishlistCategory{
						ID:   "cat-1",
						Name: "Running",
						Slug: "running",
					},
				},
			},
		},
	}

	wishlistHandler := handler.NewWishlistHandler(mockSvc)
	router := handler.NewRouter(handler.RouterDependencies{
		JWTSecret:       jwtSecret,
		JWTManager:      jwtMgr,
		WishlistHandler: wishlistHandler,
	})

	t.Run("GET /api/wishlist unauthenticated returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", rec.Code)
		}
	})

	t.Run("GET /api/wishlist?fields=ids returns fast array of productIds", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/wishlist?fields=ids", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				Items []domain.WishlistIDItem `json:"items"`
			} `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success || len(resp.Data.Items) != 2 {
			t.Fatalf("expected 2 items with ids, got %+v", resp.Data)
		}
		if resp.Data.Items[0].ProductID != "prod-1" || resp.Data.Items[1].ProductID != "prod-2" {
			t.Fatalf("unexpected product IDs: %+v", resp.Data.Items)
		}
	})

	t.Run("GET /api/wishlist returns full items with product details", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool `json:"success"`
			Data    struct {
				Items []domain.WishlistItem `json:"items"`
			} `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success || len(resp.Data.Items) != 1 {
			t.Fatalf("expected 1 full wishlist item, got %+v", resp.Data)
		}
		item := resp.Data.Items[0]
		if item.Product == nil || item.Product.Name != "Nike Air Jordan" || item.Product.Category == nil {
			t.Fatalf("expected embedded product and category, got %+v", item)
		}
	})

	t.Run("POST /api/wishlist adds product to wishlist", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-3",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK && rec.Code != http.StatusCreated {
			t.Fatalf("expected 200/201, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /api/wishlist with empty productId returns 400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /api/wishlist/prod-1 removes product from wishlist", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/wishlist/prod-1", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})
}

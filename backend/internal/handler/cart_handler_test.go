package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type mockCartService struct {
	cart *domain.Cart
	err  error
}

func (m *mockCartService) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.cart, nil
}

func (m *mockCartService) AddToCart(ctx context.Context, userID string, input domain.AddToCartInput) (*domain.Cart, error) {
	if m.err != nil {
		return nil, m.err
	}
	if input.Quantity > 5 {
		return nil, domain.NewBadRequest("Stok tidak mencukupi")
	}
	return m.cart, nil
}

func (m *mockCartService) UpdateCartItem(ctx context.Context, userID, itemID string, quantity int) (*domain.Cart, error) {
	if m.err != nil {
		return nil, m.err
	}
	if quantity > 5 {
		return nil, domain.NewBadRequest("Stok tidak mencukupi")
	}
	return m.cart, nil
}

func (m *mockCartService) RemoveCartItem(ctx context.Context, userID, itemID string) (*domain.Cart, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.cart, nil
}

func (m *mockCartService) ClearCart(ctx context.Context, userID string) (*domain.Cart, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &domain.Cart{
		ID:     "cart-1",
		UserID: userID,
		Items:  []domain.CartItem{},
		Totals: domain.CartTotals{Subtotal: 0, TotalItems: 0},
	}, nil
}

func TestCartHandler_AddUpdateAndStockValidation(t *testing.T) {
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

	size42 := "42"
	img := "https://example.com/shoes.jpg"
	initialCart := &domain.Cart{
		ID:     "cart-1",
		UserID: "user-1",
		Items: []domain.CartItem{
			{
				ID:        "item-1",
				ProductID: "prod-1",
				Quantity:  2,
				Size:      &size42,
				LineTotal: 1000000,
				Product: domain.CartProductSummary{
					ID:       "prod-1",
					Name:     "Nike Air Jordan",
					Price:    500000,
					ImageURL: &img,
				},
			},
		},
		Totals: domain.CartTotals{
			Subtotal:   1000000,
			TotalItems: 2,
		},
	}

	mockSvc := &mockCartService{
		cart: initialCart,
	}

	cartHandler := handler.NewCartHandler(mockSvc)
	router := handler.NewRouter(handler.RouterDependencies{
		JWTSecret:   jwtSecret,
		JWTManager:  jwtMgr,
		CartHandler: cartHandler,
	})

	t.Run("GET /api/cart unauthenticated returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/cart", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 Unauthorized, got %d", rec.Code)
		}
	})

	t.Run("GET /api/cart authenticated returns cart with items and totals", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/cart", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}

		var resp struct {
			Success bool         `json:"success"`
			Data    *domain.Cart `json:"data"`
		}
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if !resp.Success || resp.Data == nil || len(resp.Data.Items) != 1 {
			t.Fatalf("unexpected cart data: %+v", resp.Data)
		}
		if resp.Data.Totals.Subtotal != 1000000 || resp.Data.Totals.TotalItems != 2 {
			t.Fatalf("unexpected totals: %+v", resp.Data.Totals)
		}
	})

	t.Run("POST /api/cart within stock returns success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-1",
			"quantity":  1,
			"size":      "42",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/cart", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK && rec.Code != http.StatusCreated {
			t.Fatalf("expected 200/201, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("POST /api/cart exceeding stock returns 400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"productId": "prod-1",
			"quantity":  99,
			"size":      "42",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/cart", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PATCH /api/cart/item-1 updates quantity", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"quantity": 3,
		})
		req := httptest.NewRequest(http.MethodPatch, "/api/cart/item-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PUT /api/cart/item-1 updates quantity", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"quantity": 3,
		})
		req := httptest.NewRequest(http.MethodPut, "/api/cart/item-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PATCH /api/cart/item-1 exceeding stock returns 400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"quantity": 99,
		})
		req := httptest.NewRequest(http.MethodPatch, "/api/cart/item-1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 Bad Request, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /api/cart/item-1 deletes item", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/cart/item-1", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("DELETE /api/cart clears cart", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/cart", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})
}

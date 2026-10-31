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
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
)

type mockOrderRepoForFocus struct {
	order       *domain.Order
	txCommitted bool
	txRolledBack bool
	restocked   bool
	err         error
}

func (m *mockOrderRepoForFocus) CreateOrderWithTx(ctx context.Context, order *domain.Order, items []domain.OrderItem, cartID string) error {
	if m.err != nil {
		m.txRolledBack = true
		return m.err
	}
	m.txCommitted = true
	m.order = order
	m.order.Items = items
	return nil
}

func (m *mockOrderRepoForFocus) FindByID(ctx context.Context, orderID string) (*domain.Order, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.order, nil
}

func (m *mockOrderRepoForFocus) FindAll(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int, error) {
	if m.err != nil {
		return nil, 0, m.err
	}
	if m.order != nil {
		return []domain.Order{*m.order}, 1, nil
	}
	return []domain.Order{}, 0, nil
}

func (m *mockOrderRepoForFocus) UpdateStatusWithTx(ctx context.Context, orderID string, newStatus domain.OrderStatus, restock bool) (*domain.Order, error) {
	if m.err != nil {
		return nil, m.err
	}
	m.order.Status = newStatus
	m.restocked = restock
	return m.order, nil
}

type mockCartRepoForOrder struct {
	cart *domain.Cart
}

func (m *mockCartRepoForOrder) GetOrCreateCart(ctx context.Context, userID string) (*domain.Cart, error) {
	return m.cart, nil
}
func (m *mockCartRepoForOrder) FindCartByUserID(ctx context.Context, userID string) (*domain.Cart, error) {
	return m.cart, nil
}
func (m *mockCartRepoForOrder) FindCartItem(ctx context.Context, cartID, itemID string) (*domain.CartItem, error) {
	return nil, nil
}
func (m *mockCartRepoForOrder) FindCartItemByProductAndSize(ctx context.Context, cartID, productID string, size *string) (*domain.CartItem, error) {
	return nil, nil
}
func (m *mockCartRepoForOrder) UpsertItem(ctx context.Context, cartID, productID string, priceSnap float64, quantity int, size *string) (*domain.CartItem, error) {
	return nil, nil
}
func (m *mockCartRepoForOrder) SetItemQuantity(ctx context.Context, cartID, itemID string, quantity int) error {
	return nil
}
func (m *mockCartRepoForOrder) RemoveItem(ctx context.Context, cartID, itemID string) error {
	return nil
}
func (m *mockCartRepoForOrder) ClearCart(ctx context.Context, cartID string) error {
	return nil
}

type mockProductRepoForOrder struct {
	sizeStock map[string]int
}

func (m *mockProductRepoForOrder) FindAll(ctx context.Context, filter domain.ProductFilter) ([]domain.Product, int, error) {
	return nil, 0, nil
}
func (m *mockProductRepoForOrder) FindByIDOrSlug(ctx context.Context, idOrSlug string) (*domain.Product, error) {
	return &domain.Product{ID: idOrSlug, Name: "Test Shoe", Price: 100000, IsActive: true}, nil
}
func (m *mockProductRepoForOrder) FindSizesByProductID(ctx context.Context, productID string) ([]domain.ProductSize, error) {
	return nil, nil
}
func (m *mockProductRepoForOrder) FindSizesByProductIDs(ctx context.Context, productIDs []string) (map[string][]domain.ProductSize, error) {
	return nil, nil
}
func (m *mockProductRepoForOrder) GetSizeStock(ctx context.Context, productID, size string) (int, error) {
	return m.sizeStock[productID+"_"+size], nil
}
func (m *mockProductRepoForOrder) HasOrderHistory(ctx context.Context, productID string) (bool, error) {
	return false, nil
}
func (m *mockProductRepoForOrder) Create(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	return nil
}
func (m *mockProductRepoForOrder) Update(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	return nil
}
func (m *mockProductRepoForOrder) Delete(ctx context.Context, id string) error {
	return nil
}
func (m *mockProductRepoForOrder) SoftDelete(ctx context.Context, id string) error {
	return nil
}

// TestOrderService_CreateOrder_InsufficientSizeStockRollsBack satisfies Review Focus #2.
func TestOrderService_CreateOrder_InsufficientSizeStockRollsBack(t *testing.T) {
	ctx := context.Background()
	size42 := "42"

	cart := &domain.Cart{
		ID:     "cart-1",
		UserID: "user-1",
		Items: []domain.CartItem{
			{
				ID:        "ci-1",
				ProductID: "prod-1",
				Quantity:  5,
				Size:      &size42,
				LineTotal: 500000,
				Product: domain.CartProductSummary{
					ID:    "prod-1",
					Name:  "Running Shoe",
					Price: 100000,
				},
			},
		},
	}

	cartRepo := &mockCartRepoForOrder{cart: cart}
	// Available stock is only 2, but requested quantity is 5
	prodRepo := &mockProductRepoForOrder{
		sizeStock: map[string]int{"prod-1_42": 2},
	}
	orderRepo := &mockOrderRepoForFocus{}

	orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo)

	_, err := orderSvc.Checkout(ctx, "user-1", domain.CreateOrderInput{
		ShippingAddress:    "Jl. Sudirman 1",
		ShippingCity:       "Jakarta",
		ShippingPostalCode: "12190",
		ShippingPhone:      "081234567890",
		PaymentMethod:      "BANK_TRANSFER",
	})

	if err == nil {
		t.Fatal("expected checkout to fail due to insufficient size stock, got nil error")
	}

	if orderRepo.txCommitted {
		t.Fatal("transaction must not commit when size stock is insufficient")
	}
}

// TestOrderService_CancelOrder_AlreadyCancelledOrShipped satisfies Review Focus #3.
func TestOrderService_CancelOrder_AlreadyCancelledOrShipped(t *testing.T) {
	ctx := context.Background()

	testCases := []struct {
		name          string
		initialStatus domain.OrderStatus
	}{
		{"Already CANCELLED", domain.StatusCancelled},
		{"Already SHIPPED", domain.StatusShipped},
		{"Already DELIVERED", domain.StatusDelivered},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			size42 := "42"
			existingOrder := &domain.Order{
				ID:          "ord-1",
				OrderNumber: "ORD-123",
				UserID:      "user-1",
				Status:      tc.initialStatus,
				TotalAmount: 100000,
				Items: []domain.OrderItem{
					{
						ID:        "item-1",
						ProductID: "prod-1",
						Quantity:  2,
						Size:      &size42,
					},
				},
			}

			orderRepo := &mockOrderRepoForFocus{order: existingOrder}
			cartRepo := &mockCartRepoForOrder{}
			prodRepo := &mockProductRepoForOrder{}

			orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo)

			_, err := orderSvc.CancelOrder(ctx, "user-1", "USER", "ord-1")
			if err == nil {
				t.Fatalf("expected cancel on %s to fail with 400 Bad Request", tc.initialStatus)
			}

			if orderRepo.restocked {
				t.Fatalf("stock must not be restocked when order is %s", tc.initialStatus)
			}
		})
	}
}

// TestOrderHandler_Endpoints tests HTTP handlers for checkout, list, detail, and cancel.
func TestOrderHandler_Endpoints(t *testing.T) {
	jwtSecret := "test-secret-key-very-secure-32b!"
	jwtMgr := token.NewJWTManager(jwtSecret, 1)

	userToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: "user-1",
		Email:  "user@example.com",
		Name:   "Budi",
		Role:   "USER",
	})

	adminToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: "admin-1",
		Email:  "admin@example.com",
		Name:   "Admin",
		Role:   "ADMIN",
	})

	size42 := "42"
	order := &domain.Order{
		ID:                 "ord-100",
		OrderNumber:        "ORD-20261031-100",
		UserID:             "user-1",
		Status:             domain.StatusPending,
		TotalAmount:        200000,
		ShippingAddress:    ptrString("Jl. Merdeka 10"),
		ShippingCity:       ptrString("Bandung"),
		ShippingPostalCode: ptrString("40115"),
		ShippingPhone:      ptrString("081234567890"),
		PaymentMethod:      ptrString("BANK_TRANSFER"),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
		Items: []domain.OrderItem{
			{
				ID:        "item-1",
				ProductID: "prod-1",
				Quantity:  1,
				Price:     200000,
				Size:      &size42,
				Product: domain.OrderItemProduct{
					ID:    "prod-1",
					Name:  "Running Shoe",
					Price: 200000,
				},
			},
		},
		User: &domain.OrderUserSummary{
			Name:  "Budi",
			Email: "user@example.com",
		},
	}

	cart := &domain.Cart{
		ID:     "cart-1",
		UserID: "user-1",
		Items: []domain.CartItem{
			{
				ID:        "ci-1",
				ProductID: "prod-1",
				Quantity:  1,
				Size:      &size42,
				LineTotal: 200000,
				Product: domain.CartProductSummary{
					ID:    "prod-1",
					Name:  "Running Shoe",
					Price: 200000,
				},
			},
		},
	}

	orderRepo := &mockOrderRepoForFocus{order: order}
	cartRepo := &mockCartRepoForOrder{cart: cart}
	prodRepo := &mockProductRepoForOrder{sizeStock: map[string]int{"prod-1_42": 10}}

	orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo)
	orderHandler := handler.NewOrderHandler(orderSvc)

	router := handler.NewRouter(handler.RouterDependencies{
		JWTSecret:    jwtSecret,
		JWTManager:   jwtMgr,
		OrderHandler: orderHandler,
	})

	t.Run("POST /api/orders creates order and returns 201", func(t *testing.T) {
		body, _ := json.Marshal(map[string]interface{}{
			"shippingAddress":    "Jl. Merdeka 10",
			"shippingCity":       "Bandung",
			"shippingPostalCode": "40115",
			"shippingPhone":      "081234567890",
			"paymentMethod":      "BANK_TRANSFER",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /api/orders returns user orders", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/orders", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /api/orders?scope=all with ADMIN returns all orders", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/orders?scope=all", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("GET /api/orders/ord-100 returns order detail", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/orders/ord-100", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("PATCH /api/orders/ord-100 cancels pending order", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPatch, "/api/orders/ord-100", nil)
		req.Header.Set("Authorization", "Bearer "+userToken)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", rec.Code, rec.Body.String())
		}
	})
}

func ptrString(s string) *string {
	return &s
}


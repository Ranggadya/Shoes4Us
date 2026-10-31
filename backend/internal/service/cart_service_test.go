package service_test

import (
	"context"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

type mockCartRepo struct {
	cart        *domain.Cart
	items       map[string]*domain.CartItem
	upsertCalls int
	removeCalls int
	clearCalls  int
}

func newMockCartRepo() *mockCartRepo {
	return &mockCartRepo{
		cart: &domain.Cart{
			ID:     "cart-1",
			UserID: "user-1",
			Items:  []domain.CartItem{},
			Totals: domain.CartTotals{},
		},
		items: make(map[string]*domain.CartItem),
	}
}

func (m *mockCartRepo) GetOrCreateCart(ctx context.Context, userID string) (*domain.Cart, error) {
	m.cart.UserID = userID
	return m.cart, nil
}

func (m *mockCartRepo) FindCartByUserID(ctx context.Context, userID string) (*domain.Cart, error) {
	items := make([]domain.CartItem, 0, len(m.items))
	var subtotal float64
	var totalItems int
	for _, it := range m.items {
		items = append(items, *it)
		subtotal += it.LineTotal
		totalItems += it.Quantity
	}
	m.cart.Items = items
	m.cart.Totals = domain.CartTotals{Subtotal: subtotal, TotalItems: totalItems}
	return m.cart, nil
}

func (m *mockCartRepo) FindCartItem(ctx context.Context, cartID, itemID string) (*domain.CartItem, error) {
	return m.items[itemID], nil
}

func (m *mockCartRepo) FindCartItemByProductAndSize(ctx context.Context, cartID, productID string, size *string) (*domain.CartItem, error) {
	for _, it := range m.items {
		if it.ProductID == productID {
			if (it.Size == nil && size == nil) || (it.Size != nil && size != nil && *it.Size == *size) {
				return it, nil
			}
		}
	}
	return nil, nil
}

func (m *mockCartRepo) UpsertItem(ctx context.Context, cartID, productID string, priceSnap float64, quantity int, size *string) (*domain.CartItem, error) {
	m.upsertCalls++
	var key string
	if size != nil {
		key = productID + "_" + *size
	} else {
		key = productID + "_none"
	}

	existing, ok := m.items[key]
	if ok {
		existing.Quantity += quantity
		existing.LineTotal = priceSnap * float64(existing.Quantity)
		return existing, nil
	}

	newItem := &domain.CartItem{
		ID:        key,
		ProductID: productID,
		Quantity:  quantity,
		Size:      size,
		LineTotal: priceSnap * float64(quantity),
		Product: domain.CartProductSummary{
			ID:    productID,
			Name:  "Test Product",
			Price: priceSnap,
		},
	}
	m.items[key] = newItem
	return newItem, nil
}

func (m *mockCartRepo) SetItemQuantity(ctx context.Context, cartID, itemID string, quantity int) error {
	if quantity <= 0 {
		delete(m.items, itemID)
		return nil
	}
	it, ok := m.items[itemID]
	if !ok {
		return domain.NewNotFound("Item keranjang tidak ditemukan")
	}
	it.Quantity = quantity
	it.LineTotal = it.Product.Price * float64(quantity)
	return nil
}

func (m *mockCartRepo) RemoveItem(ctx context.Context, cartID, itemID string) error {
	m.removeCalls++
	delete(m.items, itemID)
	return nil
}

func (m *mockCartRepo) ClearCart(ctx context.Context, cartID string) error {
	m.clearCalls++
	m.items = make(map[string]*domain.CartItem)
	return nil
}

type mockProductRepoForCart struct {
	product *domain.Product
	sizes   []domain.ProductSize
}

func (m *mockProductRepoForCart) FindAll(ctx context.Context, filter domain.ProductFilter) ([]domain.Product, int, error) {
	return nil, 0, nil
}
func (m *mockProductRepoForCart) FindByIDOrSlug(ctx context.Context, idOrSlug string) (*domain.Product, error) {
	if m.product == nil || (m.product.ID != idOrSlug && m.product.Slug != idOrSlug) {
		return nil, domain.NewNotFound("Produk tidak ditemukan")
	}
	return m.product, nil
}
func (m *mockProductRepoForCart) FindSizesByProductID(ctx context.Context, productID string) ([]domain.ProductSize, error) {
	return m.sizes, nil
}
func (m *mockProductRepoForCart) FindSizesByProductIDs(ctx context.Context, productIDs []string) (map[string][]domain.ProductSize, error) {
	return nil, nil
}
func (m *mockProductRepoForCart) GetSizeStock(ctx context.Context, productID, size string) (int, error) {
	for _, sz := range m.sizes {
		if sz.Size == size {
			return sz.Stock, nil
		}
	}
	return 0, nil
}
func (m *mockProductRepoForCart) HasOrderHistory(ctx context.Context, productID string) (bool, error) {
	return false, nil
}
func (m *mockProductRepoForCart) Create(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	return nil
}
func (m *mockProductRepoForCart) Update(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	return nil
}
func (m *mockProductRepoForCart) Delete(ctx context.Context, id string) error {
	return nil
}
func (m *mockProductRepoForCart) SoftDelete(ctx context.Context, id string) error {
	return nil
}

func TestCartService_StockValidationAndMutations(t *testing.T) {
	ctx := context.Background()
	cartRepo := newMockCartRepo()
	prodRepo := &mockProductRepoForCart{
		product: &domain.Product{
			ID:       "p-1",
			Slug:     "nike-air",
			Name:     "Nike Air",
			Price:    100000,
			Stock:    10,
			IsActive: true,
		},
		sizes: []domain.ProductSize{
			{ProductID: "p-1", Size: "42", Stock: 5},
			{ProductID: "p-1", Size: "43", Stock: 2},
		},
	}

	cartSvc := service.NewCartService(cartRepo, prodRepo)

	t.Run("AddToCart requires size if product has size variants", func(t *testing.T) {
		_, err := cartSvc.AddToCart(ctx, "user-1", domain.AddToCartInput{
			ProductID: "p-1",
			Quantity:  1,
			Size:      nil,
		})
		if err == nil {
			t.Fatal("expected error when size is missing, got nil")
		}
	})

	t.Run("AddToCart rejects size variant not available", func(t *testing.T) {
		sz := "38"
		_, err := cartSvc.AddToCart(ctx, "user-1", domain.AddToCartInput{
			ProductID: "p-1",
			Quantity:  1,
			Size:      &sz,
		})
		if err == nil {
			t.Fatal("expected error for unavailable size, got nil")
		}
	})

	t.Run("AddToCart succeeds within available stock", func(t *testing.T) {
		sz := "42"
		cart, err := cartSvc.AddToCart(ctx, "user-1", domain.AddToCartInput{
			ProductID: "p-1",
			Quantity:  3,
			Size:      &sz,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(cart.Items) != 1 || cart.Totals.TotalItems != 3 {
			t.Fatalf("unexpected cart state: %+v", cart)
		}
	})

	t.Run("AddToCart rejects when combined quantity exceeds stock", func(t *testing.T) {
		// Currently in cart: 3 of size 42. Stock is 5. Adding 3 more = 6 > 5.
		sz := "42"
		_, err := cartSvc.AddToCart(ctx, "user-1", domain.AddToCartInput{
			ProductID: "p-1",
			Quantity:  3,
			Size:      &sz,
		})
		if err == nil {
			t.Fatal("expected stock error, got nil")
		}
	})

	t.Run("UpdateCartItem validates stock and updates", func(t *testing.T) {
		// itemId for p-1 size 42 is "p-1_42"
		// Try updating to 6 (exceeds stock 5)
		_, err := cartSvc.UpdateCartItem(ctx, "user-1", "p-1_42", 6)
		if err == nil {
			t.Fatal("expected error when updating above stock, got nil")
		}

		// Update to 4 (within stock 5)
		cart, err := cartSvc.UpdateCartItem(ctx, "user-1", "p-1_42", 4)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if cart.Totals.TotalItems != 4 {
			t.Fatalf("expected totalItems 4, got %d", cart.Totals.TotalItems)
		}

		// Update to 0 (deletes item)
		cart, err = cartSvc.UpdateCartItem(ctx, "user-1", "p-1_42", 0)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(cart.Items) != 0 || cart.Totals.TotalItems != 0 {
			t.Fatalf("expected empty cart after updating to 0, got %+v", cart)
		}
	})

	t.Run("ClearCart removes all items", func(t *testing.T) {
		sz := "43"
		_, _ = cartSvc.AddToCart(ctx, "user-1", domain.AddToCartInput{
			ProductID: "p-1",
			Quantity:  2,
			Size:      &sz,
		})
		cart, err := cartSvc.ClearCart(ctx, "user-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(cart.Items) != 0 || cart.Totals.TotalItems != 0 {
			t.Fatalf("expected empty cart after clear, got %+v", cart)
		}
	})
}

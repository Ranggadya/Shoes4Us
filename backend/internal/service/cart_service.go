package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type cartService struct {
	cartRepo    domain.CartRepository
	productRepo domain.ProductRepository
}

var _ domain.CartService = (*cartService)(nil)

// NewCartService creates a new domain.CartService.
func NewCartService(cartRepo domain.CartRepository, productRepo domain.ProductRepository) domain.CartService {
	return &cartService{
		cartRepo:    cartRepo,
		productRepo: productRepo,
	}
}

// GetCart returns the user's shopping cart.
func (s *cartService) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses keranjang")
	}

	cart, err := s.cartRepo.FindCartByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if cart == nil {
		return &domain.Cart{
			ID:     "",
			UserID: userID,
			Items:  []domain.CartItem{},
			Totals: domain.CartTotals{Subtotal: 0, TotalItems: 0},
		}, nil
	}
	return cart, nil
}

// AddToCart validates product existence, active status, and per-size stock before upserting into cart.
func (s *cartService) AddToCart(ctx context.Context, userID string, input domain.AddToCartInput) (*domain.Cart, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses keranjang")
	}

	productID := strings.TrimSpace(input.ProductID)
	if productID == "" {
		return nil, domain.NewBadRequest("Product ID wajib diisi")
	}
	if input.Quantity <= 0 {
		return nil, domain.NewBadRequest("Kuantitas minimal 1")
	}

	cart, err := s.cartRepo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	product, err := s.productRepo.FindByIDOrSlug(ctx, productID)
	if err != nil || product == nil {
		return nil, domain.NewNotFound("Produk tidak ditemukan")
	}
	if !product.IsActive {
		return nil, domain.NewBadRequest("Produk sedang tidak aktif")
	}

	sizes, err := s.productRepo.FindSizesByProductID(ctx, product.ID)
	if err != nil {
		return nil, err
	}

	var sizePtr *string
	if input.Size != nil {
		trimmedSize := strings.TrimSpace(*input.Size)
		if trimmedSize != "" {
			sizePtr = &trimmedSize
		}
	}

	if len(sizes) > 0 {
		if sizePtr == nil {
			return nil, domain.NewBadRequest("Ukuran produk wajib dipilih")
		}

		var (
			foundSize  bool
			availStock int
		)
		for _, sz := range sizes {
			if strings.EqualFold(sz.Size, *sizePtr) {
				foundSize = true
				availStock = sz.Stock
				sizePtr = &sz.Size // normalisasi casing
				break
			}
		}
		if !foundSize {
			return nil, domain.NewBadRequest(fmt.Sprintf("Ukuran %q tidak tersedia untuk produk ini", *sizePtr))
		}

		existingItem, _ := s.cartRepo.FindCartItemByProductAndSize(ctx, cart.ID, product.ID, sizePtr)
		currentQty := 0
		if existingItem != nil {
			currentQty = existingItem.Quantity
		}

		if currentQty+input.Quantity > availStock {
			return nil, domain.NewBadRequest(fmt.Sprintf("Stok produk %q untuk ukuran %s tidak mencukupi (tersedia: %d)", product.Name, *sizePtr, availStock))
		}
	} else {
		existingItem, _ := s.cartRepo.FindCartItemByProductAndSize(ctx, cart.ID, product.ID, nil)
		currentQty := 0
		if existingItem != nil {
			currentQty = existingItem.Quantity
		}

		if currentQty+input.Quantity > product.Stock {
			return nil, domain.NewBadRequest(fmt.Sprintf("Stok produk %q tidak mencukupi (tersedia: %d)", product.Name, product.Stock))
		}
	}

	_, err = s.cartRepo.UpsertItem(ctx, cart.ID, product.ID, product.Price, input.Quantity, sizePtr)
	if err != nil {
		return nil, err
	}

	return s.cartRepo.FindCartByUserID(ctx, userID)
}

// UpdateCartItem adjusts an item's quantity with stock availability checks, or deletes it if quantity <= 0.
func (s *cartService) UpdateCartItem(ctx context.Context, userID, itemID string, quantity int) (*domain.Cart, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses keranjang")
	}

	cart, err := s.cartRepo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	if quantity <= 0 {
		if err := s.cartRepo.SetItemQuantity(ctx, cart.ID, itemID, 0); err != nil {
			return nil, err
		}
		return s.cartRepo.FindCartByUserID(ctx, userID)
	}

	item, err := s.cartRepo.FindCartItem(ctx, cart.ID, itemID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, domain.NewNotFound("Item keranjang tidak ditemukan")
	}

	if item.Size != nil && *item.Size != "" {
		availStock, err := s.productRepo.GetSizeStock(ctx, item.ProductID, *item.Size)
		if err != nil {
			return nil, err
		}
		if quantity > availStock {
			return nil, domain.NewBadRequest(fmt.Sprintf("Stok ukuran %s tidak mencukupi (tersedia: %d)", *item.Size, availStock))
		}
	} else {
		product, err := s.productRepo.FindByIDOrSlug(ctx, item.ProductID)
		if err != nil || product == nil {
			return nil, domain.NewNotFound("Produk tidak ditemukan")
		}
		if quantity > product.Stock {
			return nil, domain.NewBadRequest(fmt.Sprintf("Stok produk tidak mencukupi (tersedia: %d)", product.Stock))
		}
	}

	if err := s.cartRepo.SetItemQuantity(ctx, cart.ID, itemID, quantity); err != nil {
		return nil, err
	}

	return s.cartRepo.FindCartByUserID(ctx, userID)
}

// RemoveCartItem deletes a single item from the user's cart.
func (s *cartService) RemoveCartItem(ctx context.Context, userID, itemID string) (*domain.Cart, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses keranjang")
	}

	cart, err := s.cartRepo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	if err := s.cartRepo.RemoveItem(ctx, cart.ID, itemID); err != nil {
		return nil, err
	}

	return s.cartRepo.FindCartByUserID(ctx, userID)
}

// ClearCart empties the user's cart.
func (s *cartService) ClearCart(ctx context.Context, userID string) (*domain.Cart, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses keranjang")
	}

	cart, err := s.cartRepo.FindCartByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if cart != nil && cart.ID != "" {
		if err := s.cartRepo.ClearCart(ctx, cart.ID); err != nil {
			return nil, err
		}
	}

	return &domain.Cart{
		ID:     cart.ID,
		UserID: userID,
		Items:  []domain.CartItem{},
		Totals: domain.CartTotals{Subtotal: 0, TotalItems: 0},
	}, nil
}

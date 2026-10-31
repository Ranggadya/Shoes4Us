package service

import (
	"context"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type wishlistService struct {
	repo domain.WishlistRepository
}

var _ domain.WishlistService = (*wishlistService)(nil)

// NewWishlistService creates a new domain.WishlistService.
func NewWishlistService(repo domain.WishlistRepository) domain.WishlistService {
	return &wishlistService{repo: repo}
}

// GetWishlistIDs returns lightweight wishlist items containing only product IDs.
func (s *wishlistService) GetWishlistIDs(ctx context.Context, userID string) ([]domain.WishlistIDItem, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses wishlist")
	}

	return s.repo.FindProductIDsByUserID(ctx, userID)
}

// GetFullWishlist returns full wishlist items with embedded product and category data.
func (s *wishlistService) GetFullWishlist(ctx context.Context, userID string) ([]domain.WishlistItem, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses wishlist")
	}

	return s.repo.FindFullByUserID(ctx, userID)
}

// AddToWishlist adds a product to the user's wishlist.
func (s *wishlistService) AddToWishlist(ctx context.Context, userID, productID string) (*domain.WishlistItem, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, domain.NewUnauthorized("Silakan login untuk mengakses wishlist")
	}

	productID = strings.TrimSpace(productID)
	if productID == "" {
		return nil, domain.NewBadRequest("Product ID wajib diisi")
	}

	return s.repo.Add(ctx, userID, productID)
}

// RemoveFromWishlist removes a product from the user's wishlist.
func (s *wishlistService) RemoveFromWishlist(ctx context.Context, userID, productID string) error {
	if strings.TrimSpace(userID) == "" {
		return domain.NewUnauthorized("Silakan login untuk mengakses wishlist")
	}

	productID = strings.TrimSpace(productID)
	if productID == "" {
		return domain.NewBadRequest("Product ID wajib diisi")
	}

	return s.repo.Remove(ctx, userID, productID)
}

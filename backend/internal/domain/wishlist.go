package domain

import (
	"context"
	"time"
)

// WishlistCategory holds category metadata embedded in wishlist product.
type WishlistCategory struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// WishlistProduct represents product summary embedded in full wishlist responses.
type WishlistProduct struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Price    float64           `json:"price"`
	ImageURL *string           `json:"imageUrl"`
	Stock    int               `json:"stock"`
	Slug     string            `json:"slug"`
	Category *WishlistCategory `json:"category,omitempty"`
}

// WishlistIDItem represents a lightweight item holding only the productId.
type WishlistIDItem struct {
	ProductID string `json:"productId"`
}

// WishlistItem represents an item in a user's wishlist.
type WishlistItem struct {
	ID        string           `json:"id"`
	ProductID string           `json:"productId"`
	CreatedAt time.Time        `json:"createdAt"`
	Product   *WishlistProduct `json:"product,omitempty"`
}

// WishlistRepository abstracts wishlist database access.
type WishlistRepository interface {
	FindProductIDsByUserID(ctx context.Context, userID string) ([]WishlistIDItem, error)
	FindFullByUserID(ctx context.Context, userID string) ([]WishlistItem, error)
	Add(ctx context.Context, userID, productID string) (*WishlistItem, error)
	Remove(ctx context.Context, userID, productID string) error
}

// WishlistService abstracts business logic for managing customer wishlists.
type WishlistService interface {
	GetWishlistIDs(ctx context.Context, userID string) ([]WishlistIDItem, error)
	GetFullWishlist(ctx context.Context, userID string) ([]WishlistItem, error)
	AddToWishlist(ctx context.Context, userID, productID string) (*WishlistItem, error)
	RemoveFromWishlist(ctx context.Context, userID, productID string) error
}

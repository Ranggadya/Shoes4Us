package domain

import (
	"context"
	"time"
)

// CartProductSummary represents product snapshot in a cart item.
type CartProductSummary struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	ImageURL *string `json:"imageUrl"`
}

// CartItem represents an item within a shopping cart.
type CartItem struct {
	ID        string             `json:"id"`
	ProductID string             `json:"productId,omitempty"`
	Quantity  int                `json:"quantity"`
	Size      *string            `json:"size"`
	LineTotal float64            `json:"lineTotal"`
	Product   CartProductSummary `json:"product"`
	CreatedAt time.Time          `json:"createdAt,omitempty"`
	UpdatedAt time.Time          `json:"updatedAt,omitempty"`
}

// CartTotals contains aggregated quantity and price calculations.
type CartTotals struct {
	Subtotal   float64 `json:"subtotal"`
	TotalItems int     `json:"totalItems"`
}

// Cart represents a user's active shopping cart.
type Cart struct {
	ID     string     `json:"id"`
	UserID string     `json:"userId,omitempty"`
	Items  []CartItem `json:"items"`
	Totals CartTotals `json:"totals"`
}

// AddToCartInput carries payload for adding items to cart.
type AddToCartInput struct {
	ProductID string  `json:"productId"`
	Quantity  int     `json:"quantity"`
	Size      *string `json:"size,omitempty"`
}

// UpdateCartItemInput carries payload for changing item quantity.
type UpdateCartItemInput struct {
	Quantity int `json:"quantity"`
}

// CartRepository abstracts database operations on carts and cart items.
type CartRepository interface {
	GetOrCreateCart(ctx context.Context, userID string) (*Cart, error)
	FindCartByUserID(ctx context.Context, userID string) (*Cart, error)
	FindCartItem(ctx context.Context, cartID, itemID string) (*CartItem, error)
	FindCartItemByProductAndSize(ctx context.Context, cartID, productID string, size *string) (*CartItem, error)
	UpsertItem(ctx context.Context, cartID, productID string, priceSnap float64, quantity int, size *string) (*CartItem, error)
	SetItemQuantity(ctx context.Context, cartID, itemID string, quantity int) error
	RemoveItem(ctx context.Context, cartID, itemID string) error
	ClearCart(ctx context.Context, cartID string) error
}

// CartService abstracts business operations and stock validation for carts.
type CartService interface {
	GetCart(ctx context.Context, userID string) (*Cart, error)
	AddToCart(ctx context.Context, userID string, input AddToCartInput) (*Cart, error)
	UpdateCartItem(ctx context.Context, userID, itemID string, quantity int) (*Cart, error)
	RemoveCartItem(ctx context.Context, userID, itemID string) (*Cart, error)
	ClearCart(ctx context.Context, userID string) (*Cart, error)
}

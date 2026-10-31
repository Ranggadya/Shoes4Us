package domain

import (
	"context"
	"time"
)

// OrderStatus defines the lifecycle status of an order.
type OrderStatus string

const (
	StatusPending    OrderStatus = "PENDING"
	StatusProcessing OrderStatus = "PROCESSING"
	StatusPaid       OrderStatus = "PAID"
	StatusShipped    OrderStatus = "SHIPPED"
	StatusDelivered  OrderStatus = "DELIVERED"
	StatusCancelled  OrderStatus = "CANCELLED"
)

// OrderUserSummary represents customer summary embedded in admin order listings.
type OrderUserSummary struct {
	ID    string `json:"id,omitempty"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// OrderItemProduct represents snapshot product info in an order line item.
type OrderItemProduct struct {
	ID       string  `json:"id,omitempty"`
	Name     string  `json:"name"`
	Price    float64 `json:"price,omitempty"`
	ImageURL *string `json:"imageUrl,omitempty"`
}

// OrderItem represents a line item within a customer order.
type OrderItem struct {
	ID        string           `json:"id"`
	OrderID   string           `json:"orderId,omitempty"`
	ProductID string           `json:"productId"`
	Quantity  int              `json:"quantity"`
	Price     float64          `json:"price"`
	Size      *string          `json:"size,omitempty"`
	Product   OrderItemProduct `json:"product"`
}

// Order represents a complete order entity.
type Order struct {
	ID                 string            `json:"id"`
	OrderNumber        string            `json:"orderNumber"`
	UserID             string            `json:"userId"`
	Status             OrderStatus       `json:"status"`
	TotalAmount        float64           `json:"totalAmount"`
	ShippingAddress    *string           `json:"shippingAddress,omitempty"`
	ShippingCity       *string           `json:"shippingCity,omitempty"`
	ShippingPostalCode *string           `json:"shippingPostalCode,omitempty"`
	ShippingPhone      *string           `json:"shippingPhone,omitempty"`
	PaymentMethod      *string           `json:"paymentMethod,omitempty"`
	PaymentURL         *string           `json:"paymentUrl,omitempty"`
	CreatedAt          time.Time         `json:"createdAt"`
	UpdatedAt          time.Time         `json:"updatedAt"`
	Items              []OrderItem       `json:"items"`
	User               *OrderUserSummary `json:"user,omitempty"`
}

// CreateOrderInput represents user checkout submission payload.
type CreateOrderInput struct {
	ShippingAddress    string `json:"shippingAddress"`
	ShippingCity       string `json:"shippingCity"`
	ShippingPostalCode string `json:"shippingPostalCode"`
	ShippingPhone      string `json:"shippingPhone"`
	PaymentMethod      string `json:"paymentMethod"`
	Notes              string `json:"notes,omitempty"`
}

// OrderFilter holds query params for filtering order listings.
type OrderFilter struct {
	UserID string
	Scope  string // "all" for admin
	Status *OrderStatus
	Page   int
	Limit  int
}

// OrderRepository handles transactional database access for orders and stock adjustments.
type OrderRepository interface {
	CreateOrderWithTx(ctx context.Context, order *Order, items []OrderItem, cartID string) error
	FindByID(ctx context.Context, orderID string) (*Order, error)
	FindAll(ctx context.Context, filter OrderFilter) ([]Order, int, error)
	UpdateStatusWithTx(ctx context.Context, orderID string, newStatus OrderStatus, restock bool) (*Order, error)
}

// OrderService orchestrates business validation, atomic checkout, and state transitions.
type OrderService interface {
	Checkout(ctx context.Context, userID string, input CreateOrderInput) (*Order, error)
	ListOrders(ctx context.Context, userID, userRole string, filter OrderFilter) ([]Order, int, error)
	GetOrderDetail(ctx context.Context, userID, userRole, orderID string) (*Order, error)
	CancelOrder(ctx context.Context, userID, userRole, orderID string) (*Order, error)
	UpdateOrderStatus(ctx context.Context, orderID string, newStatus OrderStatus) (*Order, error)
}


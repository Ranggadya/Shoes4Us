package domain

import (
	"context"
	"time"
)

// Constants for Segment, Audience, and Collections
const (
	SegmentShoes       = "SHOES"
	SegmentApparel     = "APPAREL"
	SegmentAccessories = "ACCESSORIES"

	AudienceUnisex = "UNISEX"
	AudienceMen    = "MEN"
	AudienceWomen  = "WOMEN"
	AudienceKids   = "KIDS"

	CollectionNewArrivals = "new-arrivals"
	CollectionExclusive   = "exclusive"
	CollectionComingSoon  = "coming-soon"
	CollectionSale        = "sale"
)

// Category represents a product category in PostgreSQL.
type Category struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ProductSize represents available stock for a specific size variant.
type ProductSize struct {
	ID        string    `json:"id,omitempty"`
	ProductID string    `json:"productId,omitempty"`
	Size      string    `json:"size"`
	Stock     int       `json:"stock"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}

// Product represents a footwear/apparel catalog item.
type Product struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	Slug         string        `json:"slug"`
	Description  *string       `json:"description,omitempty"`
	Price        float64       `json:"price"`
	Stock        int           `json:"stock"`
	ImageURL     *string       `json:"imageUrl,omitempty"`
	CategoryID   string        `json:"categoryId"`
	Brand        *string       `json:"brand,omitempty"`
	Segment      string        `json:"segment"`
	Audience     string        `json:"audience"`
	IsNewArrival bool          `json:"isNewArrival"`
	IsExclusive  bool          `json:"isExclusive"`
	IsComingSoon bool          `json:"isComingSoon"`
	IsSale       bool          `json:"isSale"`
	IsActive     bool          `json:"isActive"`
	Category     *Category     `json:"category,omitempty"`
	Sizes        []ProductSize `json:"sizes,omitempty"`
	CreatedAt    time.Time     `json:"createdAt"`
	UpdatedAt    time.Time     `json:"updatedAt"`
}

// PaginationMeta contains pagination metadata.
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// ProductFilter represents all multi-criteria query parameters.
type ProductFilter struct {
	Search         string
	Category       string // category name or slug
	CategoryID     string
	Segment        string
	Audience       string
	Brand          string
	Collection     string // new-arrivals, exclusive, coming-soon, sale
	IsNewArrival   *bool
	IsExclusive    *bool
	IsComingSoon   *bool
	IsSale         *bool
	MinPrice       *float64
	MaxPrice       *float64
	SortBy         string // newest, oldest, price-asc, price-desc, name-asc, name-desc, stock-asc
	IncludeDetails bool
	Page           int
	Limit          int
}

// ProductListResult holds the paginated product items and metadata.
type ProductListResult struct {
	Items []Product      `json:"items"`
	Meta  PaginationMeta `json:"meta"`
}

// ProductSizeInput represents size variant input during product creation or update.
type ProductSizeInput struct {
	Size  string `json:"size"`
	Stock int    `json:"stock"`
}

// ProductUpsertInput is used for creating or updating products.
type ProductUpsertInput struct {
	Name         string             `json:"name"`
	Description  *string            `json:"description,omitempty"`
	Price        float64            `json:"price"`
	Stock        int                `json:"stock"`
	ImageURL     *string            `json:"imageUrl,omitempty"`
	CategoryID   string             `json:"categoryId,omitempty"`
	Category     string             `json:"category,omitempty"` // category name or slug
	Brand        *string            `json:"brand,omitempty"`
	Segment      string             `json:"segment"`
	Audience     string             `json:"audience"`
	IsNewArrival bool               `json:"isNewArrival"`
	IsExclusive  bool               `json:"isExclusive"`
	IsComingSoon bool               `json:"isComingSoon"`
	IsSale       bool               `json:"isSale"`
	IsActive     *bool              `json:"isActive,omitempty"`
	Sizes        []ProductSizeInput `json:"sizes,omitempty"`
}

// CategoryRepository defines category data access.
type CategoryRepository interface {
	FindAll(ctx context.Context) ([]Category, error)
	FindByID(ctx context.Context, id string) (*Category, error)
	FindByNameOrSlug(ctx context.Context, nameOrSlug string) (*Category, error)
	Create(ctx context.Context, category *Category) error
}

// ProductRepository defines product and size variant data access.
type ProductRepository interface {
	FindAll(ctx context.Context, filter ProductFilter) ([]Product, int, error)
	FindByIDOrSlug(ctx context.Context, idOrSlug string) (*Product, error)
	FindSizesByProductID(ctx context.Context, productID string) ([]ProductSize, error)
	FindSizesByProductIDs(ctx context.Context, productIDs []string) (map[string][]ProductSize, error)
	GetSizeStock(ctx context.Context, productID, size string) (int, error)
	HasOrderHistory(ctx context.Context, productID string) (bool, error)
	Create(ctx context.Context, product *Product, sizes []ProductSize) error
	Update(ctx context.Context, product *Product, sizes []ProductSize) error
	Delete(ctx context.Context, id string) error
	SoftDelete(ctx context.Context, id string) error
}

// ProductService defines catalog business operations.
type ProductService interface {
	ListCategories(ctx context.Context) ([]Category, error)
	CreateCategory(ctx context.Context, name, slug string) (*Category, error)
	ListProducts(ctx context.Context, filter ProductFilter) (*ProductListResult, error)
	GetProduct(ctx context.Context, idOrSlug string) (*Product, error)
	CreateProduct(ctx context.Context, input ProductUpsertInput) (*Product, error)
	UpdateProduct(ctx context.Context, id string, input ProductUpsertInput) (*Product, error)
	DeleteProduct(ctx context.Context, id string) (softDeleted bool, err error)
}

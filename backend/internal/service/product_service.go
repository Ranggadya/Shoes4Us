package service

import (
	"context"
	"fmt"
	"math"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

// ProductService implements domain.ProductService.
type ProductService struct {
	categoryRepo domain.CategoryRepository
	productRepo  domain.ProductRepository
}

var _ domain.ProductService = (*ProductService)(nil)

// NewProductService constructs a ProductService with given category and product repositories.
func NewProductService(categoryRepo domain.CategoryRepository, productRepo domain.ProductRepository) *ProductService {
	return &ProductService{
		categoryRepo: categoryRepo,
		productRepo:  productRepo,
	}
}

// ListCategories returns all active categories.
func (s *ProductService) ListCategories(ctx context.Context) ([]domain.Category, error) {
	return s.categoryRepo.FindAll(ctx)
}

// ListProducts returns filtered, paginated products.
func (s *ProductService) ListProducts(ctx context.Context, filter domain.ProductFilter) (*domain.ProductListResult, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}

	items, total, err := s.productRepo.FindAll(ctx, filter)
	if err != nil {
		return nil, err
	}

	totalPages := 0
	if filter.Limit > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(filter.Limit)))
	}

	return &domain.ProductListResult{
		Items: items,
		Meta: domain.PaginationMeta{
			Page:       filter.Page,
			Limit:      filter.Limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}

// GetProduct retrieves a single product by UUID ID or slug, populated with category and size variants.
func (s *ProductService) GetProduct(ctx context.Context, idOrSlug string) (*domain.Product, error) {
	clean := strings.TrimSpace(idOrSlug)
	if clean == "" {
		return nil, domain.NewBadRequest("ID atau slug produk wajib diisi")
	}

	product, err := s.productRepo.FindByIDOrSlug(ctx, clean)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, domain.NewNotFound("Produk tidak ditemukan")
	}

	sizes, err := s.productRepo.FindSizesByProductID(ctx, product.ID)
	if err != nil {
		return nil, err
	}
	product.Sizes = sizes

	return product, nil
}

// CreateProduct creates a new product and its size variants (Admin operation).
func (s *ProductService) CreateProduct(ctx context.Context, input domain.ProductUpsertInput) (*domain.Product, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, domain.NewBadRequest("Nama produk wajib diisi")
	}
	if input.Price <= 0 {
		return nil, domain.NewBadRequest("Harga produk harus lebih dari 0")
	}

	categoryID := strings.TrimSpace(input.CategoryID)
	if categoryID == "" && strings.TrimSpace(input.Category) != "" {
		// Resolve or auto-create category by name
		catName := strings.TrimSpace(input.Category)
		cat, err := s.categoryRepo.FindByNameOrSlug(ctx, catName)
		if err != nil {
			return nil, err
		}
		if cat == nil {
			catSlug := GenerateSlug(catName)
			newCat := &domain.Category{
				ID:   uuid.NewString(),
				Name: catName,
				Slug: catSlug,
			}
			if err := s.categoryRepo.Create(ctx, newCat); err != nil {
				return nil, err
			}
			categoryID = newCat.ID
		} else {
			categoryID = cat.ID
		}
	}

	if categoryID == "" {
		return nil, domain.NewBadRequest("Kategori produk wajib dipilih")
	}

	segment := strings.ToUpper(strings.TrimSpace(input.Segment))
	if segment == "" {
		segment = domain.SegmentShoes
	}

	audience := strings.ToUpper(strings.TrimSpace(input.Audience))
	if audience == "" {
		audience = domain.AudienceUnisex
	}

	productID := uuid.NewString()
	baseSlug := GenerateSlug(name)
	slug := fmt.Sprintf("%s-%s", baseSlug, productID[:8])

	product := &domain.Product{
		ID:           productID,
		Name:         name,
		Slug:         slug,
		Description:  input.Description,
		Price:        input.Price,
		Stock:        input.Stock,
		ImageURL:     input.ImageURL,
		CategoryID:   categoryID,
		Brand:        input.Brand,
		Segment:      segment,
		Audience:     audience,
		IsNewArrival: input.IsNewArrival,
		IsExclusive:  input.IsExclusive,
		IsComingSoon: input.IsComingSoon,
		IsSale:       input.IsSale,
		IsActive:     true,
	}

	var sizes []domain.ProductSize
	for _, s := range input.Sizes {
		cleanSize := strings.TrimSpace(s.Size)
		if cleanSize != "" {
			sizes = append(sizes, domain.ProductSize{
				Size:  cleanSize,
				Stock: s.Stock,
			})
		}
	}

	if err := s.productRepo.Create(ctx, product, sizes); err != nil {
		return nil, err
	}

	return s.GetProduct(ctx, product.ID)
}

// UpdateProduct updates an existing product and its size variants (Admin operation).
func (s *ProductService) UpdateProduct(ctx context.Context, id string, input domain.ProductUpsertInput) (*domain.Product, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return nil, domain.NewBadRequest("ID produk wajib diisi")
	}

	existing, err := s.productRepo.FindByIDOrSlug(ctx, cleanID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domain.NewNotFound("Produk tidak ditemukan")
	}

	if strings.TrimSpace(input.Name) != "" {
		existing.Name = strings.TrimSpace(input.Name)
	}
	if input.Price > 0 {
		existing.Price = input.Price
	}
	if input.Description != nil {
		existing.Description = input.Description
	}
	if input.ImageURL != nil && strings.TrimSpace(*input.ImageURL) != "" {
		existing.ImageURL = input.ImageURL
	}
	if input.Brand != nil {
		existing.Brand = input.Brand
	}
	if strings.TrimSpace(input.Segment) != "" {
		existing.Segment = strings.ToUpper(strings.TrimSpace(input.Segment))
	}
	if strings.TrimSpace(input.Audience) != "" {
		existing.Audience = strings.ToUpper(strings.TrimSpace(input.Audience))
	}
	existing.IsNewArrival = input.IsNewArrival
	existing.IsExclusive = input.IsExclusive
	existing.IsComingSoon = input.IsComingSoon
	existing.IsSale = input.IsSale
	if input.IsActive != nil {
		existing.IsActive = *input.IsActive
	}

	if strings.TrimSpace(input.CategoryID) != "" {
		existing.CategoryID = strings.TrimSpace(input.CategoryID)
	} else if strings.TrimSpace(input.Category) != "" {
		catName := strings.TrimSpace(input.Category)
		cat, err := s.categoryRepo.FindByNameOrSlug(ctx, catName)
		if err != nil {
			return nil, err
		}
		if cat != nil {
			existing.CategoryID = cat.ID
		}
	}

	var sizes []domain.ProductSize
	for _, s := range input.Sizes {
		cleanSize := strings.TrimSpace(s.Size)
		if cleanSize != "" {
			sizes = append(sizes, domain.ProductSize{
				Size:  cleanSize,
				Stock: s.Stock,
			})
		}
	}

	if err := s.productRepo.Update(ctx, existing, sizes); err != nil {
		return nil, err
	}

	return s.GetProduct(ctx, existing.ID)
}

// DeleteProduct deletes a product or soft-deletes it if historical orders reference it.
func (s *ProductService) DeleteProduct(ctx context.Context, id string) (bool, error) {
	cleanID := strings.TrimSpace(id)
	if cleanID == "" {
		return false, domain.NewBadRequest("ID produk wajib diisi")
	}

	hasOrders, err := s.productRepo.HasOrderHistory(ctx, cleanID)
	if err != nil {
		return false, err
	}

	if hasOrders {
		// Soft-delete to preserve foreign-key integrity in order_items
		if err := s.productRepo.SoftDelete(ctx, cleanID); err != nil {
			return false, err
		}
		return true, nil
	}

	if err := s.productRepo.Delete(ctx, cleanID); err != nil {
		return false, err
	}
	return false, nil
}

// GenerateSlug turns a string into an SEO-friendly URL slug.
func GenerateSlug(input string) string {
	lowered := strings.ToLower(strings.TrimSpace(input))
	replaced := slugRegex.ReplaceAllString(lowered, "-")
	return strings.Trim(replaced, "-")
}

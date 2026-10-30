package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

type fakeCategoryRepo struct {
	categories []domain.Category
}

func (r *fakeCategoryRepo) FindAll(_ context.Context) ([]domain.Category, error) {
	return r.categories, nil
}

func (r *fakeCategoryRepo) FindByID(_ context.Context, id string) (*domain.Category, error) {
	for _, c := range r.categories {
		if c.ID == id {
			return &c, nil
		}
	}
	return nil, nil
}

func (r *fakeCategoryRepo) FindByNameOrSlug(_ context.Context, nameOrSlug string) (*domain.Category, error) {
	for _, c := range r.categories {
		if strings.EqualFold(c.Name, nameOrSlug) || strings.EqualFold(c.Slug, nameOrSlug) {
			return &c, nil
		}
	}
	return nil, nil
}

func (r *fakeCategoryRepo) Create(_ context.Context, category *domain.Category) error {
	r.categories = append(r.categories, *category)
	return nil
}

type fakeProductRepo struct {
	products []domain.Product
	sizes    map[string][]domain.ProductSize
}

func newFakeProductRepo() *fakeProductRepo {
	return &fakeProductRepo{
		products: make([]domain.Product, 0),
		sizes:    make(map[string][]domain.ProductSize),
	}
}

func (r *fakeProductRepo) FindAll(_ context.Context, filter domain.ProductFilter) ([]domain.Product, int, error) {
	var filtered []domain.Product
	for _, p := range r.products {
		if filter.Search != "" {
			term := strings.ToLower(filter.Search)
			nameMatch := strings.Contains(strings.ToLower(p.Name), term)
			brandMatch := p.Brand != nil && strings.Contains(strings.ToLower(*p.Brand), term)
			if !nameMatch && !brandMatch {
				continue
			}
		}
		if filter.Category != "" {
			if p.Category == nil || (!strings.EqualFold(p.Category.Name, filter.Category) && !strings.EqualFold(p.Category.Slug, filter.Category)) {
				continue
			}
		}
		if filter.CategoryID != "" && p.CategoryID != filter.CategoryID {
			continue
		}
		if filter.Segment != "" && !strings.EqualFold(p.Segment, filter.Segment) {
			continue
		}
		if filter.Audience != "" && !strings.EqualFold(p.Audience, filter.Audience) {
			continue
		}
		if filter.Brand != "" {
			if p.Brand == nil || !strings.EqualFold(*p.Brand, filter.Brand) {
				continue
			}
		}
		if filter.Collection != "" {
			switch filter.Collection {
			case domain.CollectionNewArrivals:
				if !p.IsNewArrival {
					continue
				}
			case domain.CollectionExclusive:
				if !p.IsExclusive {
					continue
				}
			case domain.CollectionComingSoon:
				if !p.IsComingSoon {
					continue
				}
			case domain.CollectionSale:
				if !p.IsSale {
					continue
				}
			}
		}
		if filter.IsNewArrival != nil && p.IsNewArrival != *filter.IsNewArrival {
			continue
		}
		if filter.IsExclusive != nil && p.IsExclusive != *filter.IsExclusive {
			continue
		}
		if filter.IsComingSoon != nil && p.IsComingSoon != *filter.IsComingSoon {
			continue
		}
		if filter.IsSale != nil && p.IsSale != *filter.IsSale {
			continue
		}
		if filter.MinPrice != nil && p.Price < *filter.MinPrice {
			continue
		}
		if filter.MaxPrice != nil && p.Price > *filter.MaxPrice {
			continue
		}
		filtered = append(filtered, p)
	}

	total := len(filtered)
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	start := (page - 1) * limit
	if start >= total {
		return []domain.Product{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}

	return filtered[start:end], total, nil
}

func (r *fakeProductRepo) FindByIDOrSlug(_ context.Context, idOrSlug string) (*domain.Product, error) {
	for _, p := range r.products {
		if p.ID == idOrSlug || strings.EqualFold(p.Slug, idOrSlug) {
			cp := p
			return &cp, nil
		}
	}
	return nil, nil
}

func (r *fakeProductRepo) FindSizesByProductID(_ context.Context, productID string) ([]domain.ProductSize, error) {
	return r.sizes[productID], nil
}

func (r *fakeProductRepo) GetSizeStock(_ context.Context, productID, size string) (int, error) {
	for _, s := range r.sizes[productID] {
		if s.Size == size {
			return s.Stock, nil
		}
	}
	return 0, nil
}

func (r *fakeProductRepo) HasOrderHistory(_ context.Context, _ string) (bool, error) {
	return false, nil
}

func (r *fakeProductRepo) Create(_ context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	r.products = append(r.products, *product)
	r.sizes[product.ID] = sizes
	return nil
}

func (r *fakeProductRepo) Update(_ context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	for i, p := range r.products {
		if p.ID == product.ID {
			r.products[i] = *product
			r.sizes[product.ID] = sizes
			return nil
		}
	}
	return domain.NewNotFound("Produk tidak ditemukan")
}

func (r *fakeProductRepo) Delete(_ context.Context, id string) error {
	for i, p := range r.products {
		if p.ID == id {
			r.products = append(r.products[:i], r.products[i+1:]...)
			delete(r.sizes, id)
			return nil
		}
	}
	return domain.NewNotFound("Produk tidak ditemukan")
}

func (r *fakeProductRepo) SoftDelete(_ context.Context, id string) error {
	for i, p := range r.products {
		if p.ID == id {
			r.products[i].IsActive = false
			r.products[i].Stock = 0
			return nil
		}
	}
	return domain.NewNotFound("Produk tidak ditemukan")
}

func TestProductHandler_ListAndDetail(t *testing.T) {
	catRepo := &fakeCategoryRepo{
		categories: []domain.Category{
			{ID: "cat-1", Name: "Running", Slug: "running", IsActive: true},
			{ID: "cat-2", Name: "Sneakers", Slug: "sneakers", IsActive: true},
		},
	}

	prodRepo := newFakeProductRepo()
	brandNike := "Nike"
	p1 := domain.Product{
		ID:           "prod-1",
		Name:         "Air Zoom Pegasus",
		Slug:         "air-zoom-pegasus",
		Price:        1500000,
		Stock:        10,
		CategoryID:   "cat-1",
		Category:     &catRepo.categories[0],
		Brand:        &brandNike,
		Segment:      domain.SegmentShoes,
		Audience:     domain.AudienceMen,
		IsNewArrival: true,
		IsSale:       false,
		IsActive:     true,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
	p2 := domain.Product{
		ID:           "prod-2",
		Name:         "Air Jordan Retro",
		Slug:         "air-jordan-retro",
		Price:        2500000,
		Stock:        5,
		CategoryID:   "cat-2",
		Category:     &catRepo.categories[1],
		Brand:        &brandNike,
		Segment:      domain.SegmentShoes,
		Audience:     domain.AudienceMen,
		IsNewArrival: false,
		IsSale:       true,
		IsActive:     true,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
	_ = prodRepo.Create(context.Background(), &p1, []domain.ProductSize{
		{ID: "s1", ProductID: "prod-1", Size: "40", Stock: 5},
		{ID: "s2", ProductID: "prod-1", Size: "42", Stock: 5},
	})
	_ = prodRepo.Create(context.Background(), &p2, []domain.ProductSize{
		{ID: "s3", ProductID: "prod-2", Size: "42", Stock: 5},
	})

	prodSvc := service.NewProductService(catRepo, prodRepo)
	prodHandler := handler.NewProductHandler(prodSvc)

	router := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins: []string{"http://localhost:3000"},
		ProductHandler: prodHandler,
	})

	// 1. GET /api/categories
	catReq := httptest.NewRequest(http.MethodGet, "/api/categories", nil)
	catRec := httptest.NewRecorder()
	router.ServeHTTP(catRec, catReq)

	if catRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for /api/categories, got %d", catRec.Code)
	}

	var catRes struct {
		Success bool              `json:"success"`
		Data    []domain.Category `json:"data"`
	}
	if err := json.Unmarshal(catRec.Body.Bytes(), &catRes); err != nil {
		t.Fatalf("failed to decode categories json: %v", err)
	}
	if !catRes.Success || len(catRes.Data) != 2 {
		t.Fatalf("unexpected categories response: %+v", catRes)
	}

	// 2. GET /api/products with multi-filter
	prodReq := httptest.NewRequest(http.MethodGet, "/api/products?category=running&audience=MEN&isNewArrival=true", nil)
	prodRec := httptest.NewRecorder()
	router.ServeHTTP(prodRec, prodReq)

	if prodRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for /api/products, got %d: %s", prodRec.Code, prodRec.Body.String())
	}

	var listRes struct {
		Success bool `json:"success"`
		Data    struct {
			Items []domain.Product `json:"items"`
		} `json:"data"`
		Meta domain.PaginationMeta `json:"meta"`
	}
	if err := json.Unmarshal(prodRec.Body.Bytes(), &listRes); err != nil {
		t.Fatalf("failed to decode products json: %v", err)
	}
	if !listRes.Success || len(listRes.Data.Items) != 1 || listRes.Data.Items[0].ID != "prod-1" {
		t.Fatalf("unexpected filtered products response: %+v", listRes)
	}
	if listRes.Meta.Total != 1 {
		t.Fatalf("expected meta.total = 1, got %d", listRes.Meta.Total)
	}

	// 3. GET /api/products/{id} (by slug) with sizes and category
	detailReq := httptest.NewRequest(http.MethodGet, "/api/products/air-zoom-pegasus", nil)
	detailRec := httptest.NewRecorder()
	router.ServeHTTP(detailRec, detailReq)

	if detailRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for detail by slug, got %d: %s", detailRec.Code, detailRec.Body.String())
	}

	var detailRes struct {
		Success bool `json:"success"`
		Data    struct {
			Product domain.Product `json:"product"`
		} `json:"data"`
	}
	if err := json.Unmarshal(detailRec.Body.Bytes(), &detailRes); err != nil {
		t.Fatalf("failed to decode product detail json: %v", err)
	}
	if detailRes.Data.Product.ID != "prod-1" {
		t.Fatalf("expected product ID prod-1, got %q", detailRes.Data.Product.ID)
	}
	if len(detailRes.Data.Product.Sizes) != 2 {
		t.Fatalf("expected 2 sizes attached, got %d", len(detailRes.Data.Product.Sizes))
	}
	if detailRes.Data.Product.Category == nil || detailRes.Data.Product.Category.Name != "Running" {
		t.Fatalf("expected category Running attached, got %+v", detailRes.Data.Product.Category)
	}

	// 4. GET /api/products/{id} not found
	notFoundReq := httptest.NewRequest(http.MethodGet, "/api/products/non-existent-product", nil)
	notFoundRec := httptest.NewRecorder()
	router.ServeHTTP(notFoundRec, notFoundReq)

	if notFoundRec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 Not Found, got %d", notFoundRec.Code)
	}
}

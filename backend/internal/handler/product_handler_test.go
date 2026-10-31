package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/service"
	"github.com/ranggadya/shoes4us/backend/pkg/token"
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
	products      []domain.Product
	sizes         map[string][]domain.ProductSize
	ordersHistory map[string]bool
}

func newFakeProductRepo() *fakeProductRepo {
	return &fakeProductRepo{
		products:      make([]domain.Product, 0),
		sizes:         make(map[string][]domain.ProductSize),
		ordersHistory: make(map[string]bool),
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

func (r *fakeProductRepo) FindSizesByProductIDs(_ context.Context, productIDs []string) (map[string][]domain.ProductSize, error) {
	out := make(map[string][]domain.ProductSize)
	for _, id := range productIDs {
		out[id] = r.sizes[id]
	}
	return out, nil
}

func (r *fakeProductRepo) GetSizeStock(_ context.Context, productID, size string) (int, error) {
	for _, s := range r.sizes[productID] {
		if s.Size == size {
			return s.Stock, nil
		}
	}
	return 0, nil
}

func (r *fakeProductRepo) HasOrderHistory(_ context.Context, productID string) (bool, error) {
	return r.ordersHistory[productID], nil
}

func (r *fakeProductRepo) Create(_ context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	if len(sizes) > 0 {
		totalStock := 0
		for _, s := range sizes {
			totalStock += s.Stock
		}
		product.Stock = totalStock
	}
	r.products = append(r.products, *product)
	r.sizes[product.ID] = sizes
	return nil
}

func (r *fakeProductRepo) Update(_ context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	if len(sizes) > 0 {
		totalStock := 0
		for _, s := range sizes {
			totalStock += s.Stock
		}
		product.Stock = totalStock
	}
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
			for sIdx := range r.sizes[id] {
				r.sizes[id][sIdx].Stock = 0
			}
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

func TestProductHandler_Create_MultipartFormData(t *testing.T) {
	tempUploadDir := t.TempDir()

	catRepo := &fakeCategoryRepo{
		categories: []domain.Category{
			{ID: "cat-1", Name: "Running", Slug: "running", IsActive: true},
		},
	}
	prodRepo := newFakeProductRepo()
	prodSvc := service.NewProductService(catRepo, prodRepo)
	prodHandler := handler.NewProductHandler(prodSvc).WithUploadDir(tempUploadDir)

	jwtMgr := token.NewJWTManager("test-secret-key-32-chars-long!", 1)
	adminToken, err := jwtMgr.Sign(token.UserClaims{
		UserID: "admin-1",
		Email:  "admin@shoes4us.com",
		Name:   "Admin Shoes4Us",
		Role:   domain.RoleAdmin,
	})
	if err != nil {
		t.Fatalf("failed to sign admin token: %v", err)
	}

	router := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins: []string{"http://localhost:3000"},
		UploadDir:      tempUploadDir,
		JWTManager:     jwtMgr,
		ProductHandler: prodHandler,
	})

	// Prepare multipart form with text fields, JSON sizes string, and image file
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	_ = writer.WriteField("name", "Air Zoom Pegasus 39")
	_ = writer.WriteField("price", "1799000")
	_ = writer.WriteField("category", "Running")
	_ = writer.WriteField("brand", "Nike")
	_ = writer.WriteField("audience", "MEN")
	_ = writer.WriteField("segment", "SHOES")
	_ = writer.WriteField("description", "Sepatu lari pria responsif")
	_ = writer.WriteField("isNewArrival", "true")
	_ = writer.WriteField("sizes", `[{"size":"40","stock":3},{"size":"42","stock":5}]`)

	// PNG magic bytes
	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D}
	part, err := writer.CreateFormFile("image", "pegasus.png")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = part.Write(pngHeader)
	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/products", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+adminToken)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	var res struct {
		Success bool `json:"success"`
		Data    struct {
			Product domain.Product `json:"product"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	prod := res.Data.Product
	if prod.Name != "Air Zoom Pegasus 39" {
		t.Errorf("expected product name 'Air Zoom Pegasus 39', got %q", prod.Name)
	}
	if prod.Stock != 8 {
		t.Errorf("expected total stock 8 (3+5), got %d", prod.Stock)
	}
	if len(prod.Sizes) != 2 {
		t.Errorf("expected 2 sizes, got %d", len(prod.Sizes))
	}
	if prod.ImageURL == nil || !strings.HasPrefix(*prod.ImageURL, "/uploads/") {
		t.Errorf("expected imageUrl to start with /uploads/, got %v", prod.ImageURL)
	} else {
		filename := filepath.Base(*prod.ImageURL)
		savedFile := filepath.Join(tempUploadDir, filename)
		if _, err := os.Stat(savedFile); err != nil {
			t.Errorf("expected uploaded image file to exist at %s: %v", savedFile, err)
		}
	}
}

func TestProductService_DeleteProduct_SoftDeletesWhenOrdered(t *testing.T) {
	catRepo := &fakeCategoryRepo{
		categories: []domain.Category{
			{ID: "cat-1", Name: "Running", Slug: "running", IsActive: true},
		},
	}
	prodRepo := newFakeProductRepo()

	p1 := domain.Product{
		ID:         "prod-ordered",
		Name:       "Historical Shoes",
		Slug:       "historical-shoes",
		Price:      1000000,
		Stock:      10,
		CategoryID: "cat-1",
		IsActive:   true,
	}
	p2 := domain.Product{
		ID:         "prod-unopened",
		Name:       "Brand New Shoes",
		Slug:       "brand-new-shoes",
		Price:      2000000,
		Stock:      5,
		CategoryID: "cat-1",
		IsActive:   true,
	}

	_ = prodRepo.Create(context.Background(), &p1, nil)
	_ = prodRepo.Create(context.Background(), &p2, nil)
	prodRepo.ordersHistory["prod-ordered"] = true
	prodRepo.ordersHistory["prod-unopened"] = false

	prodSvc := service.NewProductService(catRepo, prodRepo)

	// Case 1: Product with order history -> soft-delete
	softDeleted, err := prodSvc.DeleteProduct(context.Background(), "prod-ordered")
	if err != nil {
		t.Fatalf("unexpected error deleting ordered product: %v", err)
	}
	if !softDeleted {
		t.Fatalf("expected softDeleted = true for product with order history")
	}
	updated, _ := prodRepo.FindByIDOrSlug(context.Background(), "prod-ordered")
	if updated == nil || updated.IsActive || updated.Stock != 0 {
		t.Fatalf("expected product to be soft-deleted (isActive=false, stock=0), got %+v", updated)
	}

	// Case 2: Product without order history -> hard delete
	softDeleted2, err := prodSvc.DeleteProduct(context.Background(), "prod-unopened")
	if err != nil {
		t.Fatalf("unexpected error deleting unordered product: %v", err)
	}
	if softDeleted2 {
		t.Fatalf("expected softDeleted = false for product without order history")
	}
	deleted, _ := prodRepo.FindByIDOrSlug(context.Background(), "prod-unopened")
	if deleted != nil {
		t.Fatalf("expected product to be permanently removed, got %+v", deleted)
	}
}

func TestProductHandler_AdminCRUD_And_IncludeDetails(t *testing.T) {
	tempDir := t.TempDir()
	catRepo := &fakeCategoryRepo{
		categories: []domain.Category{
			{ID: "cat-1", Name: "Basketball", Slug: "basketball", IsActive: true},
		},
	}
	prodRepo := newFakeProductRepo()
	prodSvc := service.NewProductService(catRepo, prodRepo)
	prodHandler := handler.NewProductHandler(prodSvc).WithUploadDir(tempDir)

	jwtMgr := token.NewJWTManager("test-secret-key-32-chars-long!", 1)
	adminToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: "admin-1",
		Email:  "admin@shoes4us.com",
		Role:   domain.RoleAdmin,
	})
	userToken, _ := jwtMgr.Sign(token.UserClaims{
		UserID: "user-1",
		Email:  "user@shoes4us.com",
		Role:   domain.RoleUser,
	})

	router := handler.NewRouter(handler.RouterDependencies{
		AllowedOrigins: []string{"http://localhost:3000"},
		UploadDir:      tempDir,
		JWTManager:     jwtMgr,
		ProductHandler: prodHandler,
	})

	// 1. POST /api/categories by Admin
	catJSON := `{"name":"Training","slug":"training"}`
	catReq := httptest.NewRequest(http.MethodPost, "/api/categories", strings.NewReader(catJSON))
	catReq.Header.Set("Content-Type", "application/json")
	catReq.Header.Set("Authorization", "Bearer "+adminToken)
	catRec := httptest.NewRecorder()
	router.ServeHTTP(catRec, catReq)

	if catRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for POST /api/categories, got %d: %s", catRec.Code, catRec.Body.String())
	}

	// 2. POST /api/products by Non-Admin returns 403 Forbidden
	prodJSON := `{"name":"Jordan 1","price":2000000,"category":"Basketball","sizes":[{"size":"42","stock":10}]}`
	forbidReq := httptest.NewRequest(http.MethodPost, "/api/products", strings.NewReader(prodJSON))
	forbidReq.Header.Set("Content-Type", "application/json")
	forbidReq.Header.Set("Authorization", "Bearer "+userToken)
	forbidRec := httptest.NewRecorder()
	router.ServeHTTP(forbidRec, forbidReq)

	if forbidRec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for non-admin product creation, got %d", forbidRec.Code)
	}

	// 3. POST /api/products with JSON by Admin
	createReq := httptest.NewRequest(http.MethodPost, "/api/products", strings.NewReader(prodJSON))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer "+adminToken)
	createRec := httptest.NewRecorder()
	router.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for admin product creation, got %d: %s", createRec.Code, createRec.Body.String())
	}

	var createRes struct {
		Data struct {
			Product domain.Product `json:"product"`
		} `json:"data"`
	}
	_ = json.Unmarshal(createRec.Body.Bytes(), &createRes)
	createdID := createRes.Data.Product.ID
	if createdID == "" {
		t.Fatalf("expected product ID to be set")
	}

	// 4. GET /api/products?includeDetails=true verifies sizes are attached
	listReq := httptest.NewRequest(http.MethodGet, "/api/products?includeDetails=true", nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for list products with includeDetails, got %d", listRec.Code)
	}
	var listRes struct {
		Data struct {
			Items []domain.Product `json:"items"`
		} `json:"data"`
	}
	_ = json.Unmarshal(listRec.Body.Bytes(), &listRes)
	if len(listRes.Data.Items) == 0 || len(listRes.Data.Items[0].Sizes) == 0 {
		t.Fatalf("expected sizes to be populated when includeDetails=true, got %+v", listRes.Data.Items)
	}

	// 5. PUT /api/products/:id updates price and sizes
	updateJSON := `{"name":"Jordan 1 High","price":2200000,"category":"Basketball","sizes":[{"size":"42","stock":8}]}`
	updateReq := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/products/%s", createdID), strings.NewReader(updateJSON))
	updateReq.Header.Set("Content-Type", "application/json")
	updateReq.Header.Set("Authorization", "Bearer "+adminToken)
	updateRec := httptest.NewRecorder()
	router.ServeHTTP(updateRec, updateReq)

	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for product update, got %d: %s", updateRec.Code, updateRec.Body.String())
	}

	// 6. DELETE /api/products/:id deletes the product
	delReq := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/products/%s", createdID), nil)
	delReq.Header.Set("Authorization", "Bearer "+adminToken)
	delRec := httptest.NewRecorder()
	router.ServeHTTP(delRec, delReq)

	if delRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for product deletion, got %d: %s", delRec.Code, delRec.Body.String())
	}
}

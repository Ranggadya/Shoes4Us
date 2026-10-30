package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// ProductHandler handles HTTP requests for categories and product catalog.
type ProductHandler struct {
	productService domain.ProductService
	uploadDir      string
}

// NewProductHandler constructs a new ProductHandler.
func NewProductHandler(productService domain.ProductService) *ProductHandler {
	return &ProductHandler{
		productService: productService,
		uploadDir:      "./uploads",
	}
}

// WithUploadDir configures the directory where uploaded product images are saved.
func (h *ProductHandler) WithUploadDir(dir string) *ProductHandler {
	if strings.TrimSpace(dir) != "" {
		h.uploadDir = dir
	}
	return h
}

// ListCategories handles GET /api/categories.
func (h *ProductHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.productService.ListCategories(r.Context())
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Kategori berhasil diambil", categories, nil)
}

// ListProducts handles GET /api/products.
func (h *ProductHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	filter := domain.ProductFilter{
		Search:     strings.TrimSpace(q.Get("search")),
		Category:   strings.TrimSpace(q.Get("category")),
		CategoryID: strings.TrimSpace(q.Get("categoryId")),
		Segment:    strings.TrimSpace(q.Get("segment")),
		Audience:   strings.TrimSpace(q.Get("audience")),
		Brand:      strings.TrimSpace(q.Get("brand")),
		Collection: strings.TrimSpace(q.Get("collection")),
		SortBy:     strings.TrimSpace(q.Get("sortBy")),
	}

	if q.Get("isNewArrival") != "" {
		val := strings.EqualFold(q.Get("isNewArrival"), "true")
		filter.IsNewArrival = &val
	}
	if q.Get("isExclusive") != "" {
		val := strings.EqualFold(q.Get("isExclusive"), "true")
		filter.IsExclusive = &val
	}
	if q.Get("isComingSoon") != "" {
		val := strings.EqualFold(q.Get("isComingSoon"), "true")
		filter.IsComingSoon = &val
	}
	// Support either isSale or sale query param
	saleParam := q.Get("isSale")
	if saleParam == "" {
		saleParam = q.Get("sale")
	}
	if saleParam != "" {
		val := strings.EqualFold(saleParam, "true")
		filter.IsSale = &val
	}

	if minPriceStr := q.Get("minPrice"); minPriceStr != "" {
		if val, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			filter.MinPrice = &val
		}
	}
	if maxPriceStr := q.Get("maxPrice"); maxPriceStr != "" {
		if val, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			filter.MaxPrice = &val
		}
	}

	filter.IncludeDetails = strings.EqualFold(q.Get("includeDetails"), "true")

	// Paging params
	page := 1
	if pageStr := q.Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	filter.Page = page

	limit := 20
	limitParam := q.Get("limit")
	if limitParam == "" {
		limitParam = q.Get("pageSize")
	}
	if limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil && l > 0 {
			limit = l
		}
	}
	filter.Limit = limit

	result, err := h.productService.ListProducts(r.Context(), filter)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	data := map[string]any{
		"items": result.Items,
	}

	response.WriteSuccess(w, http.StatusOK, "Daftar produk berhasil diambil", data, result.Meta)
}

// GetProduct handles GET /api/products/{id}.
func (h *ProductHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	idOrSlug := chi.URLParam(r, "id")
	if strings.TrimSpace(idOrSlug) == "" {
		response.WriteError(w, domain.NewBadRequest("ID atau slug produk wajib diisi"))
		return
	}

	product, err := h.productService.GetProduct(r.Context(), idOrSlug)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	data := map[string]any{
		"product": product,
	}

	response.WriteSuccess(w, http.StatusOK, "Detail produk berhasil diambil", data, nil)
}

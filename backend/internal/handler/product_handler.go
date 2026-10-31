package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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

// CreateCategory handles POST /api/categories (Admin operation).
func (h *ProductHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var name, slug string

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		_ = r.ParseMultipartForm(1 << 20)
		name = r.FormValue("name")
		slug = r.FormValue("slug")
	} else if strings.HasPrefix(contentType, "application/json") {
		var req struct {
			Name string `json:"name"`
			Slug string `json:"slug"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			name = req.Name
			slug = req.Slug
		}
	} else {
		name = r.FormValue("name")
		slug = r.FormValue("slug")
	}

	category, err := h.productService.CreateCategory(r.Context(), name, slug)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteCreated(w, "Kategori berhasil dibuat", category)
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

// CreateProduct handles POST /api/products (Admin operation).
func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	input, err := h.parseProductUpsertInput(r)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	product, err := h.productService.CreateProduct(r.Context(), *input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	data := map[string]any{
		"product": product,
	}

	response.WriteCreated(w, "Produk berhasil dibuat", data)
}

// UpdateProduct handles PUT /api/products/{id} (Admin operation).
func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if strings.TrimSpace(id) == "" {
		response.WriteError(w, domain.NewBadRequest("ID produk wajib diisi"))
		return
	}

	input, err := h.parseProductUpsertInput(r)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	product, err := h.productService.UpdateProduct(r.Context(), id, *input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	data := map[string]any{
		"product": product,
	}

	response.WriteSuccess(w, http.StatusOK, "Produk berhasil diperbarui", data, nil)
}

// DeleteProduct handles DELETE /api/products/{id} (Admin operation).
func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if strings.TrimSpace(id) == "" {
		response.WriteError(w, domain.NewBadRequest("ID produk wajib diisi"))
		return
	}

	softDeleted, err := h.productService.DeleteProduct(r.Context(), id)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	msg := "Produk berhasil dihapus"
	if softDeleted {
		msg = "Produk dinonaktifkan karena memiliki riwayat pesanan"
	}

	data := map[string]any{
		"softDeleted": softDeleted,
	}

	response.WriteSuccess(w, http.StatusOK, msg, data, nil)
}

func (h *ProductHandler) parseProductUpsertInput(r *http.Request) (*domain.ProductUpsertInput, error) {
	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(5 << 20); err != nil {
			return nil, domain.NewBadRequest("Form data tidak valid: " + err.Error())
		}

		var input domain.ProductUpsertInput
		input.Name = strings.TrimSpace(r.FormValue("name"))
		input.Category = strings.TrimSpace(r.FormValue("category"))
		input.CategoryID = strings.TrimSpace(r.FormValue("categoryId"))

		if b := strings.TrimSpace(r.FormValue("brand")); b != "" {
			input.Brand = &b
		}
		input.Audience = strings.TrimSpace(r.FormValue("audience"))
		input.Segment = strings.TrimSpace(r.FormValue("segment"))

		if desc := strings.TrimSpace(r.FormValue("description")); desc != "" {
			input.Description = &desc
		}

		if pStr := strings.TrimSpace(r.FormValue("price")); pStr != "" {
			if p, err := strconv.ParseFloat(pStr, 64); err == nil {
				input.Price = p
			}
		}

		if sStr := strings.TrimSpace(r.FormValue("stock")); sStr != "" {
			if s, err := strconv.Atoi(sStr); err == nil {
				input.Stock = s
			}
		}

		if imgURL := strings.TrimSpace(r.FormValue("imageUrl")); imgURL != "" {
			input.ImageURL = &imgURL
		}

		uploadedURL, err := h.saveUploadedImage(r)
		if err != nil {
			return nil, err
		}
		if uploadedURL != nil {
			input.ImageURL = uploadedURL
		}

		if r.FormValue("isNewArrival") != "" {
			input.IsNewArrival = strings.EqualFold(r.FormValue("isNewArrival"), "true")
		}
		if r.FormValue("isExclusive") != "" {
			input.IsExclusive = strings.EqualFold(r.FormValue("isExclusive"), "true")
		}
		if r.FormValue("isComingSoon") != "" {
			input.IsComingSoon = strings.EqualFold(r.FormValue("isComingSoon"), "true")
		}
		if r.FormValue("isSale") != "" {
			input.IsSale = strings.EqualFold(r.FormValue("isSale"), "true")
		}
		if r.FormValue("isActive") != "" {
			active := strings.EqualFold(r.FormValue("isActive"), "true")
			input.IsActive = &active
		}

		if sizesStr := strings.TrimSpace(r.FormValue("sizes")); sizesStr != "" {
			var sizes []domain.ProductSizeInput
			if err := json.Unmarshal([]byte(sizesStr), &sizes); err != nil {
				return nil, domain.NewBadRequest("Format JSON untuk sizes tidak valid: " + err.Error())
			}
			input.Sizes = sizes
		}

		return &input, nil
	}

	// JSON request body
	var input domain.ProductUpsertInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		return nil, domain.NewBadRequest("Payload JSON tidak valid: " + err.Error())
	}

	return &input, nil
}

func (h *ProductHandler) saveUploadedImage(r *http.Request) (*string, error) {
	file, header, err := r.FormFile("image")
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			file, header, err = r.FormFile("file")
			if err != nil {
				if errors.Is(err, http.ErrMissingFile) {
					return nil, nil
				}
				return nil, domain.NewBadRequest("Gagal membaca file gambar: " + err.Error())
			}
		} else {
			return nil, domain.NewBadRequest("Gagal membaca file gambar: " + err.Error())
		}
	}
	defer file.Close()

	if header.Size > 5*1024*1024 {
		return nil, domain.NewBadRequest("Ukuran file gambar maksimal 5MB")
	}

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return nil, domain.NewBadRequest("Gagal membaca konten file gambar")
	}

	mimeType := http.DetectContentType(buf[:n])
	if !strings.HasPrefix(mimeType, "image/") {
		return nil, domain.NewBadRequest("Format file harus berupa gambar")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, domain.NewInternal("Gagal memproses file gambar")
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" || !isAllowedImageExt(ext) {
		switch mimeType {
		case "image/jpeg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/webp":
			ext = ".webp"
		case "image/gif":
			ext = ".gif"
		default:
			ext = ".jpg"
		}
	}

	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		return nil, domain.NewInternal("Gagal menyiapkan direktori penyimpanan gambar")
	}

	filename := fmt.Sprintf("%s%s", uuid.NewString(), ext)
	dstPath := filepath.Join(h.uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return nil, domain.NewInternal("Gagal menyimpan file gambar")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return nil, domain.NewInternal("Gagal menulis file gambar")
	}

	urlPath := "/uploads/" + filename
	return &urlPath, nil
}

func isAllowedImageExt(ext string) bool {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif":
		return true
	default:
		return false
	}
}

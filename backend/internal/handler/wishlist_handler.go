package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/middleware"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// WishlistHandler manages HTTP endpoints for the customer wishlist.
type WishlistHandler struct {
	wishlistService domain.WishlistService
}

// NewWishlistHandler creates a new WishlistHandler.
func NewWishlistHandler(wishlistService domain.WishlistService) *WishlistHandler {
	return &WishlistHandler{wishlistService: wishlistService}
}

// GetWishlist handles GET /api/wishlist with optional ?fields=ids fast mode.
func (h *WishlistHandler) GetWishlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses wishlist"))
		return
	}

	fields := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("fields")))
	if fields == "ids" {
		items, err := h.wishlistService.GetWishlistIDs(r.Context(), claims.UserID)
		if err != nil {
			response.WriteError(w, err)
			return
		}
		response.WriteSuccess(w, http.StatusOK, "Wishlist IDs retrieved successfully", map[string]any{
			"items": items,
		}, nil)
		return
	}

	items, err := h.wishlistService.GetFullWishlist(r.Context(), claims.UserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Wishlist retrieved successfully", map[string]any{
		"items": items,
	}, nil)
}

// AddToWishlist handles POST /api/wishlist.
func (h *WishlistHandler) AddToWishlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses wishlist"))
		return
	}

	var input struct {
		ProductID string `json:"productId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	input.ProductID = strings.TrimSpace(input.ProductID)
	if input.ProductID == "" {
		response.WriteError(w, domain.NewBadRequest("Product ID wajib diisi"))
		return
	}

	item, err := h.wishlistService.AddToWishlist(r.Context(), claims.UserID, input.ProductID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Produk berhasil ditambahkan ke wishlist", item, nil)
}

// RemoveFromWishlist handles DELETE /api/wishlist/{productId}.
func (h *WishlistHandler) RemoveFromWishlist(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses wishlist"))
		return
	}

	productID := strings.TrimSpace(chi.URLParam(r, "productId"))
	if productID == "" {
		response.WriteError(w, domain.NewBadRequest("Product ID wajib diisi"))
		return
	}

	if err := h.wishlistService.RemoveFromWishlist(r.Context(), claims.UserID, productID); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Produk berhasil dihapus dari wishlist", map[string]string{
		"message": "Item removed from wishlist",
	}, nil)
}

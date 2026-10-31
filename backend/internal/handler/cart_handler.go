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

// CartHandler manages HTTP requests for the user's shopping cart.
type CartHandler struct {
	cartService domain.CartService
}

// NewCartHandler creates a new CartHandler.
func NewCartHandler(cartService domain.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

// GetCart handles GET /api/cart.
func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses keranjang"))
		return
	}

	cart, err := h.cartService.GetCart(r.Context(), claims.UserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Keranjang berhasil diambil", cart, nil)
}

// AddToCart handles POST /api/cart.
func (h *CartHandler) AddToCart(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses keranjang"))
		return
	}

	var input domain.AddToCartInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	cart, err := h.cartService.AddToCart(r.Context(), claims.UserID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Item berhasil ditambahkan ke keranjang", cart, nil)
}

// UpdateCartItem handles PATCH /api/cart/{itemId} and PUT /api/cart/{itemId}.
func (h *CartHandler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses keranjang"))
		return
	}

	itemID := strings.TrimSpace(chi.URLParam(r, "itemId"))
	if itemID == "" {
		response.WriteError(w, domain.NewBadRequest("ID item wajib diisi"))
		return
	}

	var input domain.UpdateCartItemInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request tidak valid"))
		return
	}

	cart, err := h.cartService.UpdateCartItem(r.Context(), claims.UserID, itemID, input.Quantity)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Kuantitas item keranjang berhasil diperbarui", cart, nil)
}

// RemoveCartItem handles DELETE /api/cart/{itemId}.
func (h *CartHandler) RemoveCartItem(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses keranjang"))
		return
	}

	itemID := strings.TrimSpace(chi.URLParam(r, "itemId"))
	if itemID == "" {
		response.WriteError(w, domain.NewBadRequest("ID item wajib diisi"))
		return
	}

	cart, err := h.cartService.RemoveCartItem(r.Context(), claims.UserID, itemID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Item berhasil dihapus dari keranjang", cart, nil)
}

// ClearCart handles DELETE /api/cart.
func (h *CartHandler) ClearCart(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok || claims == nil {
		response.WriteError(w, domain.NewUnauthorized("Silakan login untuk mengakses keranjang"))
		return
	}

	cart, err := h.cartService.ClearCart(r.Context(), claims.UserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Keranjang berhasil dikosongkan", cart, nil)
}

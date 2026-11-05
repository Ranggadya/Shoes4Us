package handler

import (
	"net/http"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// ShippingHandler handles HTTP endpoints for courier options and shipping rate estimation.
type ShippingHandler struct{}

// NewShippingHandler creates a new ShippingHandler.
func NewShippingHandler() *ShippingHandler {
	return &ShippingHandler{}
}

// ListCouriers handles GET /api/shipping/couriers.
func (h *ShippingHandler) ListCouriers(w http.ResponseWriter, _ *http.Request) {
	couriers := domain.DefaultCouriers()
	response.WriteSuccess(w, http.StatusOK, "Daftar kurir pengiriman berhasil diambil", couriers, nil)
}

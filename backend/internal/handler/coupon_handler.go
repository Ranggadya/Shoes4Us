package handler

import (
	"encoding/json"
	"net/http"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/pkg/response"
)

// CouponHandler handles HTTP endpoints for promotional vouchers.
type CouponHandler struct {
	couponService domain.CouponService
}

// NewCouponHandler creates a new CouponHandler.
func NewCouponHandler(couponService domain.CouponService) *CouponHandler {
	return &CouponHandler{
		couponService: couponService,
	}
}

// ListCoupons handles GET /api/coupons.
func (h *CouponHandler) ListCoupons(w http.ResponseWriter, _ *http.Request) {
	coupons := h.couponService.ListCoupons()
	response.WriteSuccess(w, http.StatusOK, "Daftar kupon promo berhasil diambil", coupons, nil)
}

// ValidateCoupon handles POST /api/coupons/validate.
func (h *CouponHandler) ValidateCoupon(w http.ResponseWriter, r *http.Request) {
	var input domain.ValidateCouponInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, domain.NewBadRequest("Format request validasi kupon tidak valid"))
		return
	}

	result, err := h.couponService.Validate(input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteSuccess(w, http.StatusOK, "Voucher berhasil diterapkan", result, nil)
}


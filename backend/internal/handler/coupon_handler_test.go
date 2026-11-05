package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

func TestCouponHandler_ValidateAndList(t *testing.T) {
	couponSvc := service.NewCouponService()
	couponHandler := handler.NewCouponHandler(couponSvc)
	router := handler.NewRouter(handler.RouterDependencies{
		CouponHandler: couponHandler,
	})

	// 1. GET /api/coupons returns list of active vouchers
	reqList := httptest.NewRequest(http.MethodGet, "/api/coupons", nil)
	recList := httptest.NewRecorder()
	router.ServeHTTP(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on GET /api/coupons, got %d", recList.Code)
	}

	// 2. POST /api/coupons/validate with valid DISKON10
	body, _ := json.Marshal(domain.ValidateCouponInput{
		Code:     "DISKON10",
		Subtotal: 400000,
	})
	reqVal := httptest.NewRequest(http.MethodPost, "/api/coupons/validate", bytes.NewReader(body))
	reqVal.Header.Set("Content-Type", "application/json")
	recVal := httptest.NewRecorder()
	router.ServeHTTP(recVal, reqVal)

	if recVal.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on valid coupon, got %d: %s", recVal.Code, recVal.Body.String())
	}

	var res struct {
		Success bool                          `json:"success"`
		Data    domain.CouponValidationResult `json:"data"`
	}
	if err := json.Unmarshal(recVal.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if res.Data.DiscountAmount != 40000 {
		t.Fatalf("expected discount 40000, got %v", res.Data.DiscountAmount)
	}

	// 3. POST /api/coupons/validate with invalid code -> 400
	badBody, _ := json.Marshal(domain.ValidateCouponInput{
		Code:     "INVALID99",
		Subtotal: 400000,
	})
	reqBad := httptest.NewRequest(http.MethodPost, "/api/coupons/validate", bytes.NewReader(badBody))
	reqBad.Header.Set("Content-Type", "application/json")
	recBad := httptest.NewRecorder()
	router.ServeHTTP(recBad, reqBad)

	if recBad.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request on invalid coupon, got %d", recBad.Code)
	}
}


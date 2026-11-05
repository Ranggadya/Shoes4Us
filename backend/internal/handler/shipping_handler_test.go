package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/handler"
)

func TestShippingHandler_ListCouriers(t *testing.T) {
	shippingHandler := handler.NewShippingHandler()
	router := handler.NewRouter(handler.RouterDependencies{
		ShippingHandler: shippingHandler,
	})

	req := httptest.NewRequest(http.MethodGet, "/api/shipping/couriers", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on GET /api/shipping/couriers, got %d: %s", rec.Code, rec.Body.String())
	}

	var res struct {
		Success bool                    `json:"success"`
		Data    []domain.CourierOption  `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode couriers response: %v", err)
	}

	if len(res.Data) < 3 {
		t.Fatalf("expected at least 3 couriers, got %d", len(res.Data))
	}
}

package service_test

import (
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

func TestCouponService_Validate(t *testing.T) {
	svc := service.NewCouponService()

	t.Run("DISKON10 applies 10 percent uncapped below max", func(t *testing.T) {
		res, err := svc.Validate(domain.ValidateCouponInput{
			Code:     "diskon10",
			Subtotal: 200000,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.Code != "DISKON10" || res.DiscountAmount != 20000 {
			t.Fatalf("expected DISKON10 discount 20000, got %+v", res)
		}
	})

	t.Run("DISKON10 caps at 50000", func(t *testing.T) {
		res, err := svc.Validate(domain.ValidateCouponInput{
			Code:     "DISKON10",
			Subtotal: 1500000,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.DiscountAmount != 50000 {
			t.Fatalf("expected capped discount 50000, got %v", res.DiscountAmount)
		}
	})

	t.Run("HEMAT50RB rejects when below minimum order amount", func(t *testing.T) {
		_, err := svc.Validate(domain.ValidateCouponInput{
			Code:     "HEMAT50RB",
			Subtotal: 250000,
		})
		if err == nil {
			t.Fatalf("expected error for subtotal below 300000")
		}
	})

	t.Run("HEMAT50RB applies 50000 when subtotal >= 300000", func(t *testing.T) {
		res, err := svc.Validate(domain.ValidateCouponInput{
			Code:     "HEMAT50RB",
			Subtotal: 500000,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.DiscountAmount != 50000 {
			t.Fatalf("expected 50000 discount, got %v", res.DiscountAmount)
		}
	})

	t.Run("GRATISONGKIR caps at shipping fee or 25000", func(t *testing.T) {
		res, err := svc.Validate(domain.ValidateCouponInput{
			Code:        "GRATISONGKIR",
			Subtotal:    200000,
			ShippingFee: 18000,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if res.DiscountAmount != 18000 {
			t.Fatalf("expected 18000 shipping discount, got %v", res.DiscountAmount)
		}
	})

	t.Run("unknown coupon returns error", func(t *testing.T) {
		_, err := svc.Validate(domain.ValidateCouponInput{
			Code:     "TIDAKADA",
			Subtotal: 500000,
		})
		if err == nil {
			t.Fatalf("expected error for unknown coupon")
		}
	})
}


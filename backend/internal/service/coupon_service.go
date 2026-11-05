package service

import (
	"fmt"
	"math"
	"strings"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type couponService struct {
	coupons []domain.Coupon
}

var _ domain.CouponService = (*couponService)(nil)

// NewCouponService creates a new CouponService seeded with default Shoes4Us promotional vouchers.
func NewCouponService() domain.CouponService {
	return &couponService{
		coupons: domain.DefaultCoupons(),
	}
}

// ListCoupons returns all active promotional coupons.
func (s *couponService) ListCoupons() []domain.Coupon {
	out := make([]domain.Coupon, len(s.coupons))
	copy(out, s.coupons)
	return out
}

// Validate checks a coupon code against the cart subtotal and computes the exact Rupiah discount.
func (s *couponService) Validate(input domain.ValidateCouponInput) (*domain.CouponValidationResult, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(input.Code))
	if cleanCode == "" {
		return nil, domain.NewBadRequest("Kode voucher wajib diisi")
	}

	var matched *domain.Coupon
	for i := range s.coupons {
		if strings.EqualFold(s.coupons[i].Code, cleanCode) {
			matched = &s.coupons[i]
			break
		}
	}

	if matched == nil {
		return nil, domain.NewBadRequest(fmt.Sprintf("Kode voucher %q tidak valid atau sudah berakhir", cleanCode))
	}

	if input.Subtotal < matched.MinOrderAmount {
		return nil, domain.NewBadRequest(
			fmt.Sprintf(
				"Minimum belanja untuk voucher %s adalah Rp %.0f",
				matched.Code,
				matched.MinOrderAmount,
			),
		)
	}

	var discount float64
	switch matched.DiscountType {
	case domain.DiscountPercentage:
		discount = math.Round((input.Subtotal * matched.Value) / 100)
		if matched.MaxDiscount > 0 && discount > matched.MaxDiscount {
			discount = matched.MaxDiscount
		}
	case domain.DiscountFixed:
		discount = matched.Value
		if matched.MaxDiscount > 0 && discount > matched.MaxDiscount {
			discount = matched.MaxDiscount
		}
	case domain.DiscountFreeShipping:
		if input.ShippingFee > 0 {
			discount = math.Min(input.ShippingFee, matched.MaxDiscount)
		} else {
			discount = matched.MaxDiscount
		}
	}

	if discount > input.Subtotal && matched.DiscountType != domain.DiscountFreeShipping {
		discount = input.Subtotal
	}

	return &domain.CouponValidationResult{
		Code:           matched.Code,
		Description:    matched.Description,
		DiscountType:   matched.DiscountType,
		DiscountAmount: discount,
		MinOrderAmount: matched.MinOrderAmount,
	}, nil
}


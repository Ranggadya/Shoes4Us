package domain

// DiscountType represents the type of discount a coupon applies.
type DiscountType string

const (
	DiscountPercentage   DiscountType = "PERCENTAGE"
	DiscountFixed        DiscountType = "FIXED"
	DiscountFreeShipping DiscountType = "FREE_SHIPPING"
)

// Coupon defines a promotional voucher rule.
type Coupon struct {
	Code           string       `json:"code"`
	Description    string       `json:"description"`
	DiscountType   DiscountType `json:"discountType"`
	Value          float64      `json:"value"`          // percentage (e.g. 10) or fixed nominal (e.g. 50000)
	MaxDiscount    float64      `json:"maxDiscount"`    // 0 means uncapped
	MinOrderAmount float64      `json:"minOrderAmount"` // minimum cart subtotal required
}

// ValidateCouponInput represents the request payload for validating a coupon code.
type ValidateCouponInput struct {
	Code        string  `json:"code"`
	Subtotal    float64 `json:"subtotal"`
	ShippingFee float64 `json:"shippingFee,omitempty"`
}

// CouponValidationResult contains the calculated discount for a valid coupon.
type CouponValidationResult struct {
	Code           string       `json:"code"`
	Description    string       `json:"description"`
	DiscountType   DiscountType `json:"discountType"`
	DiscountAmount float64      `json:"discountAmount"`
	MinOrderAmount float64      `json:"minOrderAmount"`
}

// DefaultCoupons returns the active promotional vouchers for Shoes4Us.
func DefaultCoupons() []Coupon {
	return []Coupon{
		{
			Code:           "DISKON10",
			Description:    "Diskon 10% (Maks. Rp 50.000, Min. belanja Rp 100.000)",
			DiscountType:   DiscountPercentage,
			Value:          10,
			MaxDiscount:    50000,
			MinOrderAmount: 100000,
		},
		{
			Code:           "HEMAT50RB",
			Description:    "Potongan langsung Rp 50.000 (Min. belanja Rp 300.000)",
			DiscountType:   DiscountFixed,
			Value:          50000,
			MaxDiscount:    50000,
			MinOrderAmount: 300000,
		},
		{
			Code:           "GRATISONGKIR",
			Description:    "Gratis Ongkir hingga Rp 25.000 (Min. belanja Rp 150.000)",
			DiscountType:   DiscountFreeShipping,
			Value:          25000,
			MaxDiscount:    25000,
			MinOrderAmount: 150000,
		},
	}
}

// CouponService validates promotional vouchers and computes exact Rupiah discounts.
type CouponService interface {
	ListCoupons() []Coupon
	Validate(input ValidateCouponInput) (*CouponValidationResult, error)
}


package domain

import "strings"

// CourierOption represents a shipping expedition service option.
type CourierOption struct {
	Code          string  `json:"code"`
	Name          string  `json:"name"`
	Service       string  `json:"service"`
	Cost          float64 `json:"cost"`
	EstimatedDays string  `json:"estimatedDays"`
	Description   string  `json:"description"`
}

// DefaultCouriers returns the available shipping couriers for Shoes4Us.
func DefaultCouriers() []CourierOption {
	return []CourierOption{
		{
			Code:          "JNE-REG",
			Name:          "JNE Reguler",
			Service:       "REG",
			Cost:          18000,
			EstimatedDays: "2 - 3 hari",
			Description:   "Pengiriman reguler ke seluruh Indonesia",
		},
		{
			Code:          "SICEPAT-REG",
			Name:          "SiCepat REG",
			Service:       "REG",
			Cost:          16000,
			EstimatedDays: "1 - 2 hari",
			Description:   "Layanan pengiriman cepat dengan tarif ekonomis",
		},
		{
			Code:          "JNT-EZ",
			Name:          "J&T Express",
			Service:       "EZ",
			Cost:          17000,
			EstimatedDays: "2 - 3 hari",
			Description:   "Pengiriman reguler dengan jangkauan luas",
		},
		{
			Code:          "JNE-YES",
			Name:          "JNE YES",
			Service:       "YES",
			Cost:          32000,
			EstimatedDays: "1 hari (Besok Sampai)",
			Description:   "Yakin Esok Sampai untuk pengiriman kilat",
		},
	}
}

// FindCourierByCodeOrName resolves a courier option by its code or display name.
func FindCourierByCodeOrName(codeOrName string) *CourierOption {
	clean := strings.TrimSpace(codeOrName)
	if clean == "" {
		return nil
	}
	couriers := DefaultCouriers()
	for i := range couriers {
		if strings.EqualFold(couriers[i].Code, clean) || strings.EqualFold(couriers[i].Name, clean) {
			return &couriers[i]
		}
	}
	return nil
}

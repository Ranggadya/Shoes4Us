package repository

import (
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

func strPtr(s string) *string {
	return &s
}

func TestSortOrderItemsForDeduction(t *testing.T) {
	items := []domain.OrderItem{
		{ProductID: "prod-b", Size: strPtr("42"), Quantity: 1},
		{ProductID: "prod-a", Size: strPtr("40"), Quantity: 2},
		{ProductID: "prod-b", Size: strPtr("39"), Quantity: 1},
		{ProductID: "prod-a", Size: nil, Quantity: 1},
	}

	sorted := sortOrderItemsForDeduction(items)

	// Ensure original slice not mutated unexpectedly
	if len(sorted) != len(items) {
		t.Fatalf("expected len %d, got %d", len(items), len(sorted))
	}

	// Expected order:
	// 1. prod-a, nil size ("")
	// 2. prod-a, "40"
	// 3. prod-b, "39"
	// 4. prod-b, "42"
	expectedKeys := []struct {
		prodID string
		size   string
	}{
		{"prod-a", ""},
		{"prod-a", "40"},
		{"prod-b", "39"},
		{"prod-b", "42"},
	}

	for i, exp := range expectedKeys {
		actualProdID := sorted[i].ProductID
		actualSize := ""
		if sorted[i].Size != nil {
			actualSize = *sorted[i].Size
		}

		if actualProdID != exp.prodID || actualSize != exp.size {
			t.Errorf("item[%d]: expected (%s, %s), got (%s, %s)",
				i, exp.prodID, exp.size, actualProdID, actualSize)
		}
	}
}

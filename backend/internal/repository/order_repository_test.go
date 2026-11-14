package repository

import (
	"encoding/json"
	"strings"
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

func TestAssignOrderItemsGuaranteesNonNilItemsSlice(t *testing.T) {
	orders := []domain.Order{
		{ID: "ord-with-items", OrderNumber: "ORD-001"},
		{ID: "ord-empty", OrderNumber: "ORD-002"},
	}

	itemsMap := map[string][]domain.OrderItem{
		"ord-with-items": {
			{
				ID:        "oi-1",
				OrderID:   "ord-with-items",
				ProductID: "prod-1",
				Quantity:  2,
				Price:     500000,
			},
		},
	}

	assignOrderItems(orders, itemsMap)

	if len(orders[0].Items) != 1 {
		t.Fatalf("expected 1 item on ord-with-items, got %d", len(orders[0].Items))
	}
	if orders[1].Items == nil {
		t.Fatal("expected non-nil empty Items slice on order with no line items")
	}
	if len(orders[1].Items) != 0 {
		t.Fatalf("expected 0 items on ord-empty, got %d", len(orders[1].Items))
	}

	encoded, err := json.Marshal(orders[1])
	if err != nil {
		t.Fatalf("failed to marshal order: %v", err)
	}
	if strings.Contains(string(encoded), `"items":null`) {
		t.Fatalf("expected items to marshal as [], got %s", string(encoded))
	}
	if !strings.Contains(string(encoded), `"items":[]`) {
		t.Fatalf("expected items to marshal as [], got %s", string(encoded))
	}
}


package database_test

import (
	"context"
	"strings"
	"testing"

	"github.com/ranggadya/shoes4us/backend/internal/database"
)

func TestNewPostgresPool_Validation(t *testing.T) {
	ctx := context.Background()

	if _, err := database.NewPostgresPool(ctx, "   "); err == nil {
		t.Fatalf("expected error for empty DATABASE_URL, got nil")
	}

	if _, err := database.NewPostgresPool(ctx, "://invalid-dsn"); err == nil {
		t.Fatalf("expected error for invalid DATABASE_URL, got nil")
	}
}

func TestSchemaDDL_CompositeIndexes(t *testing.T) {
	ddl := database.SchemaDDL()
	requiredIndexes := []string{
		"idx_products_category_active",
		"idx_products_price",
		"idx_order_items_product_id",
	}
	for _, idx := range requiredIndexes {
		if !strings.Contains(ddl, idx) {
			t.Errorf("expected SchemaDDL to contain index %q", idx)
		}
	}
}

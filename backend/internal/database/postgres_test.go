package database_test

import (
	"context"
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

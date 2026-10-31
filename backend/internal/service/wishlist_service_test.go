package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
	"github.com/ranggadya/shoes4us/backend/internal/service"
)

type mockWishlistRepo struct {
	idItems   []domain.WishlistIDItem
	fullItems []domain.WishlistItem
	added     *domain.WishlistItem
	err       error
}

func (m *mockWishlistRepo) FindProductIDsByUserID(ctx context.Context, userID string) ([]domain.WishlistIDItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.idItems, nil
}

func (m *mockWishlistRepo) FindFullByUserID(ctx context.Context, userID string) ([]domain.WishlistItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.fullItems, nil
}

func (m *mockWishlistRepo) Add(ctx context.Context, userID, productID string) (*domain.WishlistItem, error) {
	if m.err != nil {
		return nil, m.err
	}
	m.added = &domain.WishlistItem{
		ID:        "w-1",
		ProductID: productID,
		CreatedAt: time.Now(),
	}
	return m.added, nil
}

func (m *mockWishlistRepo) Remove(ctx context.Context, userID, productID string) error {
	return m.err
}

func TestWishlistService(t *testing.T) {
	ctx := context.Background()

	t.Run("Requires non-empty userID", func(t *testing.T) {
		svc := service.NewWishlistService(&mockWishlistRepo{})

		if _, err := svc.GetWishlistIDs(ctx, ""); err == nil {
			t.Fatal("expected error for empty userID in GetWishlistIDs")
		}
		if _, err := svc.GetFullWishlist(ctx, "   "); err == nil {
			t.Fatal("expected error for empty userID in GetFullWishlist")
		}
		if _, err := svc.AddToWishlist(ctx, "", "p-1"); err == nil {
			t.Fatal("expected error for empty userID in AddToWishlist")
		}
		if err := svc.RemoveFromWishlist(ctx, "", "p-1"); err == nil {
			t.Fatal("expected error for empty userID in RemoveFromWishlist")
		}
	})

	t.Run("Validates non-empty productID on add and remove", func(t *testing.T) {
		svc := service.NewWishlistService(&mockWishlistRepo{})

		if _, err := svc.AddToWishlist(ctx, "u-1", ""); err == nil {
			t.Fatal("expected error for empty productID in AddToWishlist")
		}
		if err := svc.RemoveFromWishlist(ctx, "u-1", "   "); err == nil {
			t.Fatal("expected error for empty productID in RemoveFromWishlist")
		}
	})

	t.Run("GetWishlistIDs returns items", func(t *testing.T) {
		mock := &mockWishlistRepo{
			idItems: []domain.WishlistIDItem{{ProductID: "p-1"}, {ProductID: "p-2"}},
		}
		svc := service.NewWishlistService(mock)
		items, err := svc.GetWishlistIDs(ctx, "u-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(items) != 2 {
			t.Fatalf("expected 2 items, got %d", len(items))
		}
	})

	t.Run("AddToWishlist returns created item", func(t *testing.T) {
		mock := &mockWishlistRepo{}
		svc := service.NewWishlistService(mock)
		it, err := svc.AddToWishlist(ctx, "u-1", "p-9")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if it == nil || it.ProductID != "p-9" {
			t.Fatalf("unexpected item returned: %+v", it)
		}
	})

	t.Run("Propagates repository errors", func(t *testing.T) {
		expectedErr := errors.New("db error")
		mock := &mockWishlistRepo{err: expectedErr}
		svc := service.NewWishlistService(mock)

		if _, err := svc.GetFullWishlist(ctx, "u-1"); !errors.Is(err, expectedErr) {
			t.Fatalf("expected %v, got %v", expectedErr, err)
		}
		if err := svc.RemoveFromWishlist(ctx, "u-1", "p-1"); !errors.Is(err, expectedErr) {
			t.Fatalf("expected %v, got %v", expectedErr, err)
		}
	})
}

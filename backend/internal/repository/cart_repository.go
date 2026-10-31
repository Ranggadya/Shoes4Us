package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresCartRepository implements domain.CartRepository using PostgreSQL.
type PostgresCartRepository struct {
	pool *pgxpool.Pool
}

var _ domain.CartRepository = (*PostgresCartRepository)(nil)

// NewCartRepository creates a new PostgresCartRepository.
func NewCartRepository(pool *pgxpool.Pool) *PostgresCartRepository {
	return &PostgresCartRepository{pool: pool}
}

// GetOrCreateCart retrieves the user's active cart or creates one if none exists.
func (r *PostgresCartRepository) GetOrCreateCart(ctx context.Context, userID string) (*domain.Cart, error) {
	if r.pool == nil {
		return &domain.Cart{ID: uuid.NewString(), UserID: userID, Items: []domain.CartItem{}}, nil
	}

	cart, err := r.FindCartByUserID(ctx, userID)
	if err == nil && cart != nil && cart.ID != "" {
		return cart, nil
	}

	now := time.Now()
	newCartID := uuid.NewString()

	const insertQuery = `
		INSERT INTO carts (id, "userId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4)
		ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = EXCLUDED."updatedAt"
		RETURNING id
	`

	var actualID string
	err = r.pool.QueryRow(ctx, insertQuery, newCartID, userID, now, now).Scan(&actualID)
	if err != nil {
		return nil, err
	}

	return r.FindCartByUserID(ctx, userID)
}

// FindCartByUserID retrieves the full cart state including items and totals for a user.
func (r *PostgresCartRepository) FindCartByUserID(ctx context.Context, userID string) (*domain.Cart, error) {
	if r.pool == nil {
		return &domain.Cart{UserID: userID, Items: []domain.CartItem{}}, nil
	}

	const cartQuery = `
		SELECT id, "userId"
		FROM carts
		WHERE "userId" = $1
		LIMIT 1
	`

	var cartID, uID string
	err := r.pool.QueryRow(ctx, cartQuery, userID).Scan(&cartID, &uID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &domain.Cart{
				ID:     "",
				UserID: userID,
				Items:  []domain.CartItem{},
				Totals: domain.CartTotals{Subtotal: 0, TotalItems: 0},
			}, nil
		}
		return nil, err
	}

	const itemsQuery = `
		SELECT ci.id, ci."productId", ci.quantity, ci.size, ci."createdAt", ci."updatedAt",
		       p.id, p.name, p.price, p."imageUrl"
		FROM cart_items ci
		JOIN products p ON ci."productId" = p.id
		WHERE ci."cartId" = $1
		ORDER BY ci."createdAt" ASC
	`

	rows, err := r.pool.Query(ctx, itemsQuery, cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.CartItem, 0)
	var subtotal float64
	var totalItems int

	for rows.Next() {
		var (
			item     domain.CartItem
			prod     domain.CartProductSummary
			sizeVal  *string
			imgVal   *string
			cAt, uAt time.Time
		)

		err := rows.Scan(
			&item.ID,
			&item.ProductID,
			&item.Quantity,
			&sizeVal,
			&cAt,
			&uAt,
			&prod.ID,
			&prod.Name,
			&prod.Price,
			&imgVal,
		)
		if err != nil {
			return nil, err
		}

		item.Size = sizeVal
		prod.ImageURL = imgVal
		item.Product = prod
		item.LineTotal = prod.Price * float64(item.Quantity)
		item.CreatedAt = cAt
		item.UpdatedAt = uAt

		subtotal += item.LineTotal
		totalItems += item.Quantity
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &domain.Cart{
		ID:     cartID,
		UserID: uID,
		Items:  items,
		Totals: domain.CartTotals{
			Subtotal:   subtotal,
			TotalItems: totalItems,
		},
	}, nil
}

// FindCartItem retrieves a single cart item with its associated product details.
func (r *PostgresCartRepository) FindCartItem(ctx context.Context, cartID, itemID string) (*domain.CartItem, error) {
	if r.pool == nil {
		return nil, errors.New("database pool not initialized")
	}

	const query = `
		SELECT ci.id, ci."productId", ci.quantity, ci.size, ci."createdAt", ci."updatedAt",
		       p.id, p.name, p.price, p."imageUrl"
		FROM cart_items ci
		JOIN products p ON ci."productId" = p.id
		WHERE ci."cartId" = $1 AND ci.id = $2
		LIMIT 1
	`

	var (
		item     domain.CartItem
		prod     domain.CartProductSummary
		sizeVal  *string
		imgVal   *string
		cAt, uAt time.Time
	)

	err := r.pool.QueryRow(ctx, query, cartID, itemID).Scan(
		&item.ID,
		&item.ProductID,
		&item.Quantity,
		&sizeVal,
		&cAt,
		&uAt,
		&prod.ID,
		&prod.Name,
		&prod.Price,
		&imgVal,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	item.Size = sizeVal
	prod.ImageURL = imgVal
	item.Product = prod
	item.LineTotal = prod.Price * float64(item.Quantity)
	item.CreatedAt = cAt
	item.UpdatedAt = uAt

	return &item, nil
}

// FindCartItemByProductAndSize searches for an item in the cart with matching productID and size.
func (r *PostgresCartRepository) FindCartItemByProductAndSize(ctx context.Context, cartID, productID string, size *string) (*domain.CartItem, error) {
	if r.pool == nil {
		return nil, nil
	}

	var query string
	var args []any

	if size == nil {
		query = `
			SELECT ci.id, ci."productId", ci.quantity, ci.size, ci."createdAt", ci."updatedAt",
			       p.id, p.name, p.price, p."imageUrl"
			FROM cart_items ci
			JOIN products p ON ci."productId" = p.id
			WHERE ci."cartId" = $1 AND ci."productId" = $2 AND ci.size IS NULL
			LIMIT 1
		`
		args = []any{cartID, productID}
	} else {
		query = `
			SELECT ci.id, ci."productId", ci.quantity, ci.size, ci."createdAt", ci."updatedAt",
			       p.id, p.name, p.price, p."imageUrl"
			FROM cart_items ci
			JOIN products p ON ci."productId" = p.id
			WHERE ci."cartId" = $1 AND ci."productId" = $2 AND ci.size = $3
			LIMIT 1
		`
		args = []any{cartID, productID, *size}
	}

	var (
		item     domain.CartItem
		prod     domain.CartProductSummary
		sizeVal  *string
		imgVal   *string
		cAt, uAt time.Time
	)

	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&item.ID,
		&item.ProductID,
		&item.Quantity,
		&sizeVal,
		&cAt,
		&uAt,
		&prod.ID,
		&prod.Name,
		&prod.Price,
		&imgVal,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	item.Size = sizeVal
	prod.ImageURL = imgVal
	item.Product = prod
	item.LineTotal = prod.Price * float64(item.Quantity)
	item.CreatedAt = cAt
	item.UpdatedAt = uAt

	return &item, nil
}

// UpsertItem adds quantity to an existing item or creates a new row if none exists.
func (r *PostgresCartRepository) UpsertItem(ctx context.Context, cartID, productID string, priceSnap float64, quantity int, size *string) (*domain.CartItem, error) {
	if r.pool == nil {
		return nil, errors.New("database pool not initialized")
	}

	existing, err := r.FindCartItemByProductAndSize(ctx, cartID, productID, size)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	if existing != nil {
		const updateQuery = `
			UPDATE cart_items
			SET quantity = quantity + $1, "updatedAt" = $2
			WHERE id = $3
		`
		_, err := r.pool.Exec(ctx, updateQuery, quantity, now, existing.ID)
		if err != nil {
			return nil, err
		}
		return r.FindCartItem(ctx, cartID, existing.ID)
	}

	const insertQuery = `
		INSERT INTO cart_items (id, "cartId", "productId", quantity, "priceSnap", size, "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	newID := uuid.NewString()
	_, err = r.pool.Exec(ctx, insertQuery, newID, cartID, productID, quantity, priceSnap, size, now, now)
	if err != nil {
		return nil, err
	}

	return r.FindCartItem(ctx, cartID, newID)
}

// SetItemQuantity updates an item's quantity or deletes it if quantity <= 0.
func (r *PostgresCartRepository) SetItemQuantity(ctx context.Context, cartID, itemID string, quantity int) error {
	if r.pool == nil {
		return errors.New("database pool not initialized")
	}

	if quantity <= 0 {
		return r.RemoveItem(ctx, cartID, itemID)
	}

	const query = `
		UPDATE cart_items
		SET quantity = $1, "updatedAt" = $2
		WHERE id = $3 AND "cartId" = $4
	`
	res, err := r.pool.Exec(ctx, query, quantity, time.Now(), itemID, cartID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.NewNotFound("Item keranjang tidak ditemukan")
	}
	return nil
}

// RemoveItem deletes a specific item from the user's cart.
func (r *PostgresCartRepository) RemoveItem(ctx context.Context, cartID, itemID string) error {
	if r.pool == nil {
		return errors.New("database pool not initialized")
	}

	const query = `
		DELETE FROM cart_items
		WHERE id = $1 AND "cartId" = $2
	`
	res, err := r.pool.Exec(ctx, query, itemID, cartID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.NewNotFound("Item keranjang tidak ditemukan")
	}
	return nil
}

// ClearCart removes all items belonging to the specified cart.
func (r *PostgresCartRepository) ClearCart(ctx context.Context, cartID string) error {
	if r.pool == nil {
		return errors.New("database pool not initialized")
	}

	const query = `
		DELETE FROM cart_items
		WHERE "cartId" = $1
	`
	_, err := r.pool.Exec(ctx, query, cartID)
	return err
}

package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresOrderRepository implements domain.OrderRepository with transactional safety.
type PostgresOrderRepository struct {
	pool *pgxpool.Pool
}

var _ domain.OrderRepository = (*PostgresOrderRepository)(nil)

// NewOrderRepository constructs a new PostgresOrderRepository.
func NewOrderRepository(pool *pgxpool.Pool) *PostgresOrderRepository {
	return &PostgresOrderRepository{pool: pool}
}

// CreateOrderWithTx creates an order and line items, deducts per-size stock, and clears the user's cart in a single atomic transaction.
func (r *PostgresOrderRepository) CreateOrderWithTx(ctx context.Context, order *domain.Order, items []domain.OrderItem, cartID string) error {
	if r.pool == nil {
		return nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	now := time.Now()

	// 1. Deduct stock for each line item atomically
	for _, item := range items {
		if item.Size != nil && strings.TrimSpace(*item.Size) != "" {
			sz := strings.TrimSpace(*item.Size)
			const decSizeQuery = `
				UPDATE product_sizes
				SET stock = stock - $1, "updatedAt" = $2
				WHERE "productId" = $3 AND size = $4 AND stock >= $1
			`
			cmdTag, err := tx.Exec(ctx, decSizeQuery, item.Quantity, now, item.ProductID, sz)
			if err != nil {
				return err
			}
			if cmdTag.RowsAffected() == 0 {
				return domain.NewBadRequest(fmt.Sprintf("Stok ukuran %s untuk produk %s tidak mencukupi", sz, item.ProductID))
			}

			const decProdQuery = `
				UPDATE products
				SET stock = stock - $1, "updatedAt" = $2
				WHERE id = $3 AND stock >= $1
			`
			cmdTag, err = tx.Exec(ctx, decProdQuery, item.Quantity, now, item.ProductID)
			if err != nil {
				return err
			}
			if cmdTag.RowsAffected() == 0 {
				return domain.NewBadRequest(fmt.Sprintf("Stok produk %s tidak mencukupi", item.ProductID))
			}
		} else {
			const decProdQuery = `
				UPDATE products
				SET stock = stock - $1, "updatedAt" = $2
				WHERE id = $3 AND stock >= $1
			`
			cmdTag, err := tx.Exec(ctx, decProdQuery, item.Quantity, now, item.ProductID)
			if err != nil {
				return err
			}
			if cmdTag.RowsAffected() == 0 {
				return domain.NewBadRequest(fmt.Sprintf("Stok produk %s tidak mencukupi", item.ProductID))
			}
		}
	}

	// 2. Insert order row
	const insertOrderQuery = `
		INSERT INTO orders ("id", "orderNumber", "userId", "status", "totalAmount", "shippingAddress", "shippingCity", "shippingPostalCode", "shippingPhone", "paymentMethod", "paymentUrl", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4::"OrderStatus", $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	_, err = tx.Exec(ctx, insertOrderQuery,
		order.ID,
		order.OrderNumber,
		order.UserID,
		string(order.Status),
		order.TotalAmount,
		order.ShippingAddress,
		order.ShippingCity,
		order.ShippingPostalCode,
		order.ShippingPhone,
		order.PaymentMethod,
		order.PaymentURL,
		order.CreatedAt,
		order.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// 3. Insert order items
	for _, item := range items {
		const insertItemQuery = `
			INSERT INTO order_items ("id", "orderId", "productId", "quantity", "price", "size")
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		_, err = tx.Exec(ctx, insertItemQuery,
			item.ID,
			order.ID,
			item.ProductID,
			item.Quantity,
			item.Price,
			item.Size,
		)
		if err != nil {
			return err
		}
	}

	// 4. Clear user's cart if provided
	if strings.TrimSpace(cartID) != "" {
		const clearCartQuery = `
			DELETE FROM cart_items
			WHERE "cartId" = $1
		`
		_, err = tx.Exec(ctx, clearCartQuery, cartID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// FindByID retrieves an order with its items, product snapshots, and customer info.
func (r *PostgresOrderRepository) FindByID(ctx context.Context, orderID string) (*domain.Order, error) {
	if r.pool == nil {
		return nil, domain.NewNotFound("Pesanan tidak ditemukan")
	}

	const orderQuery = `
		SELECT o.id, o."orderNumber", o."userId", o.status::text, o."totalAmount",
		       o."shippingAddress", o."shippingCity", o."shippingPostalCode", o."shippingPhone",
		       o."paymentMethod", o."paymentUrl", o."createdAt", o."updatedAt",
		       u.name, u.email
		FROM orders o
		JOIN users u ON o."userId" = u.id
		WHERE o.id = $1
		LIMIT 1
	`

	var (
		ord      domain.Order
		st       string
		uName    string
		uEmail   string
		sAddr    *string
		sCity    *string
		sPostal  *string
		sPhone   *string
		pMethod  *string
		pURL     *string
	)

	err := r.pool.QueryRow(ctx, orderQuery, orderID).Scan(
		&ord.ID,
		&ord.OrderNumber,
		&ord.UserID,
		&st,
		&ord.TotalAmount,
		&sAddr,
		&sCity,
		&sPostal,
		&sPhone,
		&pMethod,
		&pURL,
		&ord.CreatedAt,
		&ord.UpdatedAt,
		&uName,
		&uEmail,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	ord.Status = domain.OrderStatus(st)
	ord.ShippingAddress = sAddr
	ord.ShippingCity = sCity
	ord.ShippingPostalCode = sPostal
	ord.ShippingPhone = sPhone
	ord.PaymentMethod = pMethod
	ord.PaymentURL = pURL
	ord.User = &domain.OrderUserSummary{
		ID:    ord.UserID,
		Name:  uName,
		Email: uEmail,
	}

	items, err := r.loadItemsForOrder(ctx, ord.ID)
	if err != nil {
		return nil, err
	}
	ord.Items = items

	return &ord, nil
}

// FindAll retrieves paginated orders for a customer or all orders for an administrator.
func (r *PostgresOrderRepository) FindAll(ctx context.Context, filter domain.OrderFilter) ([]domain.Order, int, error) {
	if r.pool == nil {
		return []domain.Order{}, 0, nil
	}

	var (
		whereClauses []string
		args         []any
		argIdx       = 1
	)

	if filter.Scope != "all" && filter.UserID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`o."userId" = $%d`, argIdx))
		args = append(args, filter.UserID)
		argIdx++
	}

	if filter.Status != nil && *filter.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`o.status = $%d::"OrderStatus"`, argIdx))
		args = append(args, string(*filter.Status))
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM orders o %s`, whereSQL)
	var total int
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	selectQuery := fmt.Sprintf(`
		SELECT o.id, o."orderNumber", o."userId", o.status::text, o."totalAmount",
		       o."shippingAddress", o."shippingCity", o."shippingPostalCode", o."shippingPhone",
		       o."paymentMethod", o."paymentUrl", o."createdAt", o."updatedAt",
		       u.name, u.email
		FROM orders o
		JOIN users u ON o."userId" = u.id
		%s
		ORDER BY o."createdAt" DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	orders := make([]domain.Order, 0)
	orderIDs := make([]string, 0)

	for rows.Next() {
		var (
			ord     domain.Order
			st      string
			uName   string
			uEmail  string
			sAddr   *string
			sCity   *string
			sPostal *string
			sPhone  *string
			pMethod *string
			pURL    *string
		)

		err := rows.Scan(
			&ord.ID,
			&ord.OrderNumber,
			&ord.UserID,
			&st,
			&ord.TotalAmount,
			&sAddr,
			&sCity,
			&sPostal,
			&sPhone,
			&pMethod,
			&pURL,
			&ord.CreatedAt,
			&ord.UpdatedAt,
			&uName,
			&uEmail,
		)
		if err != nil {
			return nil, 0, err
		}

		ord.Status = domain.OrderStatus(st)
		ord.ShippingAddress = sAddr
		ord.ShippingCity = sCity
		ord.ShippingPostalCode = sPostal
		ord.ShippingPhone = sPhone
		ord.PaymentMethod = pMethod
		ord.PaymentURL = pURL
		ord.User = &domain.OrderUserSummary{
			ID:    ord.UserID,
			Name:  uName,
			Email: uEmail,
		}

		orders = append(orders, ord)
		orderIDs = append(orderIDs, ord.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if len(orderIDs) > 0 {
		itemsMap, err := r.loadItemsForOrderIDs(ctx, orderIDs)
		if err == nil {
			for i := range orders {
				orders[i].Items = itemsMap[orders[i].ID]
			}
		}
	}

	return orders, total, nil
}

// UpdateStatusWithTx performs an atomic state update and optional restock in a transaction.
func (r *PostgresOrderRepository) UpdateStatusWithTx(ctx context.Context, orderID string, newStatus domain.OrderStatus, restock bool) (*domain.Order, error) {
	if r.pool == nil {
		return nil, errors.New("database pool not initialized")
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	now := time.Now()

	// If restock requested, increment stock for each order item
	if restock {
		const getItemsQuery = `
			SELECT "productId", quantity, size
			FROM order_items
			WHERE "orderId" = $1
		`
		rows, err := tx.Query(ctx, getItemsQuery, orderID)
		if err != nil {
			return nil, err
		}

		type restockItem struct {
			productID string
			quantity  int
			size      *string
		}
		var restockList []restockItem

		for rows.Next() {
			var it restockItem
			if err := rows.Scan(&it.productID, &it.quantity, &it.size); err != nil {
				rows.Close()
				return nil, err
			}
			restockList = append(restockList, it)
		}
		rows.Close()

		for _, it := range restockList {
			if it.size != nil && strings.TrimSpace(*it.size) != "" {
				sz := strings.TrimSpace(*it.size)
				const incSizeQuery = `
					UPDATE product_sizes
					SET stock = stock + $1, "updatedAt" = $2
					WHERE "productId" = $3 AND size = $4
				`
				_, err = tx.Exec(ctx, incSizeQuery, it.quantity, now, it.productID, sz)
				if err != nil {
					return nil, err
				}

				const incProdQuery = `
					UPDATE products
					SET stock = stock + $1, "updatedAt" = $2
					WHERE id = $3
				`
				_, err = tx.Exec(ctx, incProdQuery, it.quantity, now, it.productID)
				if err != nil {
					return nil, err
				}
			} else {
				const incProdQuery = `
					UPDATE products
					SET stock = stock + $1, "updatedAt" = $2
					WHERE id = $3
				`
				_, err = tx.Exec(ctx, incProdQuery, it.quantity, now, it.productID)
				if err != nil {
					return nil, err
				}
			}
		}
	}

	const updateOrderQuery = `
		UPDATE orders
		SET status = $1::"OrderStatus", "updatedAt" = $2
		WHERE id = $3
	`
	cmdTag, err := tx.Exec(ctx, updateOrderQuery, string(newStatus), now, orderID)
	if err != nil {
		return nil, err
	}
	if cmdTag.RowsAffected() == 0 {
		return nil, domain.NewNotFound("Pesanan tidak ditemukan")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.FindByID(ctx, orderID)
}

func (r *PostgresOrderRepository) loadItemsForOrder(ctx context.Context, orderID string) ([]domain.OrderItem, error) {
	const query = `
		SELECT oi.id, oi."orderId", oi."productId", oi.quantity, oi.price, oi.size,
		       p.name, p."imageUrl"
		FROM order_items oi
		JOIN products p ON oi."productId" = p.id
		WHERE oi."orderId" = $1
	`
	rows, err := r.pool.Query(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]domain.OrderItem, 0)
	for rows.Next() {
		var (
			it   domain.OrderItem
			img  *string
			name string
		)
		err := rows.Scan(
			&it.ID,
			&it.OrderID,
			&it.ProductID,
			&it.Quantity,
			&it.Price,
			&it.Size,
			&name,
			&img,
		)
		if err != nil {
			return nil, err
		}
		it.Product = domain.OrderItemProduct{
			ID:       it.ProductID,
			Name:     name,
			Price:    it.Price,
			ImageURL: img,
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *PostgresOrderRepository) loadItemsForOrderIDs(ctx context.Context, orderIDs []string) (map[string][]domain.OrderItem, error) {
	const query = `
		SELECT oi.id, oi."orderId", oi."productId", oi.quantity, oi.price, oi.size,
		       p.name, p."imageUrl"
		FROM order_items oi
		JOIN products p ON oi."productId" = p.id
		WHERE oi."orderId" = ANY($1)
	`
	rows, err := r.pool.Query(ctx, query, orderIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]domain.OrderItem)
	for rows.Next() {
		var (
			it   domain.OrderItem
			img  *string
			name string
		)
		err := rows.Scan(
			&it.ID,
			&it.OrderID,
			&it.ProductID,
			&it.Quantity,
			&it.Price,
			&it.Size,
			&name,
			&img,
		)
		if err != nil {
			return nil, err
		}
		it.Product = domain.OrderItemProduct{
			ID:       it.ProductID,
			Name:     name,
			Price:    it.Price,
			ImageURL: img,
		}
		result[it.OrderID] = append(result[it.OrderID], it)
	}
	return result, rows.Err()
}


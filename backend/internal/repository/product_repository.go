package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

// PostgresProductRepository implements domain.ProductRepository using PostgreSQL.
type PostgresProductRepository struct {
	pool *pgxpool.Pool
}

var _ domain.ProductRepository = (*PostgresProductRepository)(nil)

// NewProductRepository constructs a PostgreSQL-backed ProductRepository.
func NewProductRepository(pool *pgxpool.Pool) *PostgresProductRepository {
	return &PostgresProductRepository{pool: pool}
}

// FindAll queries products matching the given filter, returning paginated items and total count.
func (r *PostgresProductRepository) FindAll(ctx context.Context, filter domain.ProductFilter) ([]domain.Product, int, error) {
	var (
		whereClauses []string
		args         []any
		argIdx       = 1
	)

	// Default to active products unless explicitly requested
	whereClauses = append(whereClauses, `p."isActive" = true`)

	if filter.Search != "" {
		term := "%" + strings.ToLower(filter.Search) + "%"
		whereClauses = append(whereClauses, fmt.Sprintf(`(LOWER(p.name) LIKE $%d OR LOWER(COALESCE(p.description, '')) LIKE $%d OR LOWER(COALESCE(p.brand, '')) LIKE $%d)`, argIdx, argIdx, argIdx))
		args = append(args, term)
		argIdx++
	}

	if filter.CategoryID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`p."categoryId" = $%d`, argIdx))
		args = append(args, filter.CategoryID)
		argIdx++
	}

	if filter.Category != "" {
		cleanCat := strings.ToLower(strings.TrimSpace(filter.Category))
		whereClauses = append(whereClauses, fmt.Sprintf(`(LOWER(c.slug) = $%d OR LOWER(c.name) = $%d)`, argIdx, argIdx))
		args = append(args, cleanCat)
		argIdx++
	}

	if filter.Segment != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`p.segment::text = UPPER($%d)`, argIdx))
		args = append(args, filter.Segment)
		argIdx++
	}

	if filter.Audience != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`p.audience::text = UPPER($%d)`, argIdx))
		args = append(args, filter.Audience)
		argIdx++
	}

	if filter.Brand != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(`LOWER(COALESCE(p.brand, '')) = LOWER($%d)`, argIdx))
		args = append(args, filter.Brand)
		argIdx++
	}

	if filter.Collection != "" {
		switch strings.ToLower(filter.Collection) {
		case domain.CollectionNewArrivals:
			whereClauses = append(whereClauses, `p."isNewArrival" = true`)
		case domain.CollectionExclusive:
			whereClauses = append(whereClauses, `p."isExclusive" = true`)
		case domain.CollectionComingSoon:
			whereClauses = append(whereClauses, `p."isComingSoon" = true`)
		case domain.CollectionSale:
			whereClauses = append(whereClauses, `p."isSale" = true`)
		}
	}

	if filter.IsNewArrival != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p."isNewArrival" = $%d`, argIdx))
		args = append(args, *filter.IsNewArrival)
		argIdx++
	}

	if filter.IsExclusive != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p."isExclusive" = $%d`, argIdx))
		args = append(args, *filter.IsExclusive)
		argIdx++
	}

	if filter.IsComingSoon != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p."isComingSoon" = $%d`, argIdx))
		args = append(args, *filter.IsComingSoon)
		argIdx++
	}

	if filter.IsSale != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p."isSale" = $%d`, argIdx))
		args = append(args, *filter.IsSale)
		argIdx++
	}

	if filter.MinPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p.price >= $%d`, argIdx))
		args = append(args, *filter.MinPrice)
		argIdx++
	}

	if filter.MaxPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf(`p.price <= $%d`, argIdx))
		args = append(args, *filter.MaxPrice)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// 1. Get total count
	countQuery := fmt.Sprintf(`
		SELECT COUNT(p.id)
		FROM products p
		LEFT JOIN categories c ON p."categoryId" = c.id
		%s
	`, whereSQL)

	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, domain.NewInternal("Gagal menghitung total produk")
	}

	// 2. Sorting
	orderBySQL := `ORDER BY p."createdAt" DESC`
	switch strings.ToLower(filter.SortBy) {
	case "oldest":
		orderBySQL = `ORDER BY p."createdAt" ASC`
	case "price-asc":
		orderBySQL = `ORDER BY p.price ASC`
	case "price-desc":
		orderBySQL = `ORDER BY p.price DESC`
	case "name-asc":
		orderBySQL = `ORDER BY p.name ASC`
	case "name-desc":
		orderBySQL = `ORDER BY p.name DESC`
	case "stock-asc":
		orderBySQL = `ORDER BY p.stock ASC`
	}

	// 3. Pagination
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	selectQuery := fmt.Sprintf(`
		SELECT p.id, p.name, p.slug, p.description, p.price, p.stock, p."imageUrl", p."categoryId",
		       p.brand, p.segment::text, p.audience::text, p."isNewArrival", p."isExclusive", p."isComingSoon",
		       p."isSale", p."isActive", p."createdAt", p."updatedAt",
		       c.id, c.name, c.slug, c."isActive", c."createdAt", c."updatedAt"
		FROM products p
		LEFT JOIN categories c ON p."categoryId" = c.id
		%s
		%s
		LIMIT $%d OFFSET $%d
	`, whereSQL, orderBySQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, domain.NewInternal("Gagal mengambil daftar produk")
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var (
			p                      domain.Product
			cID, cName, cSlug      *string
			cIsActive              *bool
			cCreatedAt, cUpdatedAt *time.Time
			priceStr               string
		)

		err := rows.Scan(
			&p.ID, &p.Name, &p.Slug, &p.Description, &priceStr, &p.Stock, &p.ImageURL, &p.CategoryID,
			&p.Brand, &p.Segment, &p.Audience, &p.IsNewArrival, &p.IsExclusive, &p.IsComingSoon,
			&p.IsSale, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
			&cID, &cName, &cSlug, &cIsActive, &cCreatedAt, &cUpdatedAt,
		)
		if err != nil {
			return nil, 0, domain.NewInternal("Gagal memproses data produk")
		}

		if parsedPrice, err := strconv.ParseFloat(priceStr, 64); err == nil {
			p.Price = parsedPrice
		}

		if cID != nil {
			p.Category = &domain.Category{
				ID:        *cID,
				Name:      *cName,
				Slug:      *cSlug,
				IsActive:  *cIsActive,
				CreatedAt: *cCreatedAt,
				UpdatedAt: *cUpdatedAt,
			}
		}

		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, domain.NewInternal("Terjadi kesalahan membaca data produk")
	}

	if products == nil {
		products = []domain.Product{}
	}

	return products, total, nil
}

// FindByIDOrSlug finds a product by UUID ID or unique slug, populated with category.
func (r *PostgresProductRepository) FindByIDOrSlug(ctx context.Context, idOrSlug string) (*domain.Product, error) {
	const query = `
		SELECT p.id, p.name, p.slug, p.description, p.price, p.stock, p."imageUrl", p."categoryId",
		       p.brand, p.segment::text, p.audience::text, p."isNewArrival", p."isExclusive", p."isComingSoon",
		       p."isSale", p."isActive", p."createdAt", p."updatedAt",
		       c.id, c.name, c.slug, c."isActive", c."createdAt", c."updatedAt"
		FROM products p
		LEFT JOIN categories c ON p."categoryId" = c.id
		WHERE p.id = $1 OR p.slug = $1
		LIMIT 1
	`

	clean := strings.TrimSpace(idOrSlug)
	var (
		p                      domain.Product
		cID, cName, cSlug      *string
		cIsActive              *bool
		cCreatedAt, cUpdatedAt *time.Time
		priceStr               string
	)

	err := r.pool.QueryRow(ctx, query, clean).Scan(
		&p.ID, &p.Name, &p.Slug, &p.Description, &priceStr, &p.Stock, &p.ImageURL, &p.CategoryID,
		&p.Brand, &p.Segment, &p.Audience, &p.IsNewArrival, &p.IsExclusive, &p.IsComingSoon,
		&p.IsSale, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		&cID, &cName, &cSlug, &cIsActive, &cCreatedAt, &cUpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, domain.NewInternal("Gagal mengambil detail produk")
	}

	if parsedPrice, err := strconv.ParseFloat(priceStr, 64); err == nil {
		p.Price = parsedPrice
	}

	if cID != nil {
		p.Category = &domain.Category{
			ID:        *cID,
			Name:      *cName,
			Slug:      *cSlug,
			IsActive:  *cIsActive,
			CreatedAt: *cCreatedAt,
			UpdatedAt: *cUpdatedAt,
		}
	}

	return &p, nil
}

// FindSizesByProductID returns all size variants for a product.
func (r *PostgresProductRepository) FindSizesByProductID(ctx context.Context, productID string) ([]domain.ProductSize, error) {
	const query = `
		SELECT id, "productId", size, stock, "createdAt", "updatedAt"
		FROM product_sizes
		WHERE "productId" = $1
		ORDER BY size ASC
	`

	rows, err := r.pool.Query(ctx, query, productID)
	if err != nil {
		return nil, domain.NewInternal("Gagal mengambil varian ukuran produk")
	}
	defer rows.Close()

	var sizes []domain.ProductSize
	for rows.Next() {
		var s domain.ProductSize
		if err := rows.Scan(&s.ID, &s.ProductID, &s.Size, &s.Stock, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, domain.NewInternal("Gagal memproses varian ukuran")
		}
		sizes = append(sizes, s)
	}

	if sizes == nil {
		sizes = []domain.ProductSize{}
	}

	return sizes, nil
}

// GetSizeStock returns the current stock quantity for a specific product size variant.
func (r *PostgresProductRepository) GetSizeStock(ctx context.Context, productID, size string) (int, error) {
	const query = `
		SELECT stock
		FROM product_sizes
		WHERE "productId" = $1 AND size = $2
		LIMIT 1
	`

	var stock int
	err := r.pool.QueryRow(ctx, query, productID, size).Scan(&stock)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, domain.NewInternal("Gagal memeriksa stok ukuran")
	}

	return stock, nil
}

// HasOrderHistory checks if a product is referenced in order_items.
func (r *PostgresProductRepository) HasOrderHistory(ctx context.Context, productID string) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1 FROM order_items WHERE "productId" = $1
		)
	`

	var exists bool
	if err := r.pool.QueryRow(ctx, query, productID).Scan(&exists); err != nil {
		return false, domain.NewInternal("Gagal memeriksa riwayat pesanan produk")
	}

	return exists, nil
}

// Create inserts a new product and its size variants inside a database transaction.
func (r *PostgresProductRepository) Create(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.NewInternal("Gagal memulai transaksi database")
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if product.ID == "" {
		product.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	product.CreatedAt = now
	product.UpdatedAt = now
	product.IsActive = true

	// Compute total stock from sizes if provided
	if len(sizes) > 0 {
		totalStock := 0
		for _, s := range sizes {
			totalStock += s.Stock
		}
		product.Stock = totalStock
	}

	const insertProductSQL = `
		INSERT INTO products (
			id, name, slug, description, price, stock, "imageUrl", "categoryId",
			brand, segment, audience, "isNewArrival", "isExclusive", "isComingSoon",
			"isSale", "isActive", "createdAt", "updatedAt"
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10::"ProductSegment", $11::"ProductAudience", $12, $13, $14,
			$15, $16, $17, $18
		)
	`

	_, err = tx.Exec(ctx, insertProductSQL,
		product.ID, product.Name, product.Slug, product.Description, product.Price, product.Stock, product.ImageURL, product.CategoryID,
		product.Brand, product.Segment, product.Audience, product.IsNewArrival, product.IsExclusive, product.IsComingSoon,
		product.IsSale, product.IsActive, product.CreatedAt, product.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.NewConflict("Produk dengan slug ini sudah terdaftar")
		}
		return domain.NewInternal("Gagal menyimpan data produk")
	}

	const insertSizeSQL = `
		INSERT INTO product_sizes (id, "productId", size, stock, "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	for i := range sizes {
		if sizes[i].ID == "" {
			sizes[i].ID = uuid.NewString()
		}
		sizes[i].ProductID = product.ID
		sizes[i].CreatedAt = now
		sizes[i].UpdatedAt = now

		_, err = tx.Exec(ctx, insertSizeSQL, sizes[i].ID, sizes[i].ProductID, sizes[i].Size, sizes[i].Stock, sizes[i].CreatedAt, sizes[i].UpdatedAt)
		if err != nil {
			return domain.NewInternal("Gagal menyimpan varian ukuran produk")
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.NewInternal("Gagal menyelesaikan penyimpanan produk")
	}

	return nil
}

// Update modifies an existing product and re-syncs its size variants.
func (r *PostgresProductRepository) Update(ctx context.Context, product *domain.Product, sizes []domain.ProductSize) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.NewInternal("Gagal memulai transaksi database")
	}
	defer func() { _ = tx.Rollback(ctx) }()

	now := time.Now().UTC()
	product.UpdatedAt = now

	if len(sizes) > 0 {
		totalStock := 0
		for _, s := range sizes {
			totalStock += s.Stock
		}
		product.Stock = totalStock
	}

	const updateProductSQL = `
		UPDATE products SET
			name = $2, slug = $3, description = $4, price = $5, stock = $6,
			"imageUrl" = $7, "categoryId" = $8, brand = $9, segment = $10::"ProductSegment",
			audience = $11::"ProductAudience", "isNewArrival" = $12, "isExclusive" = $13,
			"isComingSoon" = $14, "isSale" = $15, "isActive" = $16, "updatedAt" = $17
		WHERE id = $1
	`

	res, err := tx.Exec(ctx, updateProductSQL,
		product.ID, product.Name, product.Slug, product.Description, product.Price, product.Stock,
		product.ImageURL, product.CategoryID, product.Brand, product.Segment,
		product.Audience, product.IsNewArrival, product.IsExclusive,
		product.IsComingSoon, product.IsSale, product.IsActive, product.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.NewConflict("Produk dengan slug ini sudah terdaftar")
		}
		return domain.NewInternal("Gagal memperbarui data produk")
	}

	if res.RowsAffected() == 0 {
		return domain.NewNotFound("Produk tidak ditemukan")
	}

	if len(sizes) > 0 {
		// Delete existing sizes and re-insert
		if _, err := tx.Exec(ctx, `DELETE FROM product_sizes WHERE "productId" = $1`, product.ID); err != nil {
			return domain.NewInternal("Gagal menghapus varian ukuran lama")
		}

		const insertSizeSQL = `
			INSERT INTO product_sizes (id, "productId", size, stock, "createdAt", "updatedAt")
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		for i := range sizes {
			if sizes[i].ID == "" {
				sizes[i].ID = uuid.NewString()
			}
			sizes[i].ProductID = product.ID
			sizes[i].CreatedAt = now
			sizes[i].UpdatedAt = now

			_, err = tx.Exec(ctx, insertSizeSQL, sizes[i].ID, sizes[i].ProductID, sizes[i].Size, sizes[i].Stock, sizes[i].CreatedAt, sizes[i].UpdatedAt)
			if err != nil {
				return domain.NewInternal("Gagal menyimpan varian ukuran produk baru")
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.NewInternal("Gagal menyelesaikan pembaruan produk")
	}

	return nil
}

// Delete permanently removes a product (when no order history references it).
func (r *PostgresProductRepository) Delete(ctx context.Context, id string) error {
	const query = `DELETE FROM products WHERE id = $1`
	res, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return domain.NewInternal("Gagal menghapus produk")
	}
	if res.RowsAffected() == 0 {
		return domain.NewNotFound("Produk tidak ditemukan")
	}
	return nil
}

// SoftDelete deactivates a product and clears stock to prevent foreign-key breakage when orders exist.
func (r *PostgresProductRepository) SoftDelete(ctx context.Context, id string) error {
	const query = `
		UPDATE products
		SET "isActive" = false, stock = 0, "updatedAt" = $2
		WHERE id = $1
	`
	res, err := r.pool.Exec(ctx, query, id, time.Now().UTC())
	if err != nil {
		return domain.NewInternal("Gagal menonaktifkan produk")
	}
	if res.RowsAffected() == 0 {
		return domain.NewNotFound("Produk tidak ditemukan")
	}
	return nil
}

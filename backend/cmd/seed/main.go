package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ranggadya/shoes4us/backend/internal/config"
	"github.com/ranggadya/shoes4us/backend/internal/database"
	"github.com/ranggadya/shoes4us/backend/pkg/hash"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	if strings.TrimSpace(cfg.DatabaseURL) == "" {
		log.Println("[seed] warning: DATABASE_URL is empty; skipping database seeding")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	pool, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[seed] failed to connect to PostgreSQL: %v", err)
	}
	defer pool.Close()

	log.Println("[seed] connected to database. verifying schema and tables...")

	if err := createSchema(ctx, pool); err != nil {
		log.Fatalf("[seed] failed to create schema: %v", err)
	}

	log.Println("[seed] seeding initial users and catalog...")

	if err := seedData(ctx, pool); err != nil {
		log.Fatalf("[seed] failed to seed data: %v", err)
	}

	log.Println("[seed] SUCCESS: database schema and initial data seeded successfully!")
	log.Println("[seed] Default Admin: admin@shoes4us.com / admin123")
	log.Println("[seed] Default User:  user@shoes4us.com  / user1234")
}

func createSchema(ctx context.Context, pool *pgxpool.Pool) error {
	const ddl = `
	DO $$ BEGIN
		CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
	EXCEPTION WHEN duplicate_object THEN null;
	END $$;

	DO $$ BEGIN
		CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');
	EXCEPTION WHEN duplicate_object THEN null;
	END $$;

	DO $$ BEGIN
		CREATE TYPE "ProductSegment" AS ENUM ('SHOES', 'APPAREL', 'ACCESSORIES');
	EXCEPTION WHEN duplicate_object THEN null;
	END $$;

	DO $$ BEGIN
		CREATE TYPE "ProductAudience" AS ENUM ('MEN', 'WOMEN', 'UNISEX', 'KIDS');
	EXCEPTION WHEN duplicate_object THEN null;
	END $$;

	CREATE TABLE IF NOT EXISTS users (
		"id" TEXT PRIMARY KEY,
		"email" TEXT UNIQUE NOT NULL,
		"password" TEXT,
		"name" TEXT,
		"role" "UserRole" NOT NULL DEFAULT 'USER',
		"isActive" BOOLEAN NOT NULL DEFAULT true,
		"image" TEXT,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS categories (
		"id" TEXT PRIMARY KEY,
		"name" TEXT UNIQUE NOT NULL,
		"slug" TEXT UNIQUE NOT NULL,
		"isActive" BOOLEAN NOT NULL DEFAULT true,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS products (
		"id" TEXT PRIMARY KEY,
		"name" TEXT NOT NULL,
		"slug" TEXT UNIQUE NOT NULL,
		"description" TEXT,
		"price" DECIMAL(65,30) NOT NULL,
		"stock" INTEGER NOT NULL DEFAULT 0,
		"imageUrl" TEXT,
		"categoryId" TEXT NOT NULL REFERENCES categories("id") ON DELETE CASCADE,
		"brand" TEXT,
		"segment" "ProductSegment" NOT NULL DEFAULT 'SHOES',
		"audience" "ProductAudience" NOT NULL DEFAULT 'UNISEX',
		"isNewArrival" BOOLEAN NOT NULL DEFAULT false,
		"isExclusive" BOOLEAN NOT NULL DEFAULT false,
		"isComingSoon" BOOLEAN NOT NULL DEFAULT false,
		"isSale" BOOLEAN NOT NULL DEFAULT false,
		"isActive" BOOLEAN NOT NULL DEFAULT true,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS product_sizes (
		"id" TEXT PRIMARY KEY,
		"productId" TEXT NOT NULL REFERENCES products("id") ON DELETE CASCADE,
		"size" TEXT NOT NULL,
		"stock" INTEGER NOT NULL DEFAULT 0,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT "product_sizes_productId_size_key" UNIQUE ("productId", "size")
	);

	CREATE TABLE IF NOT EXISTS carts (
		"id" TEXT PRIMARY KEY,
		"userId" TEXT UNIQUE NOT NULL REFERENCES users("id") ON DELETE CASCADE,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS cart_items (
		"id" TEXT PRIMARY KEY,
		"cartId" TEXT NOT NULL REFERENCES carts("id") ON DELETE CASCADE,
		"productId" TEXT NOT NULL REFERENCES products("id") ON DELETE CASCADE,
		"quantity" INTEGER NOT NULL DEFAULT 1,
		"priceSnap" DECIMAL(65,30) NOT NULL,
		"size" TEXT,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS orders (
		"id" TEXT PRIMARY KEY,
		"orderNumber" TEXT UNIQUE NOT NULL,
		"userId" TEXT NOT NULL REFERENCES users("id") ON DELETE RESTRICT,
		"status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
		"totalAmount" DOUBLE PRECISION NOT NULL,
		"shippingAddress" TEXT,
		"shippingCity" TEXT,
		"shippingPostalCode" TEXT,
		"shippingPhone" TEXT,
		"paymentMethod" TEXT,
		"paymentUrl" TEXT,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS order_items (
		"id" TEXT PRIMARY KEY,
		"orderId" TEXT NOT NULL REFERENCES orders("id") ON DELETE CASCADE,
		"productId" TEXT NOT NULL REFERENCES products("id") ON DELETE RESTRICT,
		"quantity" INTEGER NOT NULL,
		"price" DOUBLE PRECISION NOT NULL,
		"size" TEXT
	);

	CREATE TABLE IF NOT EXISTS wishlists (
		"id" TEXT PRIMARY KEY,
		"userId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
		"productId" TEXT NOT NULL REFERENCES products("id") ON DELETE CASCADE,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT "wishlists_userId_productId_key" UNIQUE ("userId", "productId")
	);

	CREATE TABLE IF NOT EXISTS reviews (
		"id" TEXT PRIMARY KEY,
		"productId" TEXT NOT NULL REFERENCES products("id") ON DELETE CASCADE,
		"userId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
		"rating" INTEGER NOT NULL DEFAULT 5,
		"title" TEXT,
		"comment" TEXT NOT NULL,
		"verified" BOOLEAN NOT NULL DEFAULT false,
		"helpful" INTEGER NOT NULL DEFAULT 0,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS password_reset_tokens (
		"id" TEXT PRIMARY KEY,
		"token" TEXT UNIQUE NOT NULL,
		"userId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
		"expiresAt" TIMESTAMP(3) NOT NULL,
		"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err := pool.Exec(ctx, ddl)
	return err
}

func seedData(ctx context.Context, pool *pgxpool.Pool) error {
	now := time.Now()

	// 1. Seed Users
	adminHash, err := hash.HashPassword("admin123")
	if err != nil {
		return err
	}
	userHash, err := hash.HashPassword("user1234")
	if err != nil {
		return err
	}

	const insertUser = `
		INSERT INTO users ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5::"UserRole", true, $6, $6)
		ON CONFLICT ("email") DO UPDATE SET "password" = EXCLUDED."password", "role" = EXCLUDED."role", "name" = EXCLUDED."name"
	`
	if _, err := pool.Exec(ctx, insertUser, uuid.NewString(), "admin@shoes4us.com", adminHash, "Admin Shoes4Us", "ADMIN", now); err != nil {
		return err
	}
	if _, err := pool.Exec(ctx, insertUser, uuid.NewString(), "user@shoes4us.com", userHash, "Budi Santoso", "USER", now); err != nil {
		return err
	}

	// 2. Seed Categories
	categories := []struct {
		name string
		slug string
	}{
		{"Sneakers", "sneakers"},
		{"Running", "running"},
		{"Basketball", "basketball"},
		{"Lifestyle", "lifestyle"},
		{"Training", "training"},
	}

	catMap := make(map[string]string)
	const insertCat = `
		INSERT INTO categories ("id", "name", "slug", "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, true, $4, $4)
		ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
		RETURNING "id", "slug"
	`
	for _, c := range categories {
		var id, slug string
		err := pool.QueryRow(ctx, insertCat, uuid.NewString(), c.name, c.slug, now).Scan(&id, &slug)
		if err != nil {
			return err
		}
		catMap[slug] = id
	}

	// 3. Seed Products
	products := []struct {
		name         string
		slug         string
		desc         string
		brand        string
		categorySlug string
		price        float64
		segment      string
		audience     string
		imageURL     string
		isNewArrival bool
		isExclusive  bool
		isSale       bool
	}{
		{
			name:         "Nike Air Jordan 1 Retro High OG",
			slug:         "nike-air-jordan-1-retro-high-og",
			desc:         "Sepatu basket legendaris yang memadukan kenyamanan modern dengan desain ikonik warisan Michael Jordan.",
			brand:        "Nike",
			categorySlug: "sneakers",
			price:        2499000,
			segment:      "SHOES",
			audience:     "UNISEX",
			imageURL:     "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
			isNewArrival: true,
			isExclusive:  true,
		},
		{
			name:         "Nike Air Pegasus 40",
			slug:         "nike-air-pegasus-40",
			desc:         "Sepatu lari serbaguna dengan bantalan responsif untuk lari harian dan maraton jarak jauh.",
			brand:        "Nike",
			categorySlug: "running",
			price:        1999000,
			segment:      "SHOES",
			audience:     "MEN",
			imageURL:     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
			isNewArrival: true,
			isSale:       false,
		},
		{
			name:         "Adidas Ultraboost Light",
			slug:         "adidas-ultraboost-light",
			desc:         "Teknologi Boost paling ringan dari adidas untuk pengembalian energi maksimal di setiap langkah.",
			brand:        "Adidas",
			categorySlug: "running",
			price:        2899000,
			segment:      "SHOES",
			audience:     "UNISEX",
			imageURL:     "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=800&q=80",
			isNewArrival: false,
			isSale:       true,
		},
		{
			name:         "Puma MB.02 Basketball",
			slug:         "puma-mb-02-basketball",
			desc:         "Sepatu khas LaMelo Ball dengan traksi agresif dan bantalan Nitro Foam untuk permainan eksplosif.",
			brand:        "Puma",
			categorySlug: "basketball",
			price:        2199000,
			segment:      "SHOES",
			audience:     "MEN",
			imageURL:     "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
			isExclusive:  true,
		},
		{
			name:         "New Balance 550 Vintage White",
			slug:         "new-balance-550-vintage-white",
			desc:         "Siluet klasik bernuansa vintage 80-an yang menjadi ikon gaya streetwear kontemporer.",
			brand:        "New Balance",
			categorySlug: "lifestyle",
			price:        1899000,
			segment:      "SHOES",
			audience:     "UNISEX",
			imageURL:     "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
			isNewArrival: true,
		},
	}

	sizes := []string{"38", "39", "40", "41", "42", "43", "44"}

	const insertProd = `
		INSERT INTO products ("id", "name", "slug", "description", "price", "stock", "imageUrl", "categoryId", "brand", "segment", "audience", "isNewArrival", "isExclusive", "isComingSoon", "isSale", "isActive", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::"ProductSegment", $11::"ProductAudience", $12, $13, $14, $15, true, $16, $16)
		ON CONFLICT ("slug") DO UPDATE SET
			"name" = EXCLUDED."name",
			"description" = EXCLUDED."description",
			"price" = EXCLUDED."price",
			"imageUrl" = EXCLUDED."imageUrl",
			"brand" = EXCLUDED."brand",
			"stock" = EXCLUDED."stock"
		RETURNING "id"
	`

	const insertSize = `
		INSERT INTO product_sizes ("id", "productId", "size", "stock", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $5)
		ON CONFLICT ("productId", "size") DO UPDATE SET "stock" = EXCLUDED."stock"
	`

	for _, p := range products {
		catID, ok := catMap[p.categorySlug]
		if !ok {
			continue
		}

		totalStock := len(sizes) * 10
		prodID := uuid.NewString()

		var actualProdID string
		err := pool.QueryRow(ctx, insertProd,
			prodID,
			p.name,
			p.slug,
			p.desc,
			p.price,
			totalStock,
			p.imageURL,
			catID,
			p.brand,
			p.segment,
			p.audience,
			p.isNewArrival,
			p.isExclusive,
			false,
			p.isSale,
			now,
		).Scan(&actualProdID)
		if err != nil {
			return fmt.Errorf("failed inserting product %s: %w", p.name, err)
		}

		for _, sz := range sizes {
			sizeID := uuid.NewString()
			_, err := pool.Exec(ctx, insertSize, sizeID, actualProdID, sz, 10, now)
			if err != nil {
				return fmt.Errorf("failed inserting size %s for %s: %w", sz, p.name, err)
			}
		}
	}

	return nil
}

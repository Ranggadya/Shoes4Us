package database

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EnsureSchema creates all necessary database types, tables, and constraints if they do not already exist.
func EnsureSchema(ctx context.Context, pool *pgxpool.Pool) error {
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

	if _, err := pool.Exec(ctx, ddl); err != nil {
		return fmt.Errorf("database: failed to ensure schema: %w", err)
	}

	return nil
}

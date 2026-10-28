# Capability Map: Shoes4Us Go REST API Backend

Dokumen ini memetakan dekomposisi kapabilitas (*Phase 0: Scope Check*) untuk pengembangan layanan backend **Shoes4Us E-Commerce Platform** menggunakan **Go (Golang)** pada direktori `backend/`. Setiap modul memiliki ID stabil (*kebab-case*), arah dependensi satu arah (*no cycles*), dan dapat diuji secara independen.

## Tabel Kapabilitas Modul

| Module ID | Tanggung Jawab (*Responsibility*) | Endpoints Utama | Depends On |
| :--- | :--- | :--- | :--- |
| `core-foundation` | Bootstrap server HTTP (`:8080`), konfigurasi `.env`, koneksi pool PostgreSQL, response/error envelope standar, CORS & logging middleware, healthcheck (`/api/health`) | `GET /api/health` | — |
| `identity-users` | Autentikasi JWT (`register`, `login`, `me`, `forgot-password`, `reset-password`), Bcrypt password hashing, middleware JWT & Role Guard (`USER`, `ADMIN`), manajemen profil & ubah password user | `/api/auth/*`, `/api/users/*` | `core-foundation` |
| `catalog-reviews` | Katalog produk publik (filter, search, sort, paginasi), detail produk & stok varian ukuran (`product_sizes`), CRUD produk Admin (`JSON` & `multipart/form-data`), daftar kategori (`categories`), serta ulasan & ringkasan rating (`reviews`) | `/api/products/*`, `/api/categories`, `/api/reviews` | `core-foundation`, `identity-users` |
| `cart-wishlist` | Manajemen keranjang belanja per ukuran (`carts`, `cart_items`, validasi stok real-time, kalkulasi subtotal) dan daftar keinginan pengguna (`wishlists`, mode full & `fields=ids`) | `/api/cart/*`, `/api/wishlist/*` | `core-foundation`, `identity-users`, `catalog-reviews` |
| `orders-payment` | Checkout atomik (validasi & pengurangan stok `products` + `product_sizes` dalam DB transaction), riwayat pesanan pelanggan & seluruh pesanan Admin (`scope=all`), pembatalan pesanan oleh pelanggan (pengembalian stok), update status pesanan Admin (`/status`), dan konfirmasi pembayaran (`/api/payment`) | `/api/orders/*`, `/api/payment` | `core-foundation`, `identity-users`, `catalog-reviews`, `cart-wishlist` |

## Grafik Dependensi & Urutan Pembangunan (*Build Order*)

```text
core-foundation
       │
       ▼
identity-users
       │
       ▼
catalog-reviews
       │
       ▼
 cart-wishlist
       │
       ▼
orders-payment
```

**Build Order:** `core-foundation` → `identity-users` → `catalog-reviews` → `cart-wishlist` → `orders-payment`

## Indeks Dokumen Spesifikasi & Perencanaan

- **Spesifikasi Teknis Lengkap:** [`SPEC-backend.md`](./SPEC-backend.md)
- **Rencana Implementasi (*Implementation Plan*):** [`tasks/plan.md`](./tasks/plan.md)
- **Daftar Tugas Terurut (*Task Breakdown*):** [`tasks/todo.md`](./tasks/todo.md)


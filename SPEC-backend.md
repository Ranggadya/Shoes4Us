# Spec: Shoes4Us Go REST API Backend (`SPEC-backend`)

## Asumsi Awal (*Surfaced Assumptions*)

Sebelum kode ditulis, berikut adalah asumsi teknis yang digunakan dalam spesifikasi ini berdasarkan struktur monorepo saat ini (`frontend/` & `backend/reference/`):

1. **Kompatibilitas Skema Database Eksisting**: Backend Go akan terhubung ke database **PostgreSQL** yang skema tabelnya sudah didefinisikan di [`backend/reference/prisma/schema.prisma`](./backend/reference/prisma/schema.prisma) dan [`backend/reference/prisma/migrations/`](./backend/reference/prisma/migrations/) (`users`, `categories`, `products`, `product_sizes`, `carts`, `cart_items`, `orders`, `order_items`, `wishlists`, `reviews`, `password_reset_tokens`).
2. **Kompatibilitas Penuh dengan Frontend React SPA (`frontend/`)**: Seluruh kontrak URL (`/api/*`), query parameter, request body (`application/json` dan `multipart/form-data` untuk form produk Admin), serta struktur JSON response (`{ "success": true, "data": ..., "message": ..., "meta": ... }`) harus 100% kompatibel tanpa perlu merombak ulang `frontend/src/`.
3. **Autentikasi Dual-Mode (Bearer JWT + Cookie Fallback)**: Frontend mengirim header `Authorization: Bearer <token>` (melalui `frontend/src/services/api.ts`) dan `credentials: "include"`. Middleware Go akan memprioritaskan `Authorization: Bearer <token>` dengan fallback ke cookie `token`.
4. **Driver Database & Router**: Menggunakan **Go 1.25+** (terdeteksi `go1.25.5` di environment lokal), router ringan **`go-chi/chi/v5`** (atau **`gin-gonic/gin`**), dan koneksi PostgreSQL **`jackc/pgx/v5/pgxpool`** dengan SQL terparameterisasi untuk performa tinggi, kontrol penuh atas transaksi stok atomik, serta kompatibilitas langsung terhadap tabel hasil migrasi Prisma.

---

## 1. Objective

Membangun layanan **REST API Backend menggunakan Go (Golang)** di dalam direktori `backend/` untuk platform e-commerce **Shoes4Us**, menggantikan arsip backend Next.js lama di `backend/reference/` dengan arsitektur bersih (*Clean Layered Architecture*: Handler → Service → Repository).

### Target Pengguna & Kebutuhan:
- **Pelanggan (`USER` / `CUSTOMER`)**:
  - Registrasi, login JWT, lupa/reset password, serta manajemen profil & ubah password.
  - Menjelajahi katalog sepatu dengan pencarian, filter multi-kriteria (`category`, `segment`, `audience`, `brand`, `collection`, `minPrice`, `maxPrice`, `isSale`, dll.), melihat detail stok per ukuran (`product_sizes`), dan membaca/menulis ulasan (`reviews`).
  - Mengelola keranjang belanja (`cart`) per ukuran sepatu, mengelola `wishlist`, melakukan checkout pesanan (`orders`), membatalkan pesanan berstatus `PENDING`/`PROCESSING`, serta mengonfirmasi pembayaran (`payment`).
- **Administrator Toko (`ADMIN`)**:
  - Mengelola katalog produk (CRUD produk beserta alokasi stok per ukuran `38`–`45`).
  - Melihat seluruh pesanan pelanggan (`GET /api/orders?scope=all`) dan memperbarui status siklus pesanan (`PATCH /api/orders/:id/status`).

---

## 2. Tech Stack

| Komponen | Teknologi / Paket Go | Versi Target | Catatan Penggunaan |
| :--- | :--- | :--- | :--- |
| **Bahasa** | Go (Golang) | `1.25+` | Terinstal di mesin lokal: `go1.25.5 windows/amd64` |
| **HTTP Router** | `github.com/go-chi/chi/v5` | `v5.2.x` | Idiomatik `net/http`, ringan, mendukung route group & middleware |
| **Database Driver** | `github.com/jackc/pgx/v5` (`pgxpool`) | `v5.7.x` | Connection pooling PostgreSQL performa tinggi & transaksi `pgx.Tx` |
| **Autentikasi JWT** | `github.com/golang-jwt/jwt/v5` | `v5.2.x` | Pembuatan & verifikasi token HS256 (`userId`, `email`, `name`, `role`) |
| **Password Hashing** | `golang.org/x/crypto/bcrypt` | `latest` | Kompatibel dengan hash Bcrypt (`$2a$` / `$2b$`) di tabel `users` |
| **UUID Generator** | `github.com/google/uuid` | `v1.6.x` | Generasi UUID v4 untuk primary key tabel |
| **Env Config** | `github.com/joho/godotenv` | `v1.5.x` | Memuat variabel lingkungan dari `.env` |
| **CORS** | `github.com/go-chi/cors` | `v1.2.x` | Mengizinkan origin `http://localhost:3000` dengan credentials & `Authorization` |

---

## 3. Commands

Seluruh perintah dijalankan dari direktori `backend/` (atau melalui script root `package.json` yang akan ditambahkan):

```bash
# Inisialisasi & unduh dependensi Go
cd backend && go mod tidy

# Menjalankan server development (port 8080)
cd backend && go run ./cmd/api

# Kompilasi binary production
cd backend && go build -v -o bin/shoes4us-api.exe ./cmd/api

# Menjalankan seluruh unit & integration test dengan race detector dan coverage
cd backend && go test -v -race -coverprofile=coverage.out ./...

# Pemeriksaan statik & kualitas kode (linting/vetting)
cd backend && go fmt ./... && go vet ./...
```

---

## 4. Project Structure

```text
backend/
├── cmd/
│   └── api/
│       └── main.go                  # Entry point: load config, init DB pool, wire layers, graceful shutdown
├── internal/
│   ├── config/
│   │   └── config.go                # Pembacaan & validasi env vars (PORT, DATABASE_URL, JWT_SECRET, CORS, SMTP)
│   ├── database/
│   │   └── postgres.go              # Inisialisasi pgxpool.Pool & helper transaksi
│   ├── domain/
│   │   ├── user.go                  # Struct User, UserRole, Auth DTOs, PasswordResetToken
│   │   ├── product.go               # Struct Product, ProductSize, Category, ProductFilter, PaginationMeta
│   │   ├── cart.go                  # Struct Cart, CartItem, CartTotals
│   │   ├── wishlist.go              # Struct WishlistItem
│   │   ├── order.go                 # Struct Order, OrderItem, OrderStatus, AllowedTransitions
│   │   ├── review.go                # Struct Review, ReviewSummary
│   │   └── errors.go                # AppError terstandarisasi (400, 401, 403, 404, 409, 500)
│   ├── repository/
│   │   ├── user_repository.go       # Query tabel users & password_reset_tokens
│   │   ├── category_repository.go   # Query tabel categories
│   │   ├── product_repository.go    # Query tabel products & product_sizes (filter, sort, mutasi stok)
│   │   ├── cart_repository.go       # Query tabel carts & cart_items
│   │   ├── wishlist_repository.go   # Query tabel wishlists
│   │   ├── order_repository.go      # Query tabel orders & order_items (dengan DB transaction)
│   │   └── review_repository.go     # Query tabel reviews & agregasi rating
│   ├── service/
│   │   ├── auth_service.go          # Logika register, login, me, forgot/reset password
│   │   ├── user_service.go          # Logika update profil & ubah password
│   │   ├── product_service.go       # Logika katalog, slug generator, sinkronisasi stok ukuran
│   │   ├── cart_service.go          # Logika keranjang, validasi stok ukuran, kalkulasi subtotal
│   │   ├── wishlist_service.go      # Logika tambah/hapus/ambil wishlist
│   │   ├── order_service.go         # Logika checkout atomik, validasi transisi status, restock saat cancel
│   │   ├── payment_service.go       # Logika konfirmasi pembayaran & pengosongan keranjang
│   │   └── review_service.go        # Logika tambah ulasan & ringkasan rating
│   ├── handler/
│   │   ├── router.go                # Registrasi seluruh rute /api/* pada Chi router
│   │   ├── auth_handler.go          # Handler /api/auth/*
│   │   ├── user_handler.go          # Handler /api/users/*
│   │   ├── product_handler.go       # Handler /api/products/* & /api/categories (mendukung JSON & FormData)
│   │   ├── cart_handler.go          # Handler /api/cart/*
│   │   ├── wishlist_handler.go      # Handler /api/wishlist/*
│   │   ├── order_handler.go         # Handler /api/orders/* & /api/payment
│   │   └── review_handler.go        # Handler /api/reviews
│   └── middleware/
│       ├── auth_middleware.go       # Ekstraksi & verifikasi JWT, injeksi UserClaims ke context.Context
│       └── cors_middleware.go       # Konfigurasi CORS & request logger
├── pkg/
│   ├── hash/
│   │   └── bcrypt.go                # Wrapper HashPassword & CheckPasswordHash
│   ├── token/
│   │   └── jwt.go                   # SignToken & VerifyToken (HS256)
│   └── response/
│       └── json.go                  # Helper WriteSuccess, WriteCreated, WriteError sesuai kontrak FE
├── reference/                       # [READ-ONLY] Arsip kode backend lama & Prisma schema/migrations
├── .env.example                     # Template environment variables untuk backend Go
├── go.mod
└── README.md
```

---

## 5. Code Style & Kontrak Respons API

### Konvensi Utama:
- **JSON Envelope Seragam**: Seluruh endpoint mengembalikan struktur yang kompatibel dengan [`frontend/src/services/api.ts`](./frontend/src/services/api.ts):
  - Sukses: `{"success": true, "message": "...", "data": ..., "meta": ...}`
  - Gagal: `{"success": false, "message": "Pesan error", "error": {"message": "Pesan error", "code": "..."}}` (sehingga baik pembaca `payload.error.message`, `payload.error`, maupun `payload.message` di frontend bekerja mulus).
- **Context Propagation**: Setiap metode `Service` dan `Repository` menerima `ctx context.Context` sebagai parameter pertama.
- **Explicit Error Handling**: Gunakan tipe `domain.AppError` untuk memetakan error domain ke HTTP status code secara terpusat di `response.WriteError(w, err)`.

### Contoh Gaya Kode (*Handler & Response Helper*):

```go
package response

import (
	"encoding/json"
	" errors"
	"net/http"

	"github.com/ranggadya/shoes4us/backend/internal/domain"
)

type Envelope struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    any         `json:"data,omitempty"`
	Meta    any         `json:"meta,omitempty"`
	Error   *ErrorField `json:"error,omitempty"`
}

type ErrorField struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, payload Envelope) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteError(w http.ResponseWriter, err error) {
	var appErr *domain.AppError
	if errors.As(err, &appErr) {
		WriteJSON(w, appErr.Status, Envelope{
			Success: false,
			Message: appErr.Message,
			Error:   &ErrorField{Message: appErr.Message, Code: appErr.Code},
		})
		return
	}
	WriteJSON(w, http.StatusInternalServerError, Envelope{
		Success: false,
		Message: "Terjadi kesalahan pada server",
		Error:   &ErrorField{Message: "Terjadi kesalahan pada server", Code: "INTERNAL_ERROR"},
	})
}
```

---

## 6. Spesifikasi Kontrak Endpoint (Sinkron dengan Frontend React)

### 6.1 `identity-users` (`/api/auth` & `/api/users`)
- `POST /api/auth/register`: Body `{ email, password, name }` → `201 Created` `{ success: true, data: { user: { id, email, name, role }, token } }`.
- `POST /api/auth/login`: Body `{ email, password }` → `200 OK` `{ success: true, data: { user: { id, email, name, role }, token } }`.
- `GET /api/auth/me` *(Auth)*: → `200 OK` `{ success: true, data: { user: { id, email, name, role } } }`.
- `POST /api/auth/forgot-password`: Body `{ email }` → Membuat record di `password_reset_tokens` (berlaku 1 jam), mengirim email (atau mencetak tautan reset di log saat mode dev tanpa SMTP), mengembalikan `200 OK`.
- `POST /api/auth/reset-password`: Body `{ token, password, newPassword }` (menerima `newPassword` atau `password`) → Memvalidasi token & expiry, meng-update hash password di `users`, menghapus token, mengembalikan `200 OK`.
- `PATCH /api/users/:id` *(Auth: Self atau Admin)*: Body `{ name, email }` → Meng-update profil user, mengembalikan `{ success: true, data: { id, name, email, role } }`.
- `PATCH /api/users/:id/password` *(Auth: Self atau Admin)*: Body `{ currentPassword, newPassword }` → Memverifikasi `currentPassword`, meng-update password baru (min. 8 karakter), mengembalikan `200 OK`.

### 6.2 `catalog-reviews` (`/api/products`, `/api/categories`, `/api/reviews`)
- `GET /api/categories`: Mengembalikan kategori aktif `{ success: true, data: [ { id, name, slug } ] }`.
- `GET /api/products`: Mendukung query params:
  - `search`, `category` (slug atau nama kategori, *case-insensitive*), `categoryId`, `segment` (`SHOES|APPAREL|ACCESSORIES`), `audience` (`UNISEX|MEN|WOMEN|KIDS`), `brand`, `collection` (`new-arrivals|exclusive|coming-soon|sale`), `isNewArrival`, `isExclusive`, `isComingSoon`, `isSale`/`sale`, `minPrice`, `maxPrice`, `sortBy` (`newest|oldest|price-asc|price-desc|name-asc|name-desc|stock-asc`), `includeDetails` (`true` menyertakan relasi `sizes`), `page` (default `1`), `limit`/`pageSize` (default `20`).
  - Response: `{ success: true, data: { items: [...] }, meta: { page, limit, total, totalPages } }`.
- `GET /api/products/:id`: Mendukung pencarian berdasarkan UUID `id` maupun `slug`, selalu menyertakan `category` dan `sizes` (`product_sizes` terurut) → `{ success: true, data: { product: {...} } }`.
- `POST /api/products` & `PUT /api/products/:id` *(Auth: `ADMIN`)*:
  - **Penting**: Menerima baik `multipart/form-data` (yang dikirim oleh `AdminProductPage.tsx` dan `AdminAddProductPage.tsx`) maupun `application/json`.
  - Otomatis me-*resolve* nama `category` (mis. `"Sneakers"`) ke `categoryId` di tabel `categories` (membuat kategori secara otomatis jika belum ada), meng-generate `slug` unik, menyimpan array `sizes` (`JSON.parse` dari field `"sizes"` pada `FormData`), dan menghitung total `stock`.
- `DELETE /api/products/:id` *(Auth: `ADMIN`)*: Menghapus produk (atau *soft-delete* `isActive = false` bila sudah memiliki riwayat `order_items` agar foreign key aman).
- `GET /api/reviews?productId=:id&summaryOnly=true|false`:
  - Jika `summaryOnly=true`: `{ success: true, data: { summary: { averageRating, total } } }`.
  - Jika default: `{ success: true, data: { reviews: [...], summary: { averageRating, total } } }`.
- `POST /api/reviews` *(Auth)*: Body `{ productId, rating, title, comment }` → Menyimpan review baru dan mengembalikan `201 Created`.

### 6.3 `cart-wishlist` (`/api/cart` & `/api/wishlist`)
- `GET /api/cart` *(Auth)*: Mengembalikan `{ success: true, data: { id, items: [ { id, quantity, size, lineTotal, product: { id, name, price, imageUrl } } ], totals: { subtotal, totalItems } } }`.
- `POST /api/cart` *(Auth)*: Body `{ productId, quantity, size }` → Memvalidasi ketersediaan stok ukuran di `product_sizes` (atau `products.stock`), melakukan upsert item ke `cart_items`, lalu mengembalikan state cart terbaru.
- `PATCH /api/cart/:itemId` & `PUT /api/cart/:itemId` *(Auth)*: Body `{ quantity }` → Meng-update kuantitas item (atau menghapus jika `quantity <= 0`) setelah memvalidasi stok.
- `DELETE /api/cart/:itemId` & `DELETE /api/cart` *(Auth)*: Menghapus 1 item atau mengosongkan keranjang user.
- `GET /api/wishlist` *(Auth)*:
  - Jika `?fields=ids`: `{ success: true, data: { items: [ { productId } ] } }`.
  - Jika default: `{ success: true, data: { items: [ { id, productId, createdAt, product: { id, name, price, imageUrl, stock, slug, category } } ] } }`.
- `POST /api/wishlist` *(Auth)*: Body `{ productId }` → Menambahkan produk ke wishlist (`ON CONFLICT DO NOTHING`).
- `DELETE /api/wishlist/:productId` *(Auth)*: Menghapus produk dari wishlist user.

### 6.4 `orders-payment` (`/api/orders` & `/api/payment`)
- `POST /api/orders` *(Auth)*: Body `{ shippingAddress, shippingCity, shippingPostalCode, shippingPhone, paymentMethod }` →
  - Dalam **1 transaksi database (`pgx.Tx`)**: membaca isi cart user, mengunci & memvalidasi stok tiap item & ukuran, membuat record `orders` (dengan `orderNumber` unik mis. `ORD-YYYYMMDD-XXXX` dan status `PENDING`) beserta `order_items`, dan mengurangi stok pada `product_sizes` serta `products`.
  - Response: `{ success: true, data: { message: "Pesanan berhasil dibuat", order: { id, orderNumber, ... } } }`.
- `GET /api/orders` *(Auth)*:
  - Jika `scope=all` dan role `ADMIN`: mengembalikan seluruh pesanan semua user beserta objek `user: { name, email }` dan `items`.
  - Jika pelanggan biasa: mengembalikan daftar pesanan milik `userId` tersebut terurut dari terbaru.
  - Response: `{ success: true, data: { orders: [...] } }`.
- `GET /api/orders/:id` *(Auth)*: Mengembalikan detail pesanan (hanya pemilik pesanan atau `ADMIN`).
- `PATCH /api/orders/:id` *(Auth)*: Membatalkan pesanan milik user (hanya diizinkan jika status saat ini `PENDING` atau `PROCESSING`) dan **mengembalikan stok** (`product_sizes` & `products`) dalam transaksi DB.
- `PATCH /api/orders/:id/status` *(Auth: `ADMIN`)*: Body `{ status }` → Memvalidasi transisi status pesanan (`PENDING` → `PAID`/`PROCESSING`/`CANCELLED`, `PROCESSING` → `PAID`/`SHIPPED`/`CANCELLED`, `PAID` → `PROCESSING`/`SHIPPED`/`CANCELLED`, `SHIPPED` → `DELIVERED`), mengembalikan stok jika diubah ke `CANCELLED`, dan menyimpan status baru.
- `POST /api/payment` *(Auth)*: Body `{ orderId }` → Memverifikasi kepemilikan order, mengubah status order menjadi `PAID`, mengosongkan keranjang belanja user (`carts`), dan mengembalikan `{ success: true, data: { token, redirect_url } }`.

---

## 7. Testing Strategy

- **Framework**: Paket standar Go `testing`, `net/http/httptest`, serta *table-driven tests*.
- **Lokasi File Test**: Berdampingan dengan kode sumber (`*_test.go`), misalnya `internal/service/order_service_test.go` dan `internal/handler/auth_handler_test.go`.
- **Level Pengujian**:
  1. **Unit Tests (`pkg/hash`, `pkg/token`, `internal/service`)**: Menguji hashing Bcrypt, penandatanganan/verifikasi JWT, kalkulasi keranjang, aturan transisi `OrderStatus`, dan validasi input menggunakan mock repository interface.
  2. **Handler Contract Tests (`internal/handler`)**: Menggunakan `httptest.NewRecorder()` untuk memverifikasi status HTTP, struktur JSON envelope `{ success, data, error }`, middleware JWT guard, dan parsing `FormData` vs `JSON`.
  3. **Database Smoke / Integration Check**: Memastikan query SQL terhadap skema PostgreSQL berjalan tanpa error kolom/tipe.

---

## 8. Boundaries

- **Always do (Selalu Lakukan):**
  - Jalankan `go vet ./...` dan `go test ./...` sebelum setiap commit.
  - Gunakan *parameterized SQL queries* (`$1, $2, ...`) di seluruh repository untuk mencegah SQL Injection.
  - Gunakan database transaction (`pgx.Tx`) saat melakukan operasi multi-tabel yang memodifikasi stok dan pesanan (`checkout`, `cancel order`, `create/update product sizes`).
  - Jaga agar folder `backend/reference/` tetap utuh dan tidak dimodifikasi sebagai arsip referensi.
- **Ask first (Tanyakan Terlebih Dahulu):**
  - Mengubah skema tabel PostgreSQL yang sudah ada (menambah/menghapus kolom atau tabel).
  - Menambahkan dependensi pihak ketiga baru di luar daftar Tech Stack di atas.
  - Mengintegrasikan layanan berbayar/eksternal aktif (seperti kredensial live Midtrans atau Supabase Storage).
- **Never do (Jangan Pernah Lakukan):**
  - Melakukan *hardcode* atau melakukan commit kredensial rahasia (`.env`, `DATABASE_URL`, `JWT_SECRET`) ke Git.
  - Mengembalikan stack trace mentah atau pesan error driver database internal langsung ke response JSON klien.
  - Mengabaikan pengecekan role `ADMIN` pada endpoint mutasi produk dan perubahan status pesanan.

---

## 9. Success Criteria

Implementasi dinyatakan selesai apabila seluruh kondisi terukur berikut terpenuhi:
1. `go build ./cmd/api` dan `go vet ./...` di dalam folder `backend/` berhasil dengan **0 error dan 0 warning**.
2. Seluruh unit & handler test (`go test -race ./...`) lulus (**PASS**).
3. Server Go berjalan di `http://localhost:8080` dan merespons `GET /api/health` dengan `200 OK`.
4. Seluruh 7 kelompok modul endpoint (`auth`, `users`, `categories`, `products`, `reviews`, `cart`, `wishlist`, `orders`, `payment`) mengembalikan format JSON yang sesuai dengan ekspektasi `frontend/src/`.
5. Operasi *Checkout* (`POST /api/orders`) mengurangi stok `product_sizes` dan `products` secara akurat, dan *Cancel Order* (`PATCH /api/orders/:id`) mengembalikan stok tersebut secara utuh.
6. Halaman Admin Produk (`AdminProductPage` & `AdminAddProductPage`) dapat menambah dan mengedit produk menggunakan `FormData` tanpa gagal parsing di backend Go.

---

## 10. Open Questions

1. **Koneksi Database Development**: Apakah Anda ingin menggunakan database PostgreSQL yang sudah ada di `.env` saat ini (Neon / PostgreSQL lokal yang dibuat oleh migrasi Prisma di `backend/reference/prisma`), dan apakah kita perlu menyediakan script *seeder* data awal (kategori, produk contoh, dan akun Admin) di Go?
2. **Transisi Status Pesanan Admin (`AdminDashboard.tsx`)**: Di dropdown Admin Dashboard, apakah Admin diperbolehkan mengubah status pesanan secara fleksibel ke status mana pun (selama logika restock saat `CANCELLED` tetap dijaga), atau harus mengikuti urutan ketat `PENDING → PAID/PROCESSING → SHIPPED → DELIVERED`?
3. **Pengiriman Email Reset Password (`POST /api/auth/forgot-password`)**: Untuk tahap pengembangan lokal, apakah cukup mengirimkan email via SMTP jika variabel `MAIL_HOST` tersedia di `.env` dan otomatis *fallback* mencetak URL reset password ke terminal log server jika SMTP belum dikonfigurasi?


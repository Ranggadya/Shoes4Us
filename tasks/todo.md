# Task Breakdown: Shoes4Us Go REST API Backend

Dokumen ini berisi rincian tugas terurut (*vertical slices*) untuk mengimplementasikan [`SPEC-backend.md`](../SPEC-backend.md) sesuai rencana di [`tasks/plan.md`](./plan.md).

---

## Phase 1: Foundation (`core-foundation`)

## Task 1: Inisialisasi Modul Go, Config, dan Paket Utilitas (`hash`, `token`, `response`)

**Description:** Menginisialisasi modul Go di `backend/go.mod`, membuat pembaca konfigurasi `.env` (`internal/config`), serta membangun 3 paket utilitas inti: hashing password Bcrypt (`pkg/hash`), pembuatan & verifikasi JWT HS256 (`pkg/token`), dan penulis response JSON seragam (`pkg/response`) beserta definisi `domain.AppError`.

**Acceptance criteria:**
- [x] `backend/go.mod` terinisialisasi dengan dependensi utama (`chi`, `cors`, `pgx/v5`, `jwt/v5`, `bcrypt`, `uuid`, `godotenv`).
- [x] `pkg/hash` dapat meng-hash password dan memverifikasi kecocokan hash Bcrypt.
- [x] `pkg/token` dapat menandatangani dan mem-parsing klaim JWT (`userId`, `email`, `name`, `role`).
- [x] `pkg/response` menghasilkan JSON envelope `{ "success": true/false, "message": "...", "data": ..., "error": ... }` sesuai kontrak frontend.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./pkg/...`
- [x] Build succeeds: `cd backend && go vet ./...`
- [x] Manual check: Verifikasi output JSON dari unit test `pkg/response`.

**Dependencies:** None

**Files likely touched:**
- `backend/go.mod`
- `backend/.env.example`
- `backend/internal/config/config.go`
- `backend/internal/domain/errors.go`
- `backend/pkg/hash/bcrypt.go`
- `backend/pkg/token/jwt.go`
- `backend/pkg/response/json.go`

**Estimated scope:** Medium (5–7 files)

---

## Task 2: Koneksi Database PostgreSQL (`pgxpool`), Chi Router Bootstrap, CORS, dan Healthcheck

**Description:** Membangun koneksi pool PostgreSQL menggunakan `pgxpool` (`internal/database/postgres.go`), menyiapkan middleware CORS & request logger (`internal/middleware/cors_middleware.go`), merangkai router utama (`internal/handler/router.go`), dan membuat entry point server di `cmd/api/main.go` dengan graceful shutdown serta endpoint `GET /api/health`.

**Acceptance criteria:**
- [x] `internal/database/postgres.go` membuka koneksi `pgxpool.Pool` dengan konfigurasi timeout yang aman.
- [x] CORS mengizinkan origin frontend (`http://localhost:3000` dan `http://localhost:5173`), method `GET, POST, PUT, PATCH, DELETE, OPTIONS`, header `Authorization, Content-Type`, dan `AllowCredentials: true`.
- [x] `GET /api/health` mengembalikan `200 OK` dengan JSON `{"success": true, "data": {"status": "ok"}}`.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/handler/...`
- [x] Build succeeds: `cd backend && go build -o bin/shoes4us-api.exe ./cmd/api`
- [x] Manual check: Jalankan server dan panggil `GET http://localhost:8080/api/health`.

**Dependencies:** Task 1

**Files likely touched:**
- `backend/internal/database/postgres.go`
- `backend/internal/middleware/cors_middleware.go`
- `backend/internal/handler/router.go`
- `backend/cmd/api/main.go`

**Estimated scope:** Medium (4 files)

---

## Checkpoint 1: Foundation Ready
- [x] All unit tests in `pkg/` and `internal/` pass (`cd backend && go test -race ./...`).
- [x] Application binary builds cleanly without errors (`cd backend && go build ./cmd/api`).
- [x] `GET /api/health` responds with `200 OK` and valid CORS headers.

---

## Phase 2: Identity & Users (`identity-users`)

## Task 3: Autentikasi JWT (`register`, `login`, `me`) dan Middleware Auth/Role Guard

**Description:** Mengimplementasikan domain model `User`, `UserRepository`, `AuthService`, middleware autentikasi JWT (`RequireAuth` & `RequireAdmin`), serta `AuthHandler` untuk endpoint `POST /api/auth/register`, `POST /api/auth/login`, dan `GET /api/auth/me`.

**Acceptance criteria:**
- [x] `POST /api/auth/register` memvalidasi email/password/name, menolak email duplikat (`409 Conflict`), menyimpan user baru dengan hash Bcrypt dan role `USER`, serta mengembalikan `{ user, token }` + cookie `token`.
- [x] `POST /api/auth/login` memverifikasi email & password Bcrypt, menolak akun non-aktif/salah kredensial (`401 Unauthorized`), dan mengembalikan `{ user, token }`.
- [x] Middleware `RequireAuth` membaca token dari header `Authorization: Bearer <token>` (atau fallback cookie `token`), dan `GET /api/auth/me` mengembalikan profil user yang sedang login.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run TestAuth`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Uji alur Register → Login → `/api/auth/me` dari halaman `/register` dan `/login` di frontend.

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `backend/internal/domain/user.go`
- `backend/internal/repository/user_repository.go`
- `backend/internal/service/auth_service.go`
- `backend/internal/middleware/auth_middleware.go`
- `backend/internal/handler/auth_handler.go`

**Estimated scope:** Medium (5 files)

---

## Task 4: Lupa/Reset Password dan Manajemen Profil & Password Pengguna (`/api/users`)

**Description:** Melengkapi modul identitas dengan fitur `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, serta endpoint profil pengguna `PATCH /api/users/:id` dan `PATCH /api/users/:id/password`.

**Acceptance criteria:**
- [x] `POST /api/auth/forgot-password` menyimpan token unik dengan masa berlaku 1 jam di tabel `password_reset_tokens` dan mengirim email (atau mencatat URL reset di log jika SMTP belum diatur).
- [x] `POST /api/auth/reset-password` menerima `{ token, password, newPassword }`, memvalidasi token & kedaluwarsa, memperbarui hash password di `users`, dan menghapus token yang telah digunakan.
- [x] `PATCH /api/users/:id` dan `PATCH /api/users/:id/password` memverifikasi bahwa pemanggil adalah pemilik akun atau `ADMIN`, memvalidasi `currentPassword` saat ganti password, dan menyimpan perubahan ke tabel `users`.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run "TestUser|TestReset"`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Uji ubah nama/email dan ubah password dari `ProfilePage` (`/profile`) serta alur `/forgot-password` → `/reset-password`.

**Dependencies:** Task 3

**Files likely touched:**
- `backend/internal/repository/user_repository.go`
- `backend/internal/service/auth_service.go`
- `backend/internal/service/user_service.go`
- `backend/internal/handler/auth_handler.go`
- `backend/internal/handler/user_handler.go`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 2: Auth & User Flow Verified
- [x] All tests pass (`cd backend && go test -race ./...`).
- [x] Application builds without errors.
- [x] User registration, login, session persistence (`/api/auth/me`), password reset, and profile updates work end-to-end with React frontend.

---

## Phase 3: Catalog & Reviews (`catalog-reviews`)

## Task 5: Katalog Produk Publik, Filter Multi-Kriteria, Detail Produk, dan Kategori

**Description:** Mengimplementasikan `CategoryRepository`, `ProductRepository`, `ProductService`, dan `ProductHandler` untuk melayani `GET /api/categories`, `GET /api/products` (beserta seluruh parameter filter, pencarian, pengurutan, dan paginasi), serta `GET /api/products/:id` (berdasarkan UUID atau `slug` lengkap dengan stok varian ukuran `sizes`).

**Acceptance criteria:**
- [x] `GET /api/categories` mengembalikan daftar kategori aktif (`id`, `name`, `slug`).
- [x] `GET /api/products` mendukung filter `search`, `category`, `categoryId`, `segment`, `audience`, `brand`, `collection` (`new-arrivals`, `exclusive`, `coming-soon`, `sale`), `isNewArrival`, `isExclusive`, `isComingSoon`, `isSale`/`sale`, `minPrice`, `maxPrice`, `includeDetails`, `sortBy`, `page`, dan `limit`, serta mengembalikan `{ data: { items }, meta: { page, limit, total, totalPages } }`.
- [x] `GET /api/products/:id` mengembalikan `{ data: { product } }` lengkap dengan objek `category` dan array `sizes` (`product_sizes`).

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run TestProduct`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Buka beranda (`/`), katalog (`/product`), mega-menu Navbar, GlobalSearch, dan halaman detail produk (`/product/:id`).

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `backend/internal/domain/product.go`
- `backend/internal/repository/category_repository.go`
- `backend/internal/repository/product_repository.go`
- `backend/internal/service/product_service.go`
- `backend/internal/handler/product_handler.go`

**Estimated scope:** Medium (5 files)

---

## Task 6: Manajemen Produk Admin (`POST`, `PUT`, `DELETE /api/products`) dengan Dukungan `FormData` & `JSON`

**Description:** Menambahkan kemampuan CRUD produk untuk `ADMIN` pada `ProductRepository`, `ProductService`, dan `ProductHandler`, termasuk parser `multipart/form-data` & `application/json`, resolusi nama kategori ke `categoryId`, generasi `slug` unik, sinkronisasi tabel `product_sizes` dalam transaksi DB, serta penghapusan aman (*safe delete* / *soft-delete* jika produk sudah ada di `order_items`).

**Acceptance criteria:**
- [x] `POST /api/products` dan `PUT /api/products/:id` dilindungi middleware `RequireAdmin` dan berhasil mem-parsing baik `FormData` (dari `AdminProductPage.tsx` & `AdminAddProductPage.tsx`) maupun `JSON`.
- [x] Stok ukuran (`sizes`) disimpan secara sinkron ke tabel `product_sizes` dan total `stock` produk dihitung otomatis.
- [x] `DELETE /api/products/:id` menghapus produk (atau menonaktifkannya bila direferensikan oleh `order_items` agar tidak memicu foreign key error).

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/handler/... -run TestAdminProduct`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Tambah, edit, dan hapus produk beserta stok ukuran dari `/admin/product` dan `/admin/product/add`.

**Dependencies:** Task 5

**Files likely touched:**
- `backend/internal/repository/category_repository.go`
- `backend/internal/repository/product_repository.go`
- `backend/internal/service/product_service.go`
- `backend/internal/handler/product_handler.go`
- `backend/internal/handler/router.go`

**Estimated scope:** Medium (5 files)

---

## Task 7: Fitur Ulasan & Ringkasan Rating Produk (`/api/reviews`)

**Description:** Mengimplementasikan `ReviewRepository`, `ReviewService`, dan `ReviewHandler` untuk melayani `GET /api/reviews?productId=:id` (termasuk mode `summaryOnly=true`) dan `POST /api/reviews` untuk pengguna terautentikasi.

**Acceptance criteria:**
- [x] `GET /api/reviews?productId=:id&summaryOnly=true` mengembalikan `{ data: { summary: { averageRating, total } } }`.
- [x] `GET /api/reviews?productId=:id` mengembalikan `{ data: { reviews: [...], summary: { averageRating, total } } }` lengkap dengan nama pembuat ulasan (`user.name`).
- [x] `POST /api/reviews` memvalidasi `rating` (1–5) dan `comment`, menyimpan ulasan ke tabel `reviews`, dan mengembalikan `201 Created`.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run TestReview`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Buka tab Ulasan di `/product/:id` dan kirim ulasan baru melalui `ReviewForm`.

**Dependencies:** Task 5

**Files likely touched:**
- `backend/internal/domain/review.go`
- `backend/internal/repository/review_repository.go`
- `backend/internal/service/review_service.go`
- `backend/internal/handler/review_handler.go`
- `backend/internal/handler/router.go`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 3: Catalog, Admin CRUD & Reviews Verified
- [x] All tests pass (`cd backend && go test -race ./...`).
- [x] Product listing, filters, search, admin product creation/editing (`FormData`), and product reviews work end-to-end.

---

## Phase 4: Cart & Wishlist (`cart-wishlist`)

## Task 8: Manajemen Keranjang Belanja (`/api/cart`) dengan Validasi Stok per Ukuran

**Description:** Mengimplementasikan `CartRepository`, `CartService`, dan `CartHandler` untuk operasi `GET /api/cart`, `POST /api/cart`, `PATCH` & `PUT /api/cart/:itemId`, `DELETE /api/cart/:itemId`, dan `DELETE /api/cart`.

**Acceptance criteria:**
- [x] `GET /api/cart` mengembalikan daftar item keranjang user beserta `lineTotal` dan `totals: { subtotal, totalItems }`.
- [x] `POST /api/cart` memvalidasi ketersediaan stok ukuran di `product_sizes` (atau `products.stock`) sebelum menambah/menggabungkan kuantitas item yang memiliki `productId` dan `size` yang sama.
- [x] `PATCH /api/cart/:itemId` (dan `PUT /api/cart/:itemId`) memperbarui kuantitas item (atau menghapus item jika `quantity <= 0`), sedangkan `DELETE` menghapus satu item atau mengosongkan keranjang.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run TestCart`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Tambah sepatu dengan ukuran tertentu ke keranjang, ubah jumlah di `/cart`, dan periksa badge jumlah item di Navbar.

**Dependencies:** Task 3, Task 5

**Files likely touched:**
- `backend/internal/domain/cart.go`
- `backend/internal/repository/cart_repository.go`
- `backend/internal/service/cart_service.go`
- `backend/internal/handler/cart_handler.go`
- `backend/internal/handler/router.go`

**Estimated scope:** Medium (5 files)

---

## Task 9: Manajemen Daftar Keinginan Pengguna (`/api/wishlist`)

**Description:** Mengimplementasikan `WishlistRepository`, `WishlistService`, dan `WishlistHandler` untuk melayani `GET /api/wishlist` (mode penuh & mode `?fields=ids`), `POST /api/wishlist`, dan `DELETE /api/wishlist/:productId`.

**Acceptance criteria:**
- [x] `GET /api/wishlist?fields=ids` mengembalikan `{ data: { items: [ { productId } ] } }` untuk inisialisasi cepat `WishlistContext`.
- [x] `GET /api/wishlist` mengembalikan daftar item wishlist beserta objek `product` dan `category` untuk `WishlistPage`.
- [x] `POST /api/wishlist` dan `DELETE /api/wishlist/:productId` menambah dan menghapus produk dari wishlist secara idempoten.

**Verification:**
- [x] Tests pass: `cd backend && go test -v ./internal/handler/... -run TestWishlist`
- [x] Build succeeds: `cd backend && go build ./cmd/api`
- [x] Manual check: Klik ikon hati (`WishlistButton`) pada kartu produk/detail produk dan buka halaman `/wishlist`.

**Dependencies:** Task 3, Task 5

**Files likely touched:**
- `backend/internal/domain/wishlist.go`
- `backend/internal/repository/wishlist_repository.go`
- `backend/internal/service/wishlist_service.go`
- `backend/internal/handler/wishlist_handler.go`
- `backend/internal/handler/router.go`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 4: Cart & Wishlist Verified
- [x] All tests pass (`cd backend && go test -race ./...`).
- [x] Cart badge, cart item quantity updates, and wishlist toggling work seamlessly across pages.

---

## Phase 5: Orders, Payment & Monorepo Integration (`orders-payment`)

## Task 10: Checkout Atomik, Riwayat Pesanan, dan Pembatalan Pesanan (`/api/orders`)

**Description:** Mengimplementasikan `OrderRepository`, `OrderService`, dan `OrderHandler` untuk pembuatan order baru dari keranjang (`POST /api/orders`), pengambilan daftar pesanan pelanggan & seluruh pesanan Admin (`GET /api/orders`, `GET /api/orders/:id`), serta pembatalan pesanan oleh pelanggan (`PATCH /api/orders/:id`) dengan pengembalian stok otomatis.

**Acceptance criteria:**
- [ ] `POST /api/orders` menjalankan transaksi DB (`pgx.Tx`): memvalidasi keranjang tidak kosong, memvalidasi & mengurangi stok di `product_sizes` dan `products`, membuat record `orders` (`orderNumber` unik, status `PENDING`) dan `order_items`.
- [ ] `GET /api/orders` mengembalikan riwayat pesanan milik user, atau seluruh pesanan beserta data `user: { name, email }` ketika dipanggil dengan `?scope=all` oleh `ADMIN`.
- [ ] `PATCH /api/orders/:id` membatalkan pesanan berstatus `PENDING`/`PROCESSING` dan mengembalikan stok produk/ukuran secara atomik.

**Verification:**
- [ ] Tests pass: `cd backend && go test -v ./internal/service/... ./internal/handler/... -run TestOrder`
- [ ] Build succeeds: `cd backend && go build ./cmd/api`
- [ ] Manual check: Buat pesanan dari `/payment`, periksa riwayat di `/order`, dan uji pembatalan pesanan (pastikan stok produk kembali bertambah).

**Dependencies:** Task 5, Task 8

**Files likely touched:**
- `backend/internal/domain/order.go`
- `backend/internal/repository/order_repository.go`
- `backend/internal/service/order_service.go`
- `backend/internal/handler/order_handler.go`
- `backend/internal/handler/router.go`

**Estimated scope:** Medium (5 files)

---

## Task 11: Update Status Pesanan Admin, Konfirmasi Pembayaran (`/api/payment`), dan Script Monorepo/Seeder

**Description:** Melengkapi alur transaksi dengan endpoint Admin `PATCH /api/orders/:id/status`, endpoint konfirmasi pembayaran `POST /api/payment` (mengubah status menjadi `PAID` dan mengosongkan keranjang belanja), pembuatan seeder opsional (`cmd/seed/main.go`), serta penambahan script `dev:be` / `build:be` di `package.json` root.

**Acceptance criteria:**
- [ ] `PATCH /api/orders/:id/status` (khusus `ADMIN`) memperbarui status pesanan sesuai transisi yang valid dan mengembalikan stok apabila status diubah ke `CANCELLED`.
- [ ] `POST /api/payment` memverifikasi kepemilikan pesanan, mengubah status pesanan menjadi `PAID`, mengosongkan keranjang user, dan mengembalikan response sukses.
- [ ] `package.json` di root menyediakan script `dev:be` dan `build:be` untuk memudahkan eksekusi dari root monorepo.

**Verification:**
- [ ] Tests pass: `cd backend && go test -v -race ./...`
- [ ] Build succeeds: `cd backend && go build -o bin/shoes4us-api.exe ./cmd/api`
- [ ] Manual check: Selesaikan pembayaran di `/payment` → diarahkan ke `/status-pesanan` dengan status `PAID` dan keranjang kosong; ubah status ke `SHIPPED`/`DELIVERED` dari `/admin/dashboard`.

**Dependencies:** Task 10

**Files likely touched:**
- `backend/internal/service/payment_service.go`
- `backend/internal/service/order_service.go`
- `backend/internal/handler/order_handler.go`
- `backend/cmd/seed/main.go`
- `package.json`

**Estimated scope:** Medium (5 files)

---

## Checkpoint 5: Complete End-to-End Verification
- [ ] Seluruh unit & handler test di `backend/` lulus (`go test -race ./...`).
- [ ] `go vet ./...` dan `go build ./cmd/api` menghasilkan 0 error dan 0 warning.
- [ ] Seluruh *Success Criteria* di [`SPEC-backend.md`](../SPEC-backend.md#9-success-criteria) terpenuhi.
- [ ] Siap untuk direview pengguna.


# Panduan Lengkap Testing Web — Shoes4Us E-Commerce Platform

Dokumen ini merupakan referensi menyeluruh mengenai strategi pengujian otomatis (**Automated Testing**) pada platform web **Shoes4Us**, dengan fokus utama pada suite **End-to-End (E2E) Testing menggunakan Playwright** beserta hubungannya dengan pengujian **Unit & Integration** di Frontend maupun Backend.

---

## 1. Gambaran Besar & Piramida Testing Shoes4Us

Shoes4Us menerapkan strategi **3 lapis piramida testing** (*Testing Pyramid*) yang berjalan otomatis di setiap perubahan kode melalui GitHub Actions CI:

| Lapisan Testing | Teknologi | Cakupan Saat Ini | Cara Kerja | Apa yang Dijamin |
|---|---|---:|---|---|
| **1. Backend Unit & HTTP Integration** | Go `testing`, `net/http/httptest` | **25 file · 62 fungsi `Test*`** (10 package) | Cepat di memori (stub/fake repository & storage) | Aturan bisnis, keamanan JWT/bcrypt, rate limiter, CORS, anti-deadlock order sorting, validasi kupon, format response envelope |
| **2. Frontend Unit & Component Integration** | Vitest 4, React Testing Library, `jsdom` | **30 file · 122 test cases** | DOM simulasi dengan API mock | Render komponen UI, aksesibilitas (`aria-*`, focus trap), Context (`AuthContext`, `CartContext`), debounce kupon, utilitas format/validasi |
| **3. End-to-End (E2E) Automated Testing** | **Playwright (Chromium)** | **8 file · 22 test cases** | **Browser nyata + React SPA + Go API + PostgreSQL 16 nyata (tanpa mock)** | Seluruh rantai sistem benar-benar bekerja bersama dari klik pengguna di browser hingga persistensi transaksi di database |

**Total keseluruhan di platform Shoes4Us:** **63 file tes otomatis** lintas frontend, backend, dan full-stack E2E.

---

## 2. Detail Cakupan Tiap Lapisan Testing

### A. Backend Testing (`backend/`)
Tersebar di **10 package Go**:
- `internal/config`: validasi environment & aturan keamanan production (`ValidateRuntimeSecurity` untuk `JWT_SECRET`).
- `internal/database`: pengujian `SchemaDDL` & perilaku helper transaksi.
- `internal/handler` (10 file): pengujian HTTP integration penuh (Router → Middleware → Handler → JSON Envelope) untuk Auth, User, Product, Cart, Wishlist, Review, Order, Coupon, Shipping, dan Healthcheck.
- `internal/middleware` (3 file): verifikasi `RequireAuth`, `RequireAdmin`, CORS policy, security headers, batas body size, dan proxy-aware rate limiting.
- `internal/repository`: pengujian `sortOrderItemsForDeduction` untuk pencegahan *deadlock* transaksi checkout.
- `internal/service` (5 file): logika autentikasi (`dummyBcryptHash`, reset token, batas password 72 byte), keranjang, kupon (`DISKON10`, `HEMAT50RB`, `GRATISONGKIR`), ulasan, dan wishlist.
- `pkg/hash`, `pkg/token`, `pkg/response`, `pkg/storage`: hashing `bcrypt` + `SHA-256`, penandatanganan & verifikasi JWT `HS256`, pemetaan `AppError`, serta sanitasi path upload lokal/R2.

### B. Frontend Component & Unit Testing (`frontend/src/`)
- **Halaman (`pages/__tests__/`):** `LoginPage`, `RegisterPage`, `CartPage`, `PaymentPage`, `ProductDetailPage`, `WishlistPage`, `AdminProductPage`, `AdminAddProductPage`.
- **Komponen (`components/__tests__/`):** `Navbar`, `CartDrawer`, `CouponInput`, `AddressBookModal`, `AdminDashboard`, `AdminLayout`, `ImageUploadDropzone`, `ProductFilters`, `HomeStorefrontSections`, `FlashSaleBanner`, `WhatsAppSupportButton`, `SEO`.
- **State & API (`context/__tests__/`, `services/__tests__/`):** `AuthContext`, `CartContext`, caching & deduplikasi `api.ts`.
- **Utilitas (`utils/__tests__/`):** `auth-redirect`, `auth-validation`, `password-strength`, `format`, `size-converter`, `recently-viewed`.

### C. End-to-End (E2E) Testing (`frontend/e2e/`)
Pengujian lapis teratas yang meniru perilaku pelanggan & admin secara nyata di browser **Chromium (`1280×800`)**, memastikan tidak ada celah integrasi antara frontend React, reverse proxy Vite (`/api/*`), REST API Go Chi, dan database PostgreSQL.

---

## 3. Arsitektur & Alur Kerja E2E Playwright

```mermaid
flowchart LR
    Seed["1. Data Seeder (backend/cmd/seed)"]
    DB[("PostgreSQL 16 (Database Uji Terisolasi)")]
    API["2. Go Chi REST API (:8080)"]
    FE["3. Vite React SPA (:3000)"]
    PW["4. Playwright Chromium Runner"]
    Report["HTML Report + Trace + Screenshot + Video"]

    Seed -->|"Seed Admin, User, Kategori & 5 Sepatu"| DB
    API <-->|"Query & Transaksi SQL Atomik"| DB
    FE -->|"Proxy /api/* & /uploads/*"| API
    PW -->|"Klik, Isi Form, Reload & Assert UI"| FE
    PW -.->|"Helper Setup & Cleanup API (auth.ts)"| API
    PW -->|"Jika Gagal / Retry"| Report
```

### Struktur Direktori E2E

```text
frontend/
├── playwright.config.ts                      # Konfigurasi Playwright, viewport, timeout, reporter, auto-start Vite
├── tsconfig.node.json                        # Mengaktifkan @types/node untuk playwright.config.ts & e2e/**/*.ts
└── e2e/
    ├── README.md                             # Dokumentasi lengkap ini
    ├── helpers/
    │   └── auth.ts                           # Helper API & UI (registerUserViaAPI, loginViaAPI, loginViaUI, createPaidOrderViaAPI, getInStockProducts, uniqueEmail)
    ├── 01-auth-and-protected-routes.spec.ts  # 5 test cases — Auth, validasi error, anti open-redirect, proteksi rute
    ├── 02-guest-cart-sync.spec.ts            # 2 test cases — Sinkronisasi keranjang tamu 1 item & multi-item ke PostgreSQL
    ├── 03-complete-checkout-flow.spec.ts     # 2 test cases — Checkout penuh + DISKON10, validasi form, Transfer Bank
    ├── 04-admin-product-management.spec.ts   # 2 test cases — Admin Create, Edit modal, Delete ConfirmDialog -> katalog publik
    ├── 05-storefront-and-discovery.spec.ts   # 3 test cases — Quick Size Finder, Tabbed Showcase, Search, Recently Viewed, privasi stok
    ├── 06-cart-coupon-edge-cases.spec.ts     # 3 test cases — Cart Drawer qty/Escape, Undo hapus, alertdialog clear, voucher edge cases
    ├── 07-wishlist-reviews-profile.spec.ts   # 3 test cases — Wishlist CRUD, ulasan bintang 5, edit nama profil
    └── 08-admin-orders-and-rbac.spec.ts      # 2 test cases — Siklus pesanan Admin PAID->SHIPPED + resi pembeli, penegakan RBAC UI & API 403
```

---

## 4. Teknik & Keputusan Rekayasa pada Suite E2E

| Aspek | Implementasi di Shoes4Us | Alasan Teknis |
|---|---|---|
| **Eksekusi Serial** | `workers: 1`, `fullyParallel: false` di `playwright.config.ts` | Menghindari *race condition* stok, sesi admin, dan konflik data saat beberapa tes mengakses database PostgreSQL nyata yang sama. |
| **Isolasi Data Per Test** | `uniqueEmail()` membuat akun baru tiap tes; produk uji dihapus di blok `finally` | Setiap tes dimulai dari keranjang, wishlist, dan order yang bersih (*deterministic*) sehingga aman dijalankan berulang kali. |
| **Multi-Context Cross-Role** | `browser.newContext()` pada `08-admin-orders-and-rbac.spec.ts` | Memisahkan cookie & `localStorage` antara sesi **Admin** dan **Pembeli** dalam satu skenario tanpa saling menimpa sesi login. |
| **Accessibility-First Locators** | `getByRole`, `getByLabel`, `getByPlaceholder` | Lebih tahan perubahan styling CSS/Tailwind sekaligus ikut memverifikasi standar aksesibilitas UI (label, `dialog`, `alertdialog`, `tab`). |
| **Zero Hardcoded Sleep** | Web-first assertions (`await expect(...).toBeVisible()`, `page.waitForResponse(...)`) | Playwright otomatis menunggu hingga elemen siap atau API merespons tanpa `sleep` buatan yang lambat dan *flaky*. |
| **Auto-Start Frontend** | `webServer` di `playwright.config.ts` | Otomatis menyalakan `npm run dev -- --port 3000 --strictPort` jika belum berjalan (bisa dimatikan dengan `E2E_SKIP_WEBSERVER=1`). |
| **Diagnostik Kegagalan** | `screenshot: "only-on-failure"`, `video: "retain-on-failure"`, `trace: "on-first-retry"` | Memudahkan debugging kegagalan CI lewat Playwright Trace Viewer lengkap dengan rekaman jaringan & DOM snapshot. |

---

## 5. Katalog Lengkap 22 Test Cases E2E

### Suite 01 — `01-auth-and-protected-routes.spec.ts` (5 Test Cases)
1. **Registrasi, Persistensi Sesi & Logout:** Mendaftar akun baru di `/register` → redirect ke `/` → `page.reload()` untuk membuktikan sesi bertahan melalui `/api/auth/me` → logout dari dropdown Navbar → memastikan tombol `Login` kembali tampil.
2. **Proteksi Rute bagi Pengunjung Tanpa Login:** Mengakses `/payment` memunculkan tampilan `Butuh Login` (`Masuk Sekarang`), dan mengakses `/admin/product/add` otomatis dialihkan ke `/`.
3. **Login Akun Pembeli Seed ke Riwayat Pesanan:** Login menggunakan `user@shoes4us.com` → navigasi ke `/order` → halaman riwayat pesanan terbuka bersih.
4. **Penolakan Kredensial Salah & Email Duplikat:** Login dengan password salah tetap di `/login` dan memunculkan `#login-form-error`; registrasi memakai email yang sudah terdaftar (`user@shoes4us.com`) tetap di `/register` dan memunculkan alert error.
5. **Sanitasi Open Redirect Eksternal:** Login melalui `/login?redirect=https%3A%2F%2Fevil.example%2Fphish` tidak pernah mengarahkan browser ke domain eksternal dan selalu jatuh aman ke `/` pada origin yang sama.

### Suite 02 — `02-guest-cart-sync.spec.ts` (2 Test Cases)
6. **Sinkronisasi 1 Item Keranjang Tamu ke PostgreSQL:** Tambah sepatu sebagai tamu di `/product/{id}` → pastikan Slide-Over Cart Drawer (`Keranjang Belanja`) muncul → klik `Lihat Keranjang` → klik `Login & Lanjut ke Pengiriman` → login akun baru kosong → reload halaman `/cart` → sepatu tetap ada karena sudah tersimpan di tabel `cart_items` PostgreSQL.
7. **Persistensi & Sinkronisasi Multi-Item Tamu:** Tambah 2 sepatu berbeda sebagai tamu → reload `/cart` saat masih tamu (keduanya bertahan di `localStorage`) → login lewat `/login?redirect=%2Fcart` → reload `/cart` → kedua item tampil dari database akun.

### Suite 03 — `03-complete-checkout-flow.spec.ts` (2 Test Cases)
8. **Checkout Penuh dengan Voucher `DISKON10`:** Login akun baru → tambah sepatu ke keranjang → buka `/cart` → pasang voucher `DISKON10` (verifikasi baris `Diskon (DISKON10)`) → lanjut ke `/payment` (verifikasi `Diskon Voucher (DISKON10)` terbawa) → isi form alamat pengiriman lengkap → klik `Bayar Sekarang` → konfirmasi di modal `Detail Pembayaran` → verifikasi redirect ke `/status-pesanan` dengan `Pesanan #ORD-...` dan status `Pembayaran Berhasil` → verifikasi `/cart` kosong kembali.
9. **Shortcut `BELI SEKARANG`, Validasi Pengiriman & Metode Transfer Bank:** Klik `BELI SEKARANG` di halaman produk → langsung ke `/payment` → klik `Bayar Sekarang` saat alamat kosong memunculkan pesan validasi dan tidak membuka modal → lengkapi alamat & pilih `Transfer Bank` → verifikasi info `Bank BCA (SIMULASI)` di modal → konfirmasi pembayaran → status `Pembayaran Berhasil` tampil di `/status-pesanan`.

### Suite 04 — `04-admin-product-management.spec.ts` (2 Test Cases)
10. **Tambah Produk Baru di Panel Admin → Tampil di Katalog Publik:** Login sebagai Admin (`admin@shoes4us.com`) → verifikasi tautan `Dashboard Admin` → isi form `/admin/product/add` (nama unik, kategori `Running`, brand, harga `Rp 1.450.000`, stok `EU 42 = 5`, deskripsi) → submit `POST /api/products` → verifikasi tampil di `/admin/product` dan langsung ditemukan di pencarian publik `/product?search=...` → otomatis hapus di blok `finally`.
11. **Edit & Hapus Produk via Modal + ConfirmDialog:** Buat produk uji via API → buka `/admin/product` → klik `Edit` pada kartu produk → ubah nama produk di modal `Edit Produk` → verifikasi nama baru langsung muncul di `/admin/product` dan katalog publik → klik ikon hapus (`Hapus produk ...`) → konfirmasi di `alertdialog` (`Ya, Hapus Produk`) → verifikasi produk hilang dari daftar.

### Suite 05 — `05-storefront-and-discovery.spec.ts` (3 Test Cases)
12. **Tabbed Product Showcase & Quick Size Finder di Beranda:** Pindah tab `Sedang Diskon` dan `Exclusive` di `Kurasi Koleksi Pilihan` (`aria-selected="true"`), lalu klik ukuran `EU 42` pada `Cari Langsung Berdasarkan Ukuranmu` dan pastikan browser diarahkan ke `/product?size=42`.
13. **Pencarian Katalog & Pemulihan Empty State:** Membuka `/product?search=Pegasus` menampilkan `Nike Air Pegasus 40`; kata kunci acak menampilkan `Tidak Ada Hasil`; klik `Reset Filter` mengembalikan URL ke `/product` dengan katalog tampil kembali.
14. **Recently Viewed & Privasi Informasi Stok:** Mengunjungi 2 halaman detail produk memastikan tidak ada teks angka stok (`Sisa \d+`) yang ditampilkan ke pembeli, kemudian kembali ke `/` memverifikasi bagian `Terakhir Dilihat` memuat kedua sepatu dan tombol `Hapus Riwayat` membersihkannya.

### Suite 06 — `06-cart-coupon-edge-cases.spec.ts` (3 Test Cases)
15. **Mutasi Kuantitas di Cart Drawer & Penutupan Keyboard `Escape`:** Tambah produk → di dialog `Keranjang Belanja` klik tombol `+` (`Subtotal (2 item)`) → klik tombol `−` (`Subtotal (1 item)`) → tekan `Escape` → drawer tertutup.
16. **Hapus Item + Toast `Urungkan` (Undo) & Konfirmasi Kosongkan Keranjang:** Di `/cart`, hapus item → klik tombol `Urungkan` pada toast untuk memulihkan item → klik `Kosongkan Keranjang` → konfirmasi di `alertdialog` (`Ya, Kosongkan Keranjang`) → keranjang kosong.
17. **Validasi Voucher Gagal & Ganti Jenis Voucher:** Memasukkan `INVALID99` menampilkan pesan error (`tidak valid`) → menerapkan `HEMAT50RB` menampilkan `Diskon (HEMAT50RB)` → menghapusnya dan memasang `GRATISONGKIR` menampilkan `Subsidi Ongkir (GRATISONGKIR)`.

### Suite 07 — `07-wishlist-reviews-profile.spec.ts` (3 Test Cases)
18. **Wishlist End-to-End:** Login pembeli baru → klik tombol `Wishlist` di halaman produk hingga berubah menjadi `Tersimpan` → buka `/wishlist` → reload halaman (item tetap ada di PostgreSQL) → klik `Remove from wishlist` → muncul `Wishlist Masih Kosong`.
19. **Kirim Ulasan Bintang 5 & Persistensi Database:** Login pembeli baru → buka tab `Ulasan` di halaman produk → pilih `5 stars`, isi judul & komentar ≥ 10 karakter → klik `Kirim Review` → reload halaman dan buka ulang tab `Ulasan` → ulasan tetap tampil.
20. **Update Nama Profil Akun:** Login pembeli baru → buka `/profile` → klik `Edit Account` → ubah `Nama Akun` → klik `Simpan Account` → reload halaman `/profile` → nama baru bertahan dari database.

### Suite 08 — `08-admin-orders-and-rbac.spec.ts` (2 Test Cases)
21. **Siklus Pesanan Lintas Peran (Admin → Pembeli + Resi Otomatis):** Pembeli membuat & membayar pesanan via helper API → Admin membuka `/admin/dashboard?tab=orders`, mencari nomor pesanan, lalu mengubah status `PAID` → `SHIPPED` (`PATCH /api/orders/{id}/status`) → pada browser context terpisah, pembeli login dan membuka `/status-pesanan` → memverifikasi status berubah menjadi `Sedang Dikirim` lengkap dengan `No. Resi:` yang di-generate backend.
22. **Penegakan RBAC (API & Rute Frontend):** Akun `USER` biasa yang memanggil `GET /api/users` atau `POST /api/products` wajib menerima HTTP **`403 Forbidden`**, dan saat mengakses `/admin/dashboard` atau `/admin/product` di browser otomatis dialihkan ke `/`.

---

## 6. Alur Otomatisasi di CI/CD (`.github/workflows/ci.yml`)

Setiap `push` atau `pull_request` ke branch `main` mengeksekusi 3 job berurutan/paralel:

```mermaid
flowchart LR
    FECheck["frontend-check (ESLint + 122 Vitest + Build)"]
    BECheck["backend-check (go vet + 62 Go Tests + Build)"]
    E2E["e2e-test (Postgres 16 + Seed + Go API + 22 Playwright E2E)"]

    FECheck --> E2E
    BECheck --> E2E
```

Detail tahapan job **`e2e-test`**:
1. Menyalakan *service container* **`postgres:16-alpine`** yang bersih (`shoes4us_e2e`) dengan healthcheck `pg_isready`.
2. Menjalankan `go run ./cmd/seed` untuk inisialisasi akun, kategori, dan katalog produk.
3. Mengompilasi `./bin/shoes4us-api`, menjalankannya di port `8080`, dan polling `GET /api/health` hingga merespons `200 OK`.
4. Memasang Chromium Playwright (`npx playwright install --with-deps chromium`).
5. Menjalankan seluruh **22 test cases** (`npm run test:e2e`).
6. Jika terjadi kegagalan, folder `frontend/playwright-report/` otomatis diunggah sebagai **GitHub Actions Artifact** (disimpan 7 hari).

---

## 7. Panduan Menjalankan Seluruh Pengujian di Lokal

### A. Menjalankan Backend Unit & Integration Tests
```powershell
cd backend
go vet ./...
go test -v ./...
# Dengan laporan coverage per package:
go test -cover ./...
```

### B. Menjalankan Frontend Unit & Component Tests
```powershell
cd frontend
npm run lint
npm test
# Mode watch saat development:
npm run test:watch
```

### C. Menjalankan Full-Stack Playwright E2E Tests

> **Peringatan Penting:** Selalu arahkan `DATABASE_URL` ke database PostgreSQL **lokal khusus testing** (misalnya `shoes4us_e2e`). **Jangan pernah** menjalankan `seed` atau E2E terhadap database produksi/remote.

#### Terminal 1 — Seed & Nyalakan Go API Lokal
```powershell
cd backend
$env:DATABASE_URL="postgres://postgres:YOUR_PASSWORD@localhost:5432/shoes4us_e2e?sslmode=disable"
$env:APP_ENV="development"
$env:PORT="8080"
$env:JWT_SECRET="shoes4us-local-e2e-secret-key-min-32-chars"
$env:ALLOWED_ORIGINS="http://localhost:3000"

go run ./cmd/seed
go run ./cmd/api
```

#### Terminal 2 — Jalankan Playwright E2E
```powershell
cd frontend

# Instalasi browser Chromium (cukup sekali per mesin):
npx playwright install chromium

# 1. Jalankan seluruh 8 suite (22 test cases):
npm run test:e2e

# 2. Jalankan 1 file suite tertentu:
npx playwright test e2e/03-complete-checkout-flow.spec.ts

# 3. Jalankan 1 test case tertentu berdasarkan nama:
npx playwright test -g "DISKON10"

# 4. Mode visual (browser terlihat) atau UI Inspector interaktif:
npm run test:e2e:headed
npm run test:e2e:ui

# 5. Mode step-by-step debugger:
npx playwright test --debug

# 6. Buka laporan HTML terakhir di browser:
npx playwright show-report
```

---

## 8. Variabel Lingkungan Opsional E2E

| Variabel | Default | Fungsi |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | URL frontend target pengujian |
| `E2E_API_URL` | `http://localhost:8080/api` | URL backend Go REST API target |
| `E2E_SKIP_WEBSERVER` | `""` | Set `"1"` jika frontend dev/preview server sudah dijalankan manual |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@shoes4us.com` / `admin123` | Kredensial akun admin uji |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | `user@shoes4us.com` / `user1234` | Kredensial akun pembeli uji |

---

## 9. Troubleshooting & Panduan Menambah Test Case Baru

### Troubleshooting Umum
- **Error koneksi `ECONNREFUSED localhost:8080`:** Pastikan backend Go API sudah berjalan di port `8080` dan `GET http://localhost:8080/api/health` mengembalikan `{"success":true,...}`.
- **Error `No in-stock seeded product found`:** Database uji belum di-seed atau stok habis; jalankan ulang `go run ./cmd/seed` pada database uji.
- **Port `3000` bentrok:** Hentikan dev server lain di port `3000`, atau set `E2E_SKIP_WEBSERVER=1` jika ingin memakai server yang sudah aktif.
- **Error TypeScript `Cannot find name 'process'` di editor:** `frontend/tsconfig.node.json` sudah memasukkan `playwright.config.ts` dan `e2e/**/*.ts` dengan `"types": ["node"]`. Jika editor belum memperbarui cache, jalankan *TypeScript: Restart TS Server*.

### Konvensi Saat Menambah Test Case E2E Baru
1. Beri nomor urut pada nama file di `frontend/e2e/` (mis. `09-nama-fitur.spec.ts`).
2. Gunakan helper di `e2e/helpers/auth.ts` (`uniqueEmail()`, `registerUserViaAPI()`, `getInStockProduct()`) agar setiap test bersifat mandiri (*isolated*).
3. Prioritaskan locator aksesibilitas (`getByRole`, `getByLabel`, `getByPlaceholder`) dan hindari `page.waitForTimeout(...)`.
4. Bersihkan data katalog yang dibuat di database (seperti produk baru dari Admin) di dalam blok `finally`.
5. Jalankan `npx tsc -b --force`, `npm run lint`, dan `npx playwright test --list` sebelum commit.

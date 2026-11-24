# Shoes4Us End-to-End (E2E) Testing — Playwright

Dokumen ini menjelaskan arsitektur, desain, cakupan skenario, serta cara menjalankan suite **End-to-End (E2E) Automated Testing** yang telah dibangun untuk **Shoes4Us E-Commerce Platform**.

---

## 1. Apa yang Diuji & Posisinya di Piramida Testing

Shoes4Us menerapkan **3 lapis pengujian otomatis** (*Testing Pyramid*):

| Lapisan | Teknologi | Fokus Pengujian | Lokasi |
|---|---|---|---|
| **Unit Testing** | Go `testing`, Vitest | Fungsi mandiri (validasi auth, bcrypt, JWT, konversi ukuran, kupon) | `backend/pkg/`, `frontend/src/utils/` |
| **Integration Testing** | Go `httptest`, React Testing Library | Interaksi antar modul (HTTP router → handler, React Context → UI komponen) dengan *mock/stub* | `backend/internal/handler/`, `frontend/src/pages/__tests__/` |
| **End-to-End (E2E) Testing** | **Playwright (Chromium)** | Simulasi pengguna asli di browser nyata dari **UI React → Go REST API → PostgreSQL nyata** tanpa mock | `frontend/e2e/` |

Berbeda dengan unit/integration test yang memakai data tiruan (*mock*), suite **E2E ini memastikan seluruh sistem benar-benar saling terhubung**: cookie `HttpOnly` & token JWT benar-benar terkirim, keranjang tamu benar-benar tersimpan ke PostgreSQL saat login, potongan voucher `DISKON10` dihitung konsisten oleh backend, stok sepatu benar-benar terpotong secara atomik, dan produk baru dari panel admin langsung muncul di katalog publik.

---

## 2. Arsitektur E2E yang Sudah Dibangun

```mermaid
flowchart LR
    PW["Playwright Test Runner (Chromium 1280x800)"]
    FE["Frontend React SPA (Vite :3000)"]
    API["Go Chi REST API (:8080)"]
    DB[("PostgreSQL 16 (Database Uji Terisolasi)")]
    Seed["Data Seeder (backend/cmd/seed)"]

    Seed -->|"1. Isi Admin, User & 5 Produk"| DB
    PW -->|"2. Klik, Isi Form & Assert UI"| FE
    FE -->|"3. Proxy /api/*"| API
    PW -.->|"Helper Setup & Cleanup API"| API
    API -->|"4. Transaksi SQL Nyata"| DB
```

### Struktur File yang Dibangun

```text
frontend/
├── playwright.config.ts                      # Konfigurasi utama Playwright & auto-start Vite
├── tsconfig.node.json                        # Mencakup tipe Node (@types/node) untuk config & e2e/
└── e2e/
    ├── README.md                             # Dokumentasi ini
    ├── helpers/
    │   └── auth.ts                           # Helper login/register API & UI, uniqueEmail, getInStockProduct
    ├── 01-auth-and-protected-routes.spec.ts  # Skenario autentikasi & proteksi rute (3 test)
    ├── 02-guest-cart-sync.spec.ts            # Skenario sinkronisasi keranjang tamu -> akun (1 test)
    ├── 03-complete-checkout-flow.spec.ts     # Skenario checkout lengkap + voucher DISKON10 (1 test)
    └── 04-admin-product-management.spec.ts   # Skenario tambah produk admin -> katalog publik (1 test)
```

---

## 3. Teknik & Keputusan Desain pada Suite E2E

Agar tes E2E cepat, stabil (*non-flaky*), dan mudah dirawat, beberapa prinsip rekayasa diterapkan di [playwright.config.ts](../playwright.config.ts) dan folder `e2e/`:

1. **Eksekusi Berurutan (`workers: 1`, `fullyParallel: false`):**
   - Karena E2E berinteraksi langsung dengan database PostgreSQL yang sama (stok sepatu, sesi akun admin/user), menjalankan 1 worker berurutan mencegah *race condition* antar skenario tes.
2. **Isolasi Data & Kebersihan Database:**
   - Skenario registrasi, sinkronisasi keranjang, dan checkout selalu membuat akun pembeli baru dengan email unik (`uniqueEmail()`), sehingga setiap tes dimulai dari keranjang yang benar-benar kosong.
   - Skenario pembuatan produk Admin otomatis menghapus produk uji di blok `finally` melalui `DELETE /api/products/{id}` agar katalog uji tetap bersih.
3. **Selector Berbasis Aksesibilitas (*Accessibility-First Locators*):**
   - Tes mencari elemen memakai `getByRole`, `getByLabel`, dan `getByPlaceholder` (bukan CSS class Tailwind yang rapuh). Ini sekaligus memverifikasi bahwa tombol, dialog modal, dan form tetap ramah aksesibilitas.
4. **Diagnostik Kegagalan Otomatis (*Debuggability*):**
   - Jika suatu tes gagal, Playwright otomatis menyimpan **screenshot** (`only-on-failure`), **video rekaman browser** (`retain-on-failure`), dan **Trace Viewer** (`on-first-retry`) sehingga akar masalah langsung terlihat tanpa menebak.
5. **Auto-Start Frontend Server (`webServer`):**
   - Menjalankan `npm run test:e2e` otomatis menyalakan Vite di `http://localhost:3000` (dan memakai ulang server yang sudah jalan di lokal).

---

## 4. Rincian 4 Skenario Kritis (6 Test Cases)

### 1. Autentikasi & Proteksi Rute — `01-auth-and-protected-routes.spec.ts` (3 tests)
- **Registrasi, Persistensi Sesi & Logout:** Mendaftar akun baru di `/register` → verifikasi redirect ke `/` → muat ulang halaman (`page.reload()`) untuk memastikan sesi valid lewat `/api/auth/me` → logout melalui menu profil Navbar → verifikasi menu kembali menampilkan `Login`.
- **Proteksi Rute Terbatas:** Memastikan pengunjung tanpa login yang membuka `/payment` melihat halaman `Butuh Login`, dan yang mencoba membuka `/admin/product/add` langsung dialihkan ke `/`.
- **Login Pembeli Bawaan:** Login menggunakan akun seed (`user@shoes4us.com`) lalu membuka riwayat pesanan `/order`.

### 2. Sinkronisasi Keranjang Tamu ke Akun — `02-guest-cart-sync.spec.ts` (1 test)
- Membuka halaman detail sepatu berstok sebagai **tamu (belum login)** → klik `TAMBAH KE KERANJANG`.
- Memastikan **Slide-Over Cart Drawer** (`Keranjang Belanja`) muncul dengan produk yang dipilih.
- Masuk ke `/cart` → klik `Login & Lanjut ke Pengiriman →` → login memakai akun baru yang keranjangnya kosong.
- Memverifikasi item tamu otomatis tersinkronisasi ke database PostgreSQL dan **tetap tampil setelah `page.reload()`**.

### 3. Alur Checkout & Pembayaran Lengkap — `03-complete-checkout-flow.spec.ts` (1 test)
- Login sebagai pembeli baru → buka detail sepatu → tambah ke keranjang → buka `/cart`.
- Membuka panel voucher, memasukkan **`DISKON10`**, klik `Pakai`, dan memastikan baris `Diskon (DISKON10)` muncul.
- Lanjut ke `/payment`, memverifikasi diskon `DISKON10` terbawa ke *Ringkasan Pesanan*, lalu mengisi alamat pengiriman lengkap.
- Klik `Bayar Sekarang` → memverifikasi modal `Detail Pembayaran` terbuka → klik `Konfirmasi Pembayaran`.
- Memastikan redirect ke `/status-pesanan` dengan nomor pesanan **`Pesanan #ORD-...`**, status **`Pembayaran Berhasil`**, dan keranjang otomatis kosong kembali.

### 4. Manajemen Produk Admin ke Katalog Publik — `04-admin-product-management.spec.ts` (1 test)
- Login sebagai **Admin** (`admin@shoes4us.com`) → memastikan tautan `Dashboard Admin` tampil di Navbar.
- Membuka `/admin/product/add` → mengisi nama produk unik, kategori `Running`, brand, harga `Rp 1.450.000`, stok `EU 42 = 5`, dan deskripsi → klik `Simpan Produk`.
- Memverifikasi redirect ke `/admin/product` dengan produk baru tercantum.
- Membuka katalog publik `/product?search=...` dan memastikan produk baru tersebut langsung dapat dicari oleh pembeli.
- Menghapus produk uji di blok `finally` melalui endpoint admin `DELETE /api/products/{id}`.

---

## 5. Integrasi Otomatis di CI/CD (`.github/workflows/ci.yml`)

Setiap `push` atau `pull_request` ke branch `main` menjalankan job **`e2e-test`** setelah `frontend-check` dan `backend-check` lulus:

1. GitHub Actions menyalakan *service container* **`postgres:16-alpine`** yang bersih dan terisolasi (`shoes4us_e2e`).
2. Menjalankan `go run ./cmd/seed` untuk menyiapkan akun Admin, User, kategori, dan 5 produk berstok.
3. Mengompilasi & menyalakan server Go API (`./bin/shoes4us-api`) lalu menunggu `GET /api/health` merespons `200 OK`.
4. Memasang browser Chromium Playwright (`npx playwright install --with-deps chromium`).
5. Menjalankan seluruh suite `npm run test:e2e`.
6. Jika ada tes yang gagal, laporan HTML (`frontend/playwright-report/`) otomatis diunggah sebagai **GitHub Actions Artifact** selama 7 hari untuk diinspeksi.

---

## 6. Cara Menjalankan di Lokal

> **Penting:** Selalu gunakan database PostgreSQL lokal khusus testing (misalnya `shoes4us_e2e`). **Jangan** arahkan ke database produksi.

### Langkah 1 — Jalankan Seed & Backend Go API (Terminal 1)

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

### Langkah 2 — Jalankan Playwright E2E (Terminal 2)

```powershell
cd frontend

# Sekali saja untuk mengunduh browser Chromium Playwright:
npx playwright install chromium

# Jalankan seluruh 4 suite (6 test cases):
npm run test:e2e

# Jalankan 1 file spesifik:
npx playwright test e2e/03-complete-checkout-flow.spec.ts

# Mode interaktif (Playwright UI Inspector) atau terlihat di layar:
npm run test:e2e:ui
npm run test:e2e:headed

# Buka laporan HTML hasil pengujian terakhir:
npx playwright show-report
```

---

## 7. Variabel Lingkungan Opsional

| Variabel | Default | Fungsi |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | URL frontend target pengujian |
| `E2E_API_URL` | `http://localhost:8080/api` | URL backend Go REST API target |
| `E2E_SKIP_WEBSERVER` | `""` | Set `"1"` jika frontend dev/preview server sudah dijalankan manual |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@shoes4us.com` / `admin123` | Kredensial akun admin uji |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | `user@shoes4us.com` / `user1234` | Kredensial akun pembeli uji |

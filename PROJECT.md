# 👟 Shoes4Us E-Commerce Platform
> Master Specification: Dokumentasi Komprehensif Arsitektur, Fitur, Database, Keamanan, Performa, dan Panduan Pengembangan Sistem Ritel Footwear

[![Go Version](https://img.shields.io/badge/Go-1.24-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![Chi Router](https://img.shields.io/badge/Router-Chi_v5.2-black?style=for-the-badge)](https://github.com/go-chi/chi)
[![React Version](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgx_v5-4169E1?style=for-the-badge&logo=postgresql)](https://github.com/jackc/pgx)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router)](https://reactrouter.com/)

---

## 📋 Daftar Isi
1. [Deskripsi & Profil Proyek](#-1-deskripsi--profil-proyek)
   - [1.1 Gambaran Umum Platform](#11-gambaran-umum-platform)
   - [1.2 Masalah Industri Ritel Footwear yang Diselesaikan](#12-masalah-industri-ritel-footwear-yang-diselesaikan)
   - [1.3 Target Pengguna & Persona](#13-target-pengguna--persona)
   - [1.4 Keunggulan Kompetitif Utama (Unique Selling Points)](#14-keunggulan-kompetitif-utama-unique-selling-points)
2. [Tujuan & Indikator Keberhasilan Rekayasa](#-2-tujuan--indikator-keberhasilan-rekayasa)
3. [Teknologi & Ekosistem (Tech Stack)](#-3-teknologi--ekosistem-tech-stack)
4. [Arsitektur Sistem & Direktori](#-4-arsitektur-sistem--direktori)
   - [4.1 Pola Arsitektur Monorepo Decoupled](#41-pola-arsitektur-monorepo-decoupled)
   - [4.2 Pola Arsitektur Layered Backend Go](#42-pola-arsitektur-layered-backend-go)
   - [4.3 Diagram Alur Permintaan (Request Lifecycle)](#43-diagram-alur-permintaan-request-lifecycle)
   - [4.4 Diagram Arsitektur Frontend & State Flow](#44-diagram-arsitektur-frontend--state-flow)
   - [4.5 Struktur Direktori Monorepo Komprehensif](#45-struktur-direktori-monorepo-komprehensif)
5. [Katalog Fitur Komprehensif (Detailed Feature Modules)](#-5-katalog-fitur-komprehensif-detailed-feature-modules)
   - [5.1 Modul Beranda & Kampanye Visual Editorial](#51-modul-beranda--kampanye-visual-editorial)
   - [5.2 Modul Navigasi Tingkat Lanjut & Mega Menu](#52-modul-navigasi-tingkat-lanjut--mega-menu)
   - [5.3 Modul Showcase Produk Kelas Ritel (Product Cards & Detail)](#53-modul-showcase-produk-kelas-ritel-product-cards--detail)
   - [5.4 Modul Filter Produk Presisi (Sharp Rectangular Sidebar)](#54-modul-filter-produk-presisi-sharp-rectangular-sidebar)
   - [5.5 Modul Keranjang Belanja Cerdas & Guest Cart](#55-modul-keranjang-belanja-cerdas--guest-cart)
   - [5.6 Modul Mesin Promosi Voucher & Kalkulasi Kurir Dinamis](#56-modul-mesin-promosi-voucher--kalkulasi-kurir-dinamis)
   - [5.7 Modul Pembayaran & Transaksi Aman](#57-modul-pembayaran--transaksi-aman)
   - [5.8 Modul Pelacakan Logistik & Nomor Resi Visual](#58-modul-pelacakan-logistik--nomor-resi-visual)
   - [5.9 Modul Pusat Informasi & Layanan Pelanggan (8 Dedicated Pages)](#59-modul-pusat-informasi--layanan-pelanggan-8-dedicated-pages)
   - [5.10 Modul Akun Pengguna, Wishlist & Ulasan Komunitas](#510-modul-akun-pengguna-wishlist--ulasan-komunitas)
   - [5.11 Modul Portal Administrator (Dashboard, Produk & Order)](#511-modul-portal-administrator-dashboard-produk--order)
6. [Skema & Model Basis Data (Database Schema)](#-6-skema--model-basis-data-database-schema)
   - [6.1 Diagram Relasi Entitas (ERD Komprehensif)](#61-diagram-relasi-entitas-erd-komprehensif)
   - [6.2 Rincian Entitas Data & Kamus Data](#62-rincian-entitas-data--kamus-data)
   - [6.3 Indeks Komposit & Optimasi Query Database](#63-indeks-komposit--optimasi-query-database)
7. [Katalog Spesifikasi REST API](#-7-katalog-spesifikasi-rest-api)
8. [Keamanan, Pertahanan & Durability (Platform Hardening)](#-8-keamanan-pertahanan--durability-platform-hardening)
   - [8.1 Tiered In-Memory IP Rate Limiting](#81-tiered-in-memory-ip-rate-limiting)
   - [8.2 HTTP Security Headers & Payload Restriction](#82-http-security-headers--payload-restriction)
   - [8.3 Server Timeout & Pertahanan Serangan Slowloris](#83-server-timeout--pertahanan-serangan-slowloris)
   - [8.4 Autentikasi JWT Stateless & Enkripsi Kata Sandi Bcrypt](#84-autentikasi-jwt-stateless--enkripsi-kata-sandi-bcrypt)
   - [8.5 Proteksi Idempotency Key pada Transaksi Finansial](#85-proteksi-idempotency-key-pada-transaksi-finansial)
   - [8.6 Background Worker Pemulihan Stok Pesanan PENDING](#86-background-worker-pemulihan-stok-pesanan-pending)
   - [8.7 Pencegahan Deadlock & Concurrency Safety](#87-pencegahan-deadlock--concurrency-safety)
9. [Strategi Performa Web & Caching (Performance Engineering)](#-9-strategi-performa-web--caching-performance-engineering)
   - [9.1 Client-Side SWR In-Memory Caching & Request Deduplication](#91-client-side-swr-in-memory-caching--request-deduplication)
   - [9.2 Server-Side In-Memory Category TTL Cache](#92-server-side-in-memory-category-ttl-cache)
   - [9.3 Kompresi Payload Gzip & Cache-Control Aset Statis](#93-kompresi-payload-gzip--cache-control-aset-statis)
   - [9.4 Optimasi Core Web Vitals (LCP Eager Loading & CLS Prevention)](#94-optimasi-core-web-vitals-lcp-eager-loading--cls-prevention)
10. [Observabilitas & Keandalan Operasional (Observability & Monitoring)](#-10-observabilitas--keandalan-operasional-observability--monitoring)
    - [10.1 Structured Logging Berbasis JSON (log/slog)](#101-structured-logging-berbasis-json-logslog)
    - [10.2 Deep Database Health Check Endpoint](#102-deep-database-health-check-endpoint)
11. [Panduan Instalasi, Menjalankan & Pengujian (Developer Guide)](#-11-panduan-instalasi-menjalankan--pengujian-developer-guide)
12. [Roadmap & Rencana Pengembangan Masa Depan](#-12-roadmap--rencana-pengembangan-masa-depan)

---

## 📖 1. Deskripsi & Profil Proyek

### 1.1 Gambaran Umum Platform
**Shoes4Us** adalah platform e-commerce ritel alas kaki (*footwear retail*) generasi baru yang mengombinasikan estetika visual kelas dunia (terinspirasi dari platform ritel global terkemuka seperti New Balance, Planet Sports, dan Foot Locker) dengan performa rekayasa perangkat lunak backend berperforma tinggi. 

Aplikasi ini melayani penjualan produk sepatu olahraga (*running, basketball, training*), sepatu kasual & gaya hidup (*sneakers, lifestyle, formal*), pakaian olahraga (*apparel*), serta aksesoris penunjang gaya hidup aktif. Platform ini dirancang untuk memberikan pengalaman berbelanja yang mulus, tanpa gesekan (*frictionless*), responsif dalam hitungan milidetik, dan memiliki kepastian inventaris fisik secara *real-time*.

### 1.2 Masalah Industri Ritel Footwear yang Diselesaikan
Dalam industri ritel sepatu online, terdapat tantangan-tantangan fundamental yang sering menurunkan tingkat konversi dan kepuasan pelanggan:
1. **Ketidaksesuaian Stok per Ukuran (Size Variant Discrepancy)**: E-commerce umum sering mencatat stok secara global tanpa pemisahan stok fisik per ukuran (EU/US). Hal ini menyebabkan pembeli mengalami kekecewaan saat pesanan dibatalkan sepihak akibat ukuran yang dipilih ternyata habis.
2. **Hambatan Pendaftaran Akun (Registration Friction)**: Banyak calon pembeli membatalkan niat membeli (*cart abandonment*) saat diwajibkan mendaftar akun sebelum dapat memasukkan produk ke keranjang belanja atau mengecek ongkos kirim.
3. **Ketidakpastian Biaya & Pelacakan Pengiriman**: Pelanggan enggan bertransaksi jika opsi kurir tidak transparan, ongkos kirim tidak terhitung otomatis, dan nomor resi pengiriman tidak dapat dilacak secara visual.
4. **Masalah Konkurensi & Tagihan Ganda**: Saat promo diskon atau rilis sepatu edisi terbatas (*hype drops*), ribuan pengguna mengakses produk bersamaan yang memicu *deadlock* basis data, stok minus (*overselling*), atau terpotong saldo ganda akibat klik ganda saat jaringan lambat.

Shoes4Us menyelesaikan masalah-masalah di atas melalui pencatatan inventaris granuler per varian ukuran (`product_sizes`), fitur *Guest Cart* dengan *auto-sync*, kalkulasi ongkos kirim instan, proteksi *Idempotency-Key*, serta transaksi database atomik deterministik.

### 1.3 Target Pengguna & Persona
* **Pelanggan Aktif / Sneakerhead (B2C)**: Penggemar alas kaki yang mengutamakan kurasi orisinalitas produk, kecepatan penemuan sepatu melalui filter ukuran presisi, kemudahan uji voucher diskon, dan transparansi status pesanan.
* **Pembeli Kasual / Hadiah**: Pengunjung yang membutuhkan pengalaman *guest shopping* cepat tanpa hambatan registrasi rumit, didukung panduan ukuran sepatu yang jelas dan kebijakan penukaran barang yang transparan.
* **Administrator & Pengelola Toko**: Tim operasional yang memerlukan dashboard analitik terpadu untuk memantau pendapatan, memperbarui stok varian ukuran secara masif, mengunggah foto studio resolusi tinggi, dan memproses status pengiriman pesanan.

### 1.4 Keunggulan Kompetitif Utama (Unique Selling Points)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        KEUNGGULAN KOMPETITIF SHOES4US                           │
├───────────────────────────────┬─────────────────────────────────────────────────┤
│ Arsitektur Decoupled Modern   │ Backend Go 1.24 + Frontend React 19 Vite SPA    │
│ Zero-Latency Navigation       │ In-Memory SWR Client Caching & Request Coalesce │
│ Retail Studio Edge-to-Edge    │ Foto produk tanpa celah margin & rasio studio   │
│ Granular Multi-Size Inventory │ Stok terisolasi per ukuran sepatu (US 7.5-11/EU)│
│ Concurrency & Deadlock Proof  │ Pengurangan stok atomik berurut deterministik   │
│ Frictionless Guest Shopping   │ Keranjang lokal otomatis tersinkronisasi saat login │
│ Financial Idempotency         │ Proteksi Idempotency-Key anti-tagihan ganda     │
│ Automated Inventory Recovery  │ Worker otomatis pembatalan pesanan kadaluwarsa  │
│ Deep Observability & Health   │ Structured Logging slog & Deep Postgres Ping    │
│ Comprehensive Help Center     │ 8 Halaman resmi info ritel & layanan pelanggan  │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 🎯 2. Tujuan & Indikator Keberhasilan Rekayasa

| Parameter Rekayasa | Target Kuantitatif | Realisasi & Implementasi Sistem |
| :--- | :--- | :--- |
| **Kecepatan Respon API** | p95 < 100 ms | Terpenuhi via `pgxpool`, kompresi Gzip level 5, dan indeks komposit PostgreSQL. |
| **Navigasi Klien (Cache Hit)** | 0 ms (Instant) | Terpenuhi via `getResponseCache` SWR (TTL 30 detik) di [`api.ts`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/services/api.ts). |
| **Stabilitas & Type Safety** | 0 Type Error | Validasi statis tanpa cela (`npx tsc -b` dan `go test ./...` lulus 100%). |
| **Ketahanan Konkurensi** | 0 Overselling / 0 Deadlock | Transaksi atomik terkunci via `UPDATE ... WHERE stock >= $1` berurutan rapi. |
| **Proteksi Serangan DoS** | 100% Request Terkendali | Rate limiter IP (30 req/m auth, 600 req/m API) dan batas payload 2 MB. |
| **Kesiapan Audit Produksi** | Siap Rilis (*Production-Grade*) | Dilengkapi *security headers*, *timeout* anti-Slowloris, dan *error logging* terstruktur. |

---

## 🛠 3. Teknologi & Ekosistem (Tech Stack)

### 3.1 Backend Stack (Go 1.24 Ecosystem)
* **Runtime**: Go (Golang) versi `1.24.0` — Menawarkan performa eksekusi mendekati C, konsumsi memori rendah, serta model konkurensi goroutine yang efisien.
* **HTTP Router**: `github.com/go-chi/chi/v5` (v5.2.3) — Router HTTP berbasis *radix tree* yang ringan, cepat, dan 100% kompatibel dengan standar `net/http`.
* **Database Driver & Pool**: `github.com/jackc/pgx/v5` (v5.8.0) — Driver PostgreSQL murni tercepat untuk Go dengan dukungan pool koneksi tingkat lanjut (`pgxpool`).
* **Autentikasi & Keamanan**:
  - `github.com/golang-jwt/jwt/v5` (v5.3.0): Penandatanganan dan verifikasi token akses JSON Web Token (*HMAC-SHA256*).
  - `golang.org/x/crypto/bcrypt`: Algoritma *hashing* adaptif satu arah untuk mengamankan kata sandi pengguna.
* **Cloud & Storage Integration**:
  - `github.com/aws/aws-sdk-go-v2`: SDK penyimpanan kompatibel S3 (AWS S3, Cloudflare R2, MinIO, Supabase Storage).
* **Logging & Observabilitas**:
  - `log/slog` bawaan Go standard library: Engine pencatatan log terstruktur berbasis JSON berkecepatan tinggi.

### 3.2 Frontend Stack (React 19 + Vite 6 + Tailwind 3.4)
* **UI Library**: React 19 (`react@^19.0.0`, `react-dom@^19.0.0`) — Memanfaatkan fitur rendering modern, manajemen state reaktif, dan performa tinggi.
* **Build Tool & Dev Server**: Vite 6 (`vite@^6.1.1`) — Hot Module Replacement (HMR) dalam hitungan milidetik dan bundler berbasis Rollup/esbuild.
* **Bahasa**: TypeScript 5.7 (`typescript@~5.7.2`) — Pengetikan statis ketat untuk seluruh entitas DTO, respons API, dan antarmuka komponen.
* **Routing**: React Router DOM v7 (`react-router-dom@^7.1.5`) — Client-side SPA routing dengan pemisahan kode dinamis (`React.lazy`).
* **Styling & Design System**: Tailwind CSS 3.4 (`tailwindcss@^3.4.17`) — Sistem utility-first CSS bertema ritel modern (*sharp rectangular design*).
* **Ikonografi & Notifikasi**:
  - `lucide-react@^0.546.0`: Set ikon vektor SVG modern yang konsisten.
  - `react-hot-toast@^2.6.0`: Sistem notifikasi pop-up toast non-intrusif yang elegan.

---

## 🏛 4. Arsitektur Sistem & Direktori

### 4.1 Pola Arsitektur Monorepo Decoupled
Shoes4Us menggunakan arsitektur **Decoupled Monorepo**. Kode frontend dan backend berada dalam satu repositori kerja namun memiliki siklus hidup *build*, dependensi, dan *testing* yang terisolasi secara mandiri. Frontend berkomunikasi dengan backend murni melalui protokol REST API dengan payload berformat JSON.

### 4.2 Pola Arsitektur Layered Backend Go
Backend dibangun dengan pola **Clean Layered Architecture** yang memisahkan tanggung jawab menjadi lima lapisan independen:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HTTP REQUEST DARI CLIENT                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. ROUTER & MIDDLEWARE LAYER (internal/handler/router.go, middleware/) │
│    - Correlation ID (X-Request-Id) & Real-IP Header                    │
│    - Tiered IP Rate Limiter & Security Headers (CSP, HSTS, Sniff)      │
│    - Structured JSON Request Logging (slog) & Compression (Gzip)       │
│    - MaxBodySize (2MB) & HTTP Server Timeouts (Anti-Slowloris)         │
│    - CORS Handler & JWT Auth/Admin Guard                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. HANDLER LAYER (internal/handler/)                                   │
│    - Parsing & validasi format JSON request                            │
│    - Ekstraksi claims kredensial pengguna terotentikasi                │
│    - Pengelolaan Idempotency-Key pada request transaksi                │
│    - Pengemasan respons standar: Envelope { success, message, data }   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER (internal/service/)                                   │
│    - Logika bisnis utama & kalkulasi harga                             │
│    - Validasi mesin diskon kupon / voucher promosi                     │
│    - Validasi mesin status pesanan (Finite State Machine Transitions)  │
│    - In-Memory Cache manajemen kategori dengan TTL 60 detik            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. REPOSITORY LAYER (internal/repository/)                             │
│    - Eksekusi query SQL dengan Parameterized Placeholders ($1..$N)     │
│    - Pengelolaan transaksi atomik terisolasi (pgx.Tx)                  │
│    - Sorting deterministik item pesanan sebelum pemotongan stok        │
│    - Optimasi agregasi rating via LEFT JOIN LATERAL                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. DATABASE LAYER (internal/database/)                                 │
│    - Pool koneksi terkelola pgxpool (MaxConns: 10, MinConns: 1)        │
│    - Auto-ensure DDL schema eksekusi saat server boot                  │
│    - 6 Indeks komposit performa tinggi                                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Diagram Alur Permintaan (Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Peramban Klien (React SPA)
    participant Sec as Security & Rate Limiting Middleware
    participant Auth as Auth & Admin Guard Middleware
    participant Handler as Chi Controller Handler
    participant Svc as Domain Service (Business Logic)
    participant Repo as Postgres Repository
    participant DB as PostgreSQL Database

    Client->>Sec: HTTP Request (URL, Headers, Body)
    alt Request Melebihi Kuota Rate Limit
        Sec-->>Client: 429 Too Many Requests (Header: Retry-After)
    else Dalam Batas Aman
        Sec->>Auth: Teruskan Request
        alt Endpoint Memerlukan Auth & Token Tidak Ada/Expired
            Auth-->>Client: 401 Unauthorized / 403 Forbidden
        else Akses Valid
            Auth->>Handler: Context dengan UserClaims
            alt Request Membawa Idempotency-Key & Sudah Diproses
                Handler-->>Client: 200/201 Hasil Replay Tersimpan (X-Idempotent-Replay: true)
            else Request Baru
                Handler->>Svc: Panggil Method Service Terkait
                alt Cache Valid Tersedia (In-Memory SWR / TTL)
                    Svc-->>Handler: Return Data Cache Seketika
                else Cache Miss / Mutasi Data
                    Svc->>Repo: Eksekusi Transaksi / Query
                    Repo->>DB: SQL Query dengan Parameter Sanitized ($1, $2)
                    DB-->>Repo: Hasil Rowset / Mutasi Sukses
                    Repo-->>Svc: Domain Struct Entity
                    Svc-->>Handler: Service Result
                end
                Handler-->>Client: 200/201 JSON Response (Gzip Compressed)
            end
        end
    end
```

### 4.4 Diagram Arsitektur Frontend & State Flow

```mermaid
graph TD
    User([Pelanggan / Pengunjung]) --> App[App.tsx - React Router v7 SPA]
    
    App --> RouteLazy{Rute Lazy Loaded}
    RouteLazy --> Home[HomePage.tsx]
    RouteLazy --> Catalog[ProductListPage.tsx]
    RouteLazy --> Detail[ProductDetailPage.tsx]
    RouteLazy --> Cart[CartPage.tsx]
    RouteLazy --> Payment[PaymentPage.tsx]
    RouteLazy --> Tracking[OrderStatusPage.tsx]
    RouteLazy --> Info[InfoPages.tsx - 8 Halaman Layanan]
    RouteLazy --> Admin[AdminDashboard.tsx]

    Home --> Banner[HeroCarousel - LCP High Priority]
    Home --> Campaign[ShopByCategory - Editorial 3:4 Cards]
    Catalog --> FilterBar[ProductFilters - Sharp Rectangular & URL Params]
    Catalog --> Cards[ProductCard - Edge-to-Edge Studio Photos]

    subgraph Client State & Caching
        AuthCtx[AuthContext - Token & User State]
        CartCtx[CartContext - Guest Cart & Sync Logic]
        WishlistCtx[WishlistContext - Favorit Produk]
        APICache[api.ts SWR Cache - 30s TTL & In-Flight Dedup]
    end

    CartPage --> CartCtx
    PaymentPage --> CartCtx
    Catalog --> APICache
    Detail --> APICache
    Cards --> WishlistCtx

    APICache <-->|JSON over HTTP /api| GoAPI[(Backend REST API Go :8080)]
```

### 4.5 Struktur Direktori Monorepo Komprehensif

```text
Shoes4Us E-Commerce Platform/
├── backend/                             # Direktori Layanan Backend Go
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go                  # Bootstrap server HTTP, timeouts, pool, & workers
│   │   └── seed/
│   │       └── main.go                  # Database Seeder (katalog sepatu, kategori & admin)
│   ├── internal/
│   │   ├── config/                      # Pengurai environment variables (.env)
│   │   ├── database/                    # Koneksi pgxpool, DDL schema, & indeks komposit
│   │   │   ├── postgres.go
│   │   │   └── schema.go
│   │   ├── domain/                      # Entitas model, tipe enum, & custom error definition
│   │   │   ├── auth.go
│   │   │   ├── cart.go
│   │   │   ├── category.go
│   │   │   ├── coupon.go
│   │   │   ├── errors.go
│   │   │   ├── order.go
│   │   │   ├── product.go
│   │   │   ├── review.go
│   │   │   ├── shipping.go
│   │   │   ├── user.go
│   │   │   └── wishlist.go
│   │   ├── handler/                     # HTTP Handlers (Controller REST API)
│   │   │   ├── auth_handler.go
│   │   │   ├── cart_handler.go
│   │   │   ├── coupon_handler.go
│   │   │   ├── order_handler.go
│   │   │   ├── product_handler.go
│   │   │   ├── review_handler.go
│   │   │   ├── router.go                # Konstruksi Chi router & middleware bindings
│   │   │   ├── shipping_handler.go
│   │   │   ├── user_handler.go
│   │   │   └── wishlist_handler.go
│   │   ├── middleware/                  # Middleware Keamanan, Logging, & Rate Limiting
│   │   │   ├── auth_middleware.go       # JWT Bearer & Cookie validator
│   │   │   ├── cors_middleware.go       # Pengaturan CORS origin ketat
│   │   │   ├── logger_middleware.go     # Structured logging slog berbasis request_id
│   │   │   ├── rate_limit_middleware.go # In-memory IP rate limiter bertingkat
│   │   │   └── security_middleware.go   # Security headers & MaxBodySize 2MB
│   │   ├── repository/                  # Database Access Layer (SQL terparameterisasi)
│   │   │   ├── cart_repository.go
│   │   │   ├── category_repository.go
│   │   │   ├── order_repository.go      # Transaksi atomik & worker auto-expire
│   │   │   ├── product_repository.go    # Query filter produk & LATERAL aggregation
│   │   │   ├── review_repository.go
│   │   │   ├── user_repository.go
│   │   │   └── wishlist_repository.go
│   │   └── service/                     # Lapisan Logika Bisnis
│   │       ├── auth_service.go
│   │       ├── cart_service.go
│   │       ├── coupon_service.go        # Validasi kupon & kalkulasi diskon
│   │       ├── order_service.go         # Alur checkout & FSM status transitions
│   │       ├── payment_service.go       # Konfirmasi pembayaran
│   │       ├── product_service.go       # Layanan katalog & in-memory category cache
│   │       ├── review_service.go
│   │       ├── user_service.go
│   │       └── wishlist_service.go
│   ├── pkg/                             # Paket utilitas mandiri
│   │   ├── hash/                        # Helper hashing Bcrypt
│   │   ├── response/                    # Pembentuk payload JSON envelope seragam
│   │   ├── storage/                     # Driver upload file lokal & S3 storage
│   │   └── token/                       # Helper token JWT
│   ├── uploads/                         # Direktori penyimpanan gambar statis lokal
│   ├── go.mod                           # Modul Go & dependensi
│   ├── go.sum                           # Checksum integritas paket
│   └── README.md
├── frontend/                            # Aplikasi Web SPA React
│   ├── public/                          # Aset statis publik, logo, foto kampanye ritel
│   │   ├── shop-mens.jpg                # Foto editorial potret kampanye Men's (3:4)
│   │   ├── shop-womens.jpg              # Foto editorial potret kampanye Women's (3:4)
│   │   ├── shop-kids.jpg                # Foto editorial potret kampanye Kids' (3:4)
│   │   ├── logo.jpg
│   │   └── ...                          # Foto studio produk sepatu
│   ├── src/
│   │   ├── components/                  # Komponen antarmuka pengguna
│   │   │   ├── empty-states/            # Komponen visual saat data kosong
│   │   │   ├── skeletons/               # Skeleton placeholder saat data loading
│   │   │   ├── CategoryShowcase.tsx     # Grid showcase kategori
│   │   │   ├── FeaturedProducts.tsx     # Produk pilihan beranda
│   │   │   ├── Footer.tsx               # Footer terhubung ke 8 halaman info ritel
│   │   │   ├── GlobalSearch.tsx         # Modal pencarian produk instan
│   │   │   ├── HeroCarousel.tsx         # Slider banner beranda (LCP eager loaded)
│   │   │   ├── Navbar.tsx               # Navigasi utama dengan mega menu interaktif
│   │   │   ├── OrderTracking.tsx        # Timeline pelacakan visual status & resi
│   │   │   ├── ProductCard.tsx          # Kartu ritel edge-to-edge New Balance style
│   │   │   ├── ProductFilters.tsx       # Sidebar filter kotak bersudut tegas
│   │   │   ├── RelatedProducts.tsx      # Rekomendasi produk terkait
│   │   │   ├── ShopByCategory.tsx       # Kampanye potret editorial beranda
│   │   │   └── WishlistButton.tsx       # Tombol favorit interaktif
│   │   ├── constants/
│   │   │   └── navigation.ts            # Definisi struktur tautan mega menu
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          # Pengelola sesi otentikasi pengguna
│   │   │   ├── CartContext.tsx          # Pengelola keranjang belanja & guest sync
│   │   │   └── WishlistContext.tsx      # Pengelola daftar produk favorit
│   │   ├── pages/                       # Halaman tampilan aplikasi
│   │   │   ├── AdminDashboard.tsx       # Portal kendali admin toko
│   │   │   ├── CartPage.tsx             # Halaman keranjang & kalkulasi voucher
│   │   │   ├── HomePage.tsx             # Halaman utama platform
│   │   │   ├── InfoPages.tsx            # 8 Halaman Informasi Resmi & Layanan Pelanggan
│   │   │   ├── LoginPage.tsx            # Halaman masuk
│   │   │   ├── OrderHistoryPage.tsx     # Riwayat pesanan pelanggan
│   │   │   ├── OrderStatusPage.tsx      # Pelacakan status pesanan publik
│   │   │   ├── PaymentPage.tsx          # Checkout, kurir & konfirmasi pembayaran
│   │   │   ├── ProductDetailPage.tsx    # Halaman detail sepatu kelas ritel
│   │   │   ├── ProductListPage.tsx      # Katalog produk dengan filter URL
│   │   │   └── RegisterPage.tsx         # Halaman pendaftaran
│   │   ├── services/
│   │   │   └── api.ts                   # Klien API dengan cache in-memory SWR
│   │   ├── types/
│   │   │   └── index.ts                 # Definisi type & interface TypeScript
│   │   ├── App.tsx                      # Pendaftaran rute & pemisahan kode dinamis
│   │   ├── main.tsx                     # Entry point React Vite
│   │   └── index.css                    # Pengaturan Tailwind CSS global
│   ├── package.json
│   ├── vite.config.ts                   # Konfigurasi Vite & proxy backend :8080
│   └── tailwind.config.ts               # Desain token & tema Tailwind
├── package.json                         # Script orkestrator Monorepo root
├── README.md                            # Panduan ringkas proyek
└── PROJECT.md                           # Dokumentasi spesifikasi komprehensif master
```

---

## 🚀 5. Katalog Fitur Komprehensif (Detailed Feature Modules)

### 5.1 Modul Beranda & Kampanye Visual Editorial
* **Banner Hero Carousel Teroptimasi ([`HeroCarousel.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/HeroCarousel.tsx))**:
  - Slider hero dengan transisi halus otomatis (interval 5 detik).
  - Optimasi *Core Web Vitals*: Slide pertama dilengkapi atribut `fetchPriority="high"` dan `loading="eager"` untuk meminimalkan skor LCP, sedangkan slide berikutnya dimuat secara malas (*lazy*).
* **Kampanye Editorial Potret Beranda ([`ShopByCategory.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ShopByCategory.tsx))**:
  - Tiga kartu potret bersudut tegas rasio 3:4 dengan tema fotografi *streetwear rooftop golden-hour*:
    - **SHOP MEN'S** (`/product?audience=MEN`): Pilihan langsung *Men's Footwear*, *Men's Clothing*, dan *Men's Accessories*.
    - **SHOP WOMEN'S** (`/product?audience=WOMEN`): Pilihan langsung *Women's Footwear*, *Women's Clothing*, dan *Women's Accessories*.
    - **SHOP KIDS'** (`/product?audience=KIDS`): Pilihan langsung *Kids' Footwear*, *Kids' Clothing*, dan *Kids' Accessories*.
* **Grid Produk Pilihan Beranda ([`FeaturedProducts.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/FeaturedProducts.tsx))**:
  - Memuat 8 produk pilihan teratas dengan tampilan kartu ritel modern dan skeleton placeholder.

### 5.2 Modul Navigasi Tingkat Lanjut & Mega Menu
* **Desktop Mega Menu Komprehensif ([`Navbar.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/Navbar.tsx), [`navigation.ts`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/constants/navigation.ts))**:
  - Navigasi dropdown masif dengan 4 kolom tautan terstruktur per kategori: *New Arrivals*, *Eksklusif*, *Pria*, *Wanita*, *Anak-Anak*, *Coming Soon*, *Brands*, dan *Sale* (dengan aksen merah).
* **Pencarian Global Instan ([`GlobalSearch.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/GlobalSearch.tsx))**:
  - Pencarian interaktif dengan *debounce*, menavigasi langsung ke katalog dengan filter pencarian aktif.

### 5.3 Modul Showcase Produk Kelas Ritel (Product Cards & Detail)
* **Studio Edge-to-Edge Product Card ([`ProductCard.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ProductCard.tsx))**:
  - Foto produk memenuhi kartu tanpa batas celah (*zero padding*), rasio persegi studio, ikon wishlist di pojok kanan atas, nama merek kapital (*uppercase*), lini audiens & warna, harga diskon merah + harga coret + badge *20% OFF*, serta visualisasi bintang rating ulasan.
* **Halaman Detail Sepatu Kelas Ritel ([`ProductDetailPage.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/ProductDetailPage.tsx))**:
  - Breadcrumb navigasi bergaris miring, galeri *thumbnail* vertikal di sisi kiri, foto utama dengan badge *EXCLUSIVE* / *BEST SELLER*, kode SKU produk, pemilihan ukuran US (`US 7.5` – `US 11`) dengan pengecekan stok otomatis, link modal *Panduan Ukuran*, tombol beli bertumpuk (*BELI SEKARANG* & *TAMBAH KE KERANJANG*), serta modal interaktif *Periksa ketersediaan di toko*.

### 5.4 Modul Filter Produk Presisi (Sharp Rectangular Sidebar)
* **Sidebar Filter Kotak Ritel ([`ProductFilters.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ProductFilters.tsx))**:
  - Mengusung estetika kotak tegas bersudut tajam (*sharp rectangular*, `border-slate-300`, aktif `bg-slate-900 text-white`):
    1. **Urutkan Berdasarkan**: Pilihan Terbaru, Harga Rendah-Tinggi, Harga Tinggi-Rendah, dan Nama A-Z.
    2. **Ukuran Sepatu (EU)**: Matriks 10 tombol ukuran (36 – 45).
    3. **Brand**: Kotak centang merek populer (Nike, Adidas, New Balance, Puma, Jordan, Vans, Converse, Asics).
    4. **Gender / Audiens**: Kotak pilihan Pria, Wanita, Unisex, dan Anak (otomatis menyertakan produk Unisex saat memilih Pria/Wanita).
    5. **Kategori Sepatu**: Kotak pilihan Semua, Basketball, Lifestyle, Running, Sneakers, Training.
    6. **Koleksi & Status**: *Switch* persegi stok tersedia, tombol Sedang Diskon, Rilisan Baru, dan Exclusive.
    7. **Rentang Harga**: Preset kotak cepat (`< 1 Jt`, `1 - 2 Jt`, `> 2 Jt`) dan input nominal angka dengan *debounce* aman.
  - **Sinkronisasi URL Penuh**: Setiap pilihan filter tercermin pada query URL (`useSearchParams`), mendukung navigasi *back/forward*, *bookmarking*, dan pembatalan instan per *chip tag*.

### 5.5 Modul Keranjang Belanja Cerdas & Guest Cart
* **Guest Cart Tanpa Login**: Pengunjung dapat langsung memasukkan sepatu ke keranjang sebelum mendaftar akun (`localStorage` key: `shoes4us_guest_cart_v1`).
* **Auto-Sync Transaksional saat Login / Register**: Saat pengguna masuk atau mendaftar di halaman `/login` atau `/register`, seluruh item dari keranjang tamu otomatis dikirim ke endpoint `/api/cart` backend dan disatukan tanpa ada barang yang hilang.
* **Smart Cart Page ([`CartPage.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/CartPage.tsx))**: Menghitung subtotal otomatis, mengubah kuantitas dengan validasi stok fisik, serta memungkinkan uji coba kode promo langsung di keranjang.

### 5.6 Modul Mesin Promosi Voucher & Kalkulasi Kurir Dinamis
* **Voucher Discount Engine ([`coupon_service.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/service/coupon_service.go))**:
  - `DISKON10`: Potongan harga 10% dari subtotal belanja.
  - `HEMAT50RB`: Potongan nominal langsung Rp 50.000.
  - `GRATISONGKIR`: Potongan 100% pada ongkos kirim kurir yang dipilih.
* **Seleksi Kurir Pengiriman Real-Time ([`shipping_handler.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/handler/shipping_handler.go))**:
  - Pilihan kurir: **JNE Reguler** (2-3 hari, Rp 18.000), **SiCepat REG** (2-3 hari, Rp 16.000), **J&T Express** (1-2 hari, Rp 20.000), dan **JNE YES** (1 hari, Rp 32.000). Biaya pengiriman dan total pesanan diperbarui seketika.

### 5.7 Modul Pembayaran & Transaksi Aman
* **Payment Page ([`PaymentPage.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/PaymentPage.tsx))**:
  - Formulir rincian pengiriman lengkap (Nama, Alamat, Kota, Kode Pos, Nomor Telepon).
  - Pilihan metode pembayaran: QRIS (GoPay, OVO, Dana, ShopeePay), Transfer Virtual Account (BCA, Mandiri, BNI, BRI), dan Kartu Kredit/Debit.
  - Tampilan simulasi barcode QRIS interaktif atau instruksi nomor rekening pembayaran.

### 5.8 Modul Pelacakan Logistik & Nomor Resi Visual
* **Timeline Status Visual ([`OrderTracking.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/OrderTracking.tsx))**:
  - Visualisasi tahapan pesanan: *Menunggu Pembayaran* → *Diproses Gudang* → *Dalam Pengiriman* → *Pesanan Selesai*.
  - Menampilkan nama kurir logistik dan **Nomor Resi Resmi** (contoh: `JNE-ORD202611`, `SCP-ORD8829`) yang dapat disalin dengan satu klik (*Copy to Clipboard*).

### 5.9 Modul Pusat Informasi & Layanan Pelanggan (8 Dedicated Pages)
* **Pusat Bantuan Terpadu ([`InfoPages.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/InfoPages.tsx))**:
  - Dilengkapi *sidebar* navigasi kotak terpadu sehingga pengguna dapat berpindah halaman dengan mudah:
    1. `/tentang-kami`: Profil resmi perusahaan ritel Shoes4Us Indonesia, nilai keaslian produk, dan statistik pencapaian.
    2. `/tentang-shoes4us`: Standar kurasi 5 tahap verifikasi keaslian (*100% Original Guarantee*).
    3. `/syarat-dan-ketentuan`: Ketentuan layanan transaksi, pembayaran, dan pengiriman.
    4. `/kebijakan-privasi`: Kebijakan perlindungan data pelanggan dan keamanan transaksi.
    5. `/faq`: Tanya jawab interaktif (*accordion*) seputar pemesanan, pengiriman, dan panduan ukuran.
    6. `/kebijakan-pengembalian`: Panduan 4 tahap penukaran ukuran dan garansi retur 14 hari.
    7. `/kontak-kami`: Formulir kirim pesan pelanggan interaktif, kontak WhatsApp/Email, dan daftar 3 *Flagship Store* fisik.
    8. `/peta-situs`: Direktori tautan lengkap seluruh halaman belanja, akun, dan layanan pelanggan.

### 5.10 Modul Akun Pengguna, Wishlist & Ulasan Komunitas
* **Manajemen Akun & Autentikasi**:
  - Registrasi akun baru dengan validasi keamanan dan pengukur kekuatan kata sandi.
  - Login dengan email & kata sandi, serta pemulihan kata sandi via email transaksional.
  - Pengaturan profil: ubah nama, nomor telepon, alamat default, dan kata sandi baru.
* **Wishlist Mandiri**:
  - Menandai produk favorit dengan satu klik yang otomatis disinkronkan ke basis data pengguna terotentikasi.
* **Sistem Ulasan & Rating Komunitas**:
  - Ulasan teks dan penilaian bintang (1-5) dari pembeli untuk setiap produk sepatu yang telah dicoba.

### 5.11 Modul Portal Administrator (Dashboard, Produk & Order)
* **Dashboard Metrik & Analitik**: Ringkasan omzet penjualan, total pesanan berhasil, jumlah produk aktif, dan grafik status transaksi.
* **Manajemen Produk Penuh (CRUD)**:
  - Tambah produk baru dengan penetapan varian ukuran multi-dimensi (Size 36 – 45).
  - Pengaturan alokasi stok fisik per ukuran.
  - Penandaan label promosi (*New Arrival*, *Exclusive*, *Coming Soon*, *On Sale*).
  - Pengunggahan gambar produk ke media storage lokal atau cloud S3.
* **Manajemen Status Pesanan Pelanggan**:
  - Memantau seluruh pesanan pelanggan.
  - Memperbarui status pesanan (*Processing*, *Shipped*, *Delivered*, *Cancelled*) sesuai dengan FSM (*Finite State Machine*) yang secara otomatis memicu pembuatan nomor resi pengiriman logistik.

---

## 🗄 6. Skema & Model Basis Data (Database Schema)

### 6.1 Diagram Relasi Entitas (ERD Komprehensif)

```mermaid
erDiagram
    users ||--o| carts : "memiliki"
    users ||--o{ orders : "membuat"
    users ||--o{ wishlists : "menyimpan"
    users ||--o{ reviews : "menulis"
    users ||--o{ password_reset_tokens : "meminta"

    categories ||--o{ products : "mengkategorikan"

    products ||--o{ product_sizes : "memiliki varian ukuran"
    products ||--o{ cart_items : "disimpan di"
    products ||--o{ order_items : "dipesan di"
    products ||--o{ wishlists : "disimpan oleh"
    products ||--o{ reviews : "diulas dalam"

    carts ||--o{ cart_items : "memuat item"
    orders ||--o{ order_items : "terdiri atas"

    users {
        TEXT id PK
        TEXT email UK
        TEXT password
        TEXT name
        TEXT role "USER | ADMIN"
        BOOLEAN isActive
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    products {
        TEXT id PK
        TEXT name
        TEXT slug UK
        TEXT description
        DECIMAL price
        INTEGER stock
        TEXT imageUrl
        TEXT categoryId FK
        TEXT brand
        ProductSegment segment "SHOES | APPAREL | ACCESSORIES"
        ProductAudience audience "UNISEX | MEN | WOMEN | KIDS"
        BOOLEAN isNewArrival
        BOOLEAN isExclusive
        BOOLEAN isComingSoon
        BOOLEAN isSale
        BOOLEAN isActive
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    product_sizes {
        TEXT id PK
        TEXT productId FK
        TEXT size
        INTEGER stock
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    categories {
        TEXT id PK
        TEXT name UK
        TEXT slug UK
        BOOLEAN isActive
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    carts {
        TEXT id PK
        TEXT userId FK
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    cart_items {
        TEXT id PK
        TEXT cartId FK
        TEXT productId FK
        INTEGER quantity
        DECIMAL priceSnap
        TEXT size
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    orders {
        TEXT id PK
        TEXT orderNumber UK
        TEXT userId FK
        OrderStatus status
        DOUBLE totalAmount
        TEXT shippingAddress
        TEXT shippingCity
        TEXT shippingPostalCode
        TEXT shippingPhone
        TEXT shippingCourier
        DOUBLE shippingCost
        TEXT couponCode
        DOUBLE discountAmount
        TEXT trackingNumber
        TEXT paymentMethod
        TEXT paymentUrl
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    order_items {
        TEXT id PK
        TEXT orderId FK
        TEXT productId FK
        INTEGER quantity
        DOUBLE price
        TEXT size
    }

    wishlists {
        TEXT id PK
        TEXT userId FK
        TEXT productId FK
        TIMESTAMP createdAt
    }

    reviews {
        TEXT id PK
        TEXT productId FK
        TEXT userId FK
        INTEGER rating
        TEXT title
        TEXT comment
        BOOLEAN verified
        INTEGER helpful
        TIMESTAMP createdAt
        TIMESTAMP updatedAt
    }

    password_reset_tokens {
        TEXT id PK
        TEXT token UK
        TEXT userId FK
        TIMESTAMP expiresAt
        TIMESTAMP createdAt
    }
```

### 6.2 Rincian Entitas Data & Kamus Data
1. **`users`**: Menyimpan kredensial identitas akun pengguna, peran (*Role-Based Access Control* `USER` atau `ADMIN`), status aktif, serta stempel waktu pembuatan akun.
2. **`categories`**: Menyimpan pengelompokan produk master (seperti *Sneakers*, *Running*, *Basketball*, *Lifestyle*, *Training*) dengan penamaan slug ramah SEO.
3. **`products`**: Menyimpan master data katalog sepatu dan apparel: nama, deskripsi, harga eceran, total akumulasi stok fisik, brand/merek, segmen, audiens, serta status promosi (*New Arrival, Exclusive, Coming Soon, Sale*).
4. **`product_sizes`**: Menyimpan inventaris varian ukuran spesifik (misal: Size 38 stok 4, Size 42 stok 10) dengan constraint unik gabungan `(productId, size)` guna mencegah duplikasi varian ukuran pada produk yang sama.
5. **`carts` & `cart_items`**: Menyimpan item keranjang belanja aktif pengguna dengan snapshot harga saat ditambahkan (`priceSnap`), kuantitas, dan ukuran yang dipilih.
6. **`orders` & `order_items`**: Menyimpan transaksi pesanan permanen yang mencatat nomor order unik, status transaksi (*Pending, Processing, Shipped, Delivered, Cancelled*), total biaya, kurir terpilih, ongkos kirim, diskon voucher, nomor resi pengiriman, serta metode pembayaran.
7. **`wishlists`**: Menyimpan penanda produk favorit pelanggan dengan constraint unik `(userId, productId)`.
8. **`reviews`**: Menyimpan ulasan komunitas dan penilaian bintang (1-5) yang terhubung ke produk dan pelanggan terverifikasi.
9. **`password_reset_tokens`**: Menyimpan token kriptografis berbatas waktu (*expiry token*) untuk alur pemulihan kata sandi mandiri.

### 6.3 Indeks Komposit & Optimasi Query Database
Untuk menjamin kecepatan pencarian dan pengurutan katalog saat jutaan baris data tersimpan, skema database dilengkapi 6 indeks komposit PostgreSQL ([`schema.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/database/schema.go#L156-L161)):
1. `idx_products_active_created`: Mempercepat query katalog aktif berurutan waktu (`products ("isActive", "createdAt" DESC)`).
2. `idx_products_category`: Mempercepat pemfilteran berdasarkan kategori sepatu (`products ("categoryId")`).
3. `idx_products_segment_audience`: Mempercepat filter multi-dimensi segmen & gender (`products ("segment", "audience")`).
4. `idx_products_price`: Mempercepat sorting dan pemfilteran rentang harga (`products ("price")`).
5. `idx_products_brand_lower`: Mempercepat pencarian merek tanpa membedakan huruf besar/kecil (`products (LOWER("brand"))`).
6. `idx_reviews_product_id`: Menjamin agregasi rating ulasan produk secepat kilat (`reviews ("productId")`).

---

## 📡 7. Katalog Spesifikasi REST API

Seluruh endpoint berbasis JSON dan mengembalikan amplop data terstandarisasi:
```json
{
  "success": true,
  "message": "Pesan deskriptif keberhasilan operasi",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

| Kelompok | Method | Endpoint | Akses | Deskripsi & Proteksi Keamanan |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Publik | Health check status service & ping koneksi database PostgreSQL aktif |
| **Shipping** | `GET` | `/api/shipping/couriers` | Publik | Daftar kurir ekspedisi aktif (HTTP Cache 5 menit) |
| **Coupons** | `GET` | `/api/coupons` | Publik | Daftar kupon promosi aktif |
| | `POST` | `/api/coupons/validate` | Publik | Validasi voucher & kalkulasi nilai potongan diskon |
| **Auth** | `POST` | `/api/auth/register` | Publik | Registrasi akun baru (Strict Rate Limit: 30 req/m) |
| | `POST` | `/api/auth/login` | Publik | Login & penerbitan token JWT (Strict Rate Limit: 30 req/m) |
| | `POST` | `/api/auth/forgot-password`| Publik | Permintaan token reset kata sandi (Strict Rate Limit) |
| | `POST` | `/api/auth/reset-password` | Publik | Pembaruan kata sandi via token valid (Strict Rate Limit) |
| | `GET` | `/api/auth/me` | User | Mengambil profil pengguna yang sedang login |
| **Products** | `GET` | `/api/products` | Publik | Katalog terpaginasi (Filter kategori, size, brand, price, audiens) |
| | `GET` | `/api/products/{id}` | Publik | Detail lengkap satu produk & stok ukuran |
| | `GET` | `/api/products/{id}/related`| Publik | Daftar produk serupa berdasarkan kategori/brand |
| | `POST` | `/api/products` | Admin | Menambah produk baru |
| | `PUT` | `/api/products/{id}` | Admin | Memperbarui informasi & stok produk |
| | `DELETE`| `/api/products/{id}` | Admin | Menghapus produk |
| | `POST` | `/api/upload` | Admin | Upload gambar produk ke storage |
| **Categories**| `GET` | `/api/categories` | Publik | Daftar kategori (In-memory TTL Cache 60 detik) |
| | `POST` | `/api/categories` | Admin | Menambah kategori baru & invalidasi cache otomatis |
| **Cart** | `GET` | `/api/cart` | User | Mengambil isi keranjang belanja pengguna |
| | `POST` | `/api/cart` | User | Menambah item ke keranjang (size & stock validation) |
| | `PUT` | `/api/cart/{itemId}` | User | Mengubah jumlah item keranjang |
| | `DELETE`| `/api/cart/{itemId}` | User | Menghapus satu item dari keranjang |
| | `DELETE`| `/api/cart` | User | Mengosongkan keranjang belanja |
| **Wishlist** | `GET` | `/api/wishlist` | User | Mengambil daftar produk favorit pengguna |
| | `POST` | `/api/wishlist` | User | Menambahkan produk ke wishlist |
| | `DELETE`| `/api/wishlist/{productId}`| User | Menghapus produk dari wishlist |
| **Orders** | `POST` | `/api/orders` | User | Pembuatan pesanan & reservasi stok (Proteksi `Idempotency-Key`) |
| | `GET` | `/api/orders` | User/Admin| Daftar pesanan (Pengguna: milik sendiri; Admin: scope=all) |
| | `GET` | `/api/orders/{orderId}` | User/Admin| Detail pesanan lengkap dengan kurir & nomor resi |
| | `PATCH`| `/api/orders/{orderId}` | User/Admin| Pembatalan pesanan & pengembalian stok inventaris |
| | `PATCH`| `/api/orders/{orderId}/status`| Admin | Pembaruan status pesanan (*Finite State Machine*) |
| | `POST` | `/api/payment` | User | Konfirmasi pembayaran pesanan (Proteksi `Idempotency-Key`) |
| **Reviews** | `GET` | `/api/reviews` | Publik | Daftar review berdasarkan produk |
| | `POST` | `/api/reviews` | User | Menulis review & penilaian bintang |

---

## 🛡 8. Keamanan, Pertahanan & Durability (Platform Hardening)

### 8.1 Tiered In-Memory IP Rate Limiting
Sistem mengimplementasikan pembatasan laju permintaan (*rate limiting*) berbasis IP klien secara bertingkat menggunakan struktur data *thread-safe* di memori Go ([`rate_limit_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/rate_limit_middleware.go)):
* **Auth Strict Limiter**: Membatasi rute sensitif autentikasi (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`) maksimal **30 request/menit** per IP. Melindungi akun pengguna dari serangan *brute-force* kamus dan *credential stuffing*.
* **Global API Limiter**: Membatasi seluruh rute `/api/*` maksimal **600 request/menit** per IP untuk mencegah *data scraping* liar dan serangan banjir request (*Denial of Service*).
* **Standar HTTP Header**: Menyertakan header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan saat kuota terlampaui mengirimkan status `HTTP 429 Too Many Requests` disertai header `Retry-After`.

### 8.2 HTTP Security Headers & Payload Restriction
Middleware pertahanan web otomatis menginjeksikan header keamanan standar industri pada setiap siklus respons ([`security_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/security_middleware.go)):
* `X-Content-Type-Options: nosniff`: Mencegah peramban menebak tipe MIME di luar yang dideklarasikan server (*MIME sniffing attack*).
* `X-Frame-Options: DENY`: Melarang aplikasi dimuat di dalam `<iframe>` di situs lain guna mencegah serangan pencurian klik (*Clickjacking*).
* `Referrer-Policy: strict-origin-when-cross-origin`: Melindungi data sensitif URL saat pengguna berpindah ke tautan eksternal.
* `Permissions-Policy`: Menonaktifkan akses perangkat keras yang tidak dibutuhkan (`camera=(), microphone=(), geolocation=()`).
* **Batas Ukuran Payload 2 MB (`MaxBodySize`)**: Membatasi ukuran *request body* JSON maksimal 2 MB (`http.MaxBytesReader`) untuk melindungi server dari serangan konsumsi memori masif.

### 8.3 Server Timeout & Pertahanan Serangan Slowloris
Server HTTP Go dikonfigurasi dengan batas waktu (*timeouts*) ketat pada level soket jaringan ([`main.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/cmd/api/main.go#L139-L147)):
* `ReadHeaderTimeout: 10s` & `ReadTimeout: 15s`: Menolak koneksi lambat yang sengaja menggantung pengiriman header atau body request (*Slowloris DoS attack*).
* `WriteTimeout: 30s`: Menutup koneksi jika klien gagal menerima respons dalam batas waktu wajar.
* `IdleTimeout: 60s`: Membersihkan koneksi *keep-alive* yang menganggur.
* `MaxHeaderBytes: 1 MB`: Membatasi ukuran header HTTP request.

### 8.4 Autentikasi JWT Stateless & Enkripsi Kata Sandi Bcrypt
* **Token JWT Terenkripsi**: Menggunakan tanda tangan kriptografis HMAC-SHA256 dengan masa berlaku 7 hari (168 jam) yang membawa klaim `userId`, `email`, dan `role`. Middleware mendukung pembacaan via header `Authorization: Bearer <token>` maupun cookie HTTP.
* **Hashing Bcrypt Adaptif**: Seluruh kata sandi pengguna di-*hash* menggunakan salt acak dan cost factor memadai sebelum disimpan ke database. Kata sandi mentah tidak pernah dicatat di log maupun disimpan di disk.

### 8.5 Proteksi Idempotency Key pada Transaksi Finansial
Pada alur pembuatan pesanan (`POST /api/orders`) dan konfirmasi pembayaran (`POST /api/payment`), sistem mendukung header **`Idempotency-Key`** ([`order_handler.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/handler/order_handler.go#L49-L124), [`PaymentPage.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/PaymentPage.tsx)):
* Jika pengguna mengklik tombol "Konfirmasi Pembayaran" beberapa kali saat koneksi internet lambat, request kedua yang sedang berjalan ditahan secara aman (*HTTP 409 Conflict*).
* Begitu request pertama selesai, request ulang berikutnya dengan key yang sama akan langsung mengembalikan hasil tersimpan tanpa membuat pesanan ganda atau memotong saldo dua kali (*Header `X-Idempotent-Replay: true`*).

### 8.6 Background Worker Pemulihan Stok Pesanan PENDING
Untuk mencegah masalah klasik e-commerce di mana stok sepatu terkunci selamanya oleh pembeli yang tidak menyelesaikan pembayaran, sistem memiliki *background worker* otomatis ([`order_repository.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/repository/order_repository.go#L620-L656), [`main.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/cmd/api/main.go#L92-L112)):
* Berjalan otomatis setiap 15 menit di latar belakang (*goroutine ticker*).
* Mendeteksi pesanan berstatus `PENDING` yang usianya telah melebihi **24 jam**.
* Membatalkan pesanan menjadi `CANCELLED` dan mengembalikan kuantitas stok varian ukuran sepatu ke rak inventaris secara atomik.

### 8.7 Pencegahan Deadlock & Concurrency Safety
Saat ribuan pelanggan melakukan checkout bersamaan untuk sepatu edisi terbatas, query pemotongan stok pada tabel `product_sizes` dan `products` rentan mengalami *deadlock* basis data (`SQLSTATE 40P01`). Shoes4Us mencegahnya melalui fungsi deterministik ([`order_repository.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/repository/order_repository.go#L42-L61)):
* Seluruh item belanja diurutkan secara leksikografis berdasarkan `ProductID` dan `Size` sebelum transaksi dieksekusi.
* Karena seluruh transaksi mengunci baris data dengan urutan yang sama persis, kondisi penguncian melingkar (*circular lock waiting*) tereliminasi 100%.

---

## ⚡ 9. Strategi Performa Web & Caching (Performance Engineering)

### 9.1 Client-Side SWR In-Memory Caching & Request Deduplication
Frontend mengimplementasikan mekanisme *Stale-While-Revalidate* (SWR) in-memory langsung pada klien API ([`api.ts`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/services/api.ts)):
* **Cache 30 Detik**: Request publik (`/products`, `/categories`, `/shipping/couriers`, `/reviews`) disimpan di memori selama 30 detik. Navigasi bolak-balik antara katalog produk dan detail sepatu berjalan **instan (0ms)** tanpa memicu request jaringan ulang.
* **In-Flight Request Deduplication**: Jika dua komponen React meminta data katalog yang sama secara bersamaan, sistem hanya menembakkan **1 request HTTP** ke backend dan membagikan *Promise* yang sama ke kedua komponen.
* **Auto-Purge on Mutation**: Saat terjadi aksi mutasi data (`POST`, `PUT`, `PATCH`, `DELETE` seperti menambah ke keranjang atau ulasan), seluruh cache langsung dibersihkan (`clearApiCache()`) guna menjamin kesegaran data.

### 9.2 Server-Side In-Memory Category TTL Cache
Daftar kategori produk disimpan di memori backend Go selama **60 detik** menggunakan mekanisme thread-safe `sync.RWMutex` ([`product_service.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/service/product_service.go#L37-L86)):
* Mencegah pemukulan query `SELECT * FROM categories` ke PostgreSQL berulang-ulang pada setiap kunjungan pengguna.
* Cache otomatis diinvalidasi (*purged*) secara seketika saat Admin membuat kategori baru.

### 9.3 Kompresi Payload Gzip & Cache-Control Aset Statis
* **Kompresi Gzip Tingkat 5**: Router Chi secara otomatis mengompresi respons JSON menggunakan middleware `chimw.Compress(5)`, mengurangi ukuran transfer data hingga 70%.
* **Cache-Control Gambar Statis**: Endpoint berkas statis `/uploads/*` menyertakan header `Cache-Control: public, max-age=31536000, immutable`, memastikan browser pelanggan menyimpan gambar produk secara lokal selama 1 tahun tanpa revalidasi berulang.

### 9.4 Optimasi Core Web Vitals (LCP Eager Loading & CLS Prevention)
* **LCP (Largest Contentful Paint)**: Foto pertama banner hero beranda dimuat dengan prioritas tertinggi (`fetchPriority="high"` dan `loading="eager"`), memangkas waktu LCP hingga di bawah batas hijau 2.5 detik.
* **CLS (Cumulative Layout Shift)**: Seluruh kartu produk dan container gambar memiliki rasio aspek studio terkunci (`aspect-square` atau `aspect-[3/4]`), mencegah pergeseran tata letak saat gambar selesai diunduh.

---

## 📊 10. Observabilitas & Keandalan Operasional (Observability & Monitoring)

### 10.1 Structured Logging Berbasis JSON (`log/slog`)
Setiap request HTTP yang masuk ke server dicatat menggunakan pustaka standar `log/slog` dengan format JSON yang terstruktur ([`logger_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/logger_middleware.go)):
* Mencatat atribut: `request_id`, `method`, `path`, `status`, `duration_ms`, dan `bytes`.
* Level log otomatis terkalibrasi: `status >= 500` sebagai `ERROR`, `status >= 400` sebagai `WARN`, dan status berhasil sebagai `INFO`. Memudahkan integrasi dengan platform log aggregator (seperti Datadog, Grafana Loki, atau CloudWatch).

### 10.2 Deep Database Health Check Endpoint
Endpoint pemantau kesehatan server `GET /api/health` tidak sekadar mengembalikan respons statis, melainkan melakukan pengujian ping aktif ke pool koneksi basis data ([`router.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/handler/router.go#L77-L95)):
* Jika PostgreSQL beroperasi normal: Mengembalikan `HTTP 200 OK` dengan payload `{"status": "ok", "database": "connected"}`.
* Jika koneksi PostgreSQL terputus: Mengembalikan `HTTP 503 Service Unavailable` dengan payload `{"status": "degraded", "database": "disconnected"}` sehingga *load balancer* atau orkestrator kontainer (Docker/K8s) dapat mengalihkan trafik secara otomatis.

---

## 💻 11. Panduan Instalasi, Menjalankan & Pengujian (Developer Guide)

### 11.1 Prasyarat Perangkat Lunak
* **Go**: Versi `1.24.0` atau yang lebih baru.
* **Node.js**: Versi `20.x` LTS atau yang lebih baru & **npm**.
* **PostgreSQL**: Server PostgreSQL aktif (lokal di port 5432 atau cloud Neon DB).
* **Git**: Untuk manajemen repositori versi kode.

### 11.2 Konfigurasi Lingkungan (`.env`)
Buat file konfigurasi `.env` pada direktori root atau di dalam folder `backend/`:

```env
# Port Server Backend API
PORT=8080

# URL Koneksi PostgreSQL (Lokal atau Cloud Neon)
DATABASE_URL=postgresql://username:password@localhost:5432/shoes4us?sslmode=disable

# Kunci Rahasia JWT (Wajib diisi string acak aman untuk produksi)
JWT_SECRET=rahasia_super_aman_shoes4us_jwt_2026
JWT_EXPIRES_HOURS=168

# Origin CORS yang Diizinkan (Pisahkan dengan koma)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Direktori Penyimpanan Berkas Statis Upload
UPLOAD_DIR=./uploads
STORAGE_DRIVER=local
```

### 11.3 Perintah Menjalankan Aplikasi & Pengujian

```bash
# 1. Menjalankan Frontend React Vite (Tersedia di http://localhost:3000)
npm run dev:fe

# 2. Menjalankan Backend Go REST API (Tersedia di http://localhost:8080)
npm run dev:be

# 3. Menjalankan Database Seeder (Membuat kategori, produk & akun admin awal)
npm run seed:be

# 4. Menjalankan Seluruh Pengujian Unit Backend (Go Test)
npm run test:be

# 5. Membangun Bundle Produksi Frontend (TypeScript Check & Vite Build)
npm run build:fe

# 6. Menjalankan Preview Hasil Build Frontend
npm run preview:fe
```

---

## 🗺 12. Roadmap & Rencana Pengembangan Masa Depan

- [ ] **Multi-Warehouse Stock Allocation**: Kemampuan mempartisi stok sepatu fisik di beberapa gudang cabang kota secara terdistribusi.
- [ ] **Direct Midtrans Webhook Live Signature Verification**: Penguatan verifikasi hash kriptografis SHA512 notifikasi pembayaran Midtrans pada lingkungan live produksi.
- [ ] **OpenTelemetry Tracing**: Integrasi ekspor span trace OTel ke backend APM untuk pelacakan mikro-latensi query database per request.
- [ ] **Progressive Web App (PWA) & Offline Browsing**: Pemanfaatan Service Worker untuk penjelajahan katalog sepatu saat koneksi internet terputus.
- [ ] **AI-Powered Fit & Size Recommendation**: Fitur pintar rekomendasi ukuran sepatu berdasarkan perbandingan panjang kaki dan profil merek sebelumnya.

---

<div align="center">
  <sub>Dikembangkan dengan standar rekayasa ritel modern untuk Shoes4Us Footwear E-Commerce Platform © 2026. Seluruh hak cipta dilindungi.</sub>
</div>

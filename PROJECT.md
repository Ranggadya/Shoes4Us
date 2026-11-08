# 👟 Shoes4Us E-Commerce Platform
> Dokumentasi Komprehensif Arsitektur, Fitur, Database, Keamanan, dan Panduan Pengembangan Sistem

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![Chi Router](https://img.shields.io/badge/Router-Chi_v5-black?style=for-the-badge)](https://github.com/go-chi/chi)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgx_v5-4169E1?style=for-the-badge&logo=postgresql)](https://github.com/jackc/pgx)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=for-the-badge&logo=react-router)](https://reactrouter.com/)

---

## 📋 Daftar Isi
1. [Deskripsi Proyek](#-1-deskripsi-proyek)
   - [1.1 Gambaran Umum](#11-gambaran-umum)
   - [1.2 Arsitektur Monorepo](#12-arsitektur-monorepo)
   - [1.3 Nilai Unggulan (Unique Selling Points)](#13-nilai-unggulan-unique-selling-points)
2. [Tujuan Proyek](#-2-tujuan-proyek)
3. [Teknologi & Ekosistem (Tech Stack)](#-3-teknologi--ekosistem-tech-stack)
4. [Arsitektur Sistem & Direktori](#-4-arsitektur-sistem--direktori)
   - [4.1 Pola Arsitektur Layered Backend](#41-pola-arsitektur-layered-backend)
   - [4.2 Diagram Alur Permintaan (Request Lifecycle)](#42-diagram-alur-permintaan-request-lifecycle)
   - [4.3 Struktur Direktori Monorepo](#43-struktur-direktori-monorepo)
5. [Fitur-Fitur Sistem (Feature Modules)](#-5-fitur-fitur-sistem-feature-modules)
   - [5.1 Pengalaman Belanja Footwear Ritel & Katalog](#51-pengalaman-belanja-footwear-ritel--katalog)
   - [5.2 Filter Produk Kotak Presisi (Sharp Rectangular Filters)](#52-filter-produk-kotak-presisi-sharp-rectangular-filters)
   - [5.3 Guest Cart & Auto-Sync Transaksional](#53-guest-cart--auto-sync-transaksional)
   - [5.4 Mesin Diskon Voucher & Seleksi Kurir Dinamis](#54-mesin-diskon-voucher--seleksi-kurir-dinamis)
   - [5.5 Pelacakan Logistik & Nomor Resi](#55-pelacakan-logistik--nomor-resi)
   - [5.6 Pusat Informasi & Layanan Pelanggan Terpadu](#56-pusat-informasi--layanan-pelanggan-terpadu)
   - [5.7 Portal Administrator (Admin Dashboard & Operasional)](#57-portal-administrator-admin-dashboard--operasional)
6. [Skema & Model Basis Data (Database Schema)](#-6-skema--model-basis-data-database-schema)
   - [6.1 Diagram Relasi Entitas (ERD)](#61-diagram-relasi-entitas-erd)
   - [6.2 Indeks Komposit & Optimasi Query Database](#62-indeks-komposit--optimasi-query-database)
7. [Katalog Endpoint REST API](#-7-katalog-endpoint-rest-api)
8. [Keamanan, Performa & Durability (Platform Hardening)](#-8-keamanan-performa--durability-platform-hardening)
   - [8.1 Keamanan & Hardening (Tiered Rate Limiter & Security Headers)](#81-keamanan--hardening-tiered-rate-limiter--security-headers)
   - [8.2 Performa Web & Strategi Caching (SWR Client, Category TTL & Gzip)](#82-performa-web--strategi-caching-swr-client-category-ttl--gzip)
   - [8.3 Ketahanan Data & Transaksi (Idempotency & Auto-Expire Worker)](#83-ketahanan-data--transaksi-idempotency--auto-expire-worker)
   - [8.4 Observabilitas & Health Check (Structured Logging & DB Ping)](#84-observabilitas--health-check-structured-logging--db-ping)
9. [Panduan Instalasi & Menjalankan Proyek](#-9-panduan-instalasi--menjalankan-proyek)
10. [Roadmap Pengembangan Masa Depan](#-10-roadmap-pengembangan-masa-depan)

---

## 📖 1. Deskripsi Proyek

### 1.1 Gambaran Umum
**Shoes4Us** adalah platform e-commerce alas kaki (*footwear retail*) modern yang dirancang untuk menghadirkan pengalaman belanja kelas ritel internasional (terinspirasi dari New Balance, Planet Sports, dan Foot Locker). Platform ini menyediakan navigasi katalog cepat, filter pencarian multi-dimensi, transaksi belanja tanpa hambatan (*guest checkout*), mesin promosi diskon, serta pelacakan pengiriman secara visual.

### 1.2 Arsitektur Monorepo
Proyek ini mengadopsi arsitektur **Monorepo** yang memisahkan tanggung jawab secara tegas (*Separation of Concerns*):
- **Backend**: Layanan REST API performa tinggi berbasis **Go (Golang 1.24)** dengan router **Chi v5**, koneksi pool PostgreSQL terkelola (**pgx/v5**), autentikasi JWT stateless, serta arsitektur berlapis (*Handler-Service-Repository*).
- **Frontend**: *Single Page Application* (SPA) berbasis **React 19**, **Vite 6**, **TypeScript 5.7**, dan **Tailwind CSS 3.4**, dilengkapi *client-side routing* **React Router v7** dan *code-splitting* berbasis `React.lazy()`.

### 1.3 Nilai Unggulan (Unique Selling Points)
* **Retail Footwear Experience**: Desain kartu produk dan halaman detail bersudut tegas (*sharp rectangular*) dengan foto *edge-to-edge* rasio studio tanpa padding, badge koleksi eksklusif, matriks ukuran US & EU, rating bintang, dan ulasan terverifikasi.
* **Shop by Category Editorial Campaign**: Bagian kampanye visual di beranda dengan potret editorial *streetwear* pencahayaan *golden-hour* (Shop Men's, Shop Women's, Shop Kids') yang terhubung langsung ke sub-kategori (*Footwear, Clothing, Accessories*).
* **Guest Cart & Frictionless Checkout**: Pengunjung non-login dapat langsung menambahkan sepatu ke keranjang, menguji kode voucher, dan memilih kurir pengiriman; keranjang lokal disinkronkan secara otomatis ke database saat pengguna masuk atau mendaftar.
* **Double-Deduction & Deadlock Prevention**: Pengurangan stok inventaris per ukuran dilakukan dalam satu transaksi atomik database terurut secara deterministik (`sortOrderItemsForDeduction`) untuk mencegah *deadlock* (`SQLSTATE 40P01`) dan *overselling*.
* **Idempotency Protection**: Perlindungan `Idempotency-Key` pada pembuatan pesanan dan pembayaran untuk mencegah tagihan ganda akibat klik berulang pada koneksi lambat.
* **Automated Stale Order Recovery**: *Background worker* mandiri yang membatalkan pesanan `PENDING` yang tidak dibayar lebih dari 24 jam dan mengembalikan stok reservasi ke inventaris secara otomatis.

---

## 🎯 2. Tujuan Proyek
* **Kecepatan & Responsivitas Ekstrem**: Menyajikan respon API di bawah 100ms dengan koneksi *pooling* `pgxpool`, kompresi Gzip, *composite indexing*, serta *caching* berlapis pada *frontend* (SWR in-memory) dan *backend* (in-memory TTL).
* **Keamanan Berlapis (Defense in Depth)**: Menerapkan pembatasan *rate limiting* bertingkat (ketat pada autentikasi, proporsional pada API publik), proteksi ukuran *payload* 2 MB, *security headers*, serta *timeout* anti-Slowloris.
* **Kemudahan Navigasi & Transparansi Informasi**: Menyediakan 8 halaman resmi *customer care* dan profil perusahaan ritel (Tentang Kami, Tentang Shoes4Us, S&K, Kebijakan Privasi, FAQ interaktif, Alur Pengembalian 14 Hari, Formulir Kontak & Toko Flagship, serta Peta Situs) dengan navigasi satu klik.

---

## 🛠 3. Teknologi & Ekosistem (Tech Stack)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHOES4US TECH STACK                             │
├────────────────────────────────┬───────────────────────────────────────┤
│ Backend Runtime & Framework    │ Go 1.24, Chi Router v5.2              │
│ Database & Connection Pool     │ PostgreSQL, pgx/v5 (pgxpool)          │
│ Backend Security & Token       │ golang-jwt/jwt/v5, golang.org/x/crypto│
│ Cloud Storage SDK              │ AWS SDK for Go v2 (S3-compatible)     │
│ Frontend Runtime & Bundler     │ React 19, Vite 6.1                    │
│ Routing & Client Architecture  │ React Router DOM v7 (SPA, Lazy Loaded)│
│ Styling & Design System        │ Tailwind CSS 3.4 (Sharp Rectangular)  │
│ Language                       │ TypeScript 5.7 (Strict Type Checking) │
│ Icons & Feedback               │ Lucide React, React Hot Toast         │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 🏛 4. Arsitektur Sistem & Direktori

### 4.1 Pola Arsitektur Layered Backend
Layanan API Go mengadopsi prinsip **Clean Layered Architecture**:
1. **Router & Middleware Layer** (`internal/handler/router.go`, `internal/middleware/`): Mengatur *security headers*, *structured logging*, *rate limiting*, CORS, kompresi Gzip, autentikasi JWT, dan pembatasan peran *Admin*.
2. **Handler Layer** (`internal/handler/`): Memproses HTTP request, validasi format JSON, ekstraksi claims pengguna, dan pembentukan respons envelope standar.
3. **Service Layer** (`internal/service/`): Menjalankan logika bisnis inti, kalkulasi diskon voucher, validasi transisi status pesanan (*state machine*), dan orkestrasi inventaris.
4. **Repository Layer** (`internal/repository/`): Menjalankan query SQL terparameterisasi ke PostgreSQL, pengelolaan transaksi atomik `pgx.Tx`, dan pengindeksan data.
5. **Database Layer** (`internal/database/`): Pengelolaan pool koneksi `pgxpool`, verifikasi skema tabel otomatis (*auto-ensure schema*), dan pembuatan indeks performa.

### 4.2 Diagram Alur Permintaan (Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / Browser
    participant Sec as Security & Rate Limiter MW
    participant Auth as Auth & Role Guard
    participant Handler as Go Chi Handler
    participant Svc as Business Service
    participant Repo as Postgres Repository
    participant DB as PostgreSQL Database

    Client->>Sec: HTTP Request + Bearer Token / Cookie
    alt Melebihi Batas Rate Limit
        Sec-->>Client: 429 Too Many Requests (Retry-After)
    else Dalam Batas Aman
        Sec->>Auth: Teruskan Request
        alt Endpoint Terlindungi & Token Tidak Valid
            Auth-->>Client: 401 Unauthorized / 403 Forbidden
        else Terverifikasi / Publik
            Auth->>Handler: Context With Claims
            Handler->>Svc: Panggil Method Service
            alt Terdapat Cache Valid (SWR / Memory TTL)
                Svc-->>Handler: Kembalikan Data Cache
            else Miss Cache / Mutasi
                Svc->>Repo: Eksekusi Query / Transaksi Atomik
                Repo->>DB: SQL Query dengan Parameterized Arguments
                DB-->>Repo: Hasil Query Baris / Eksekusi
                Repo-->>Svc: Domain Entity
                Svc-->>Handler: Service Result
            end
            Handler-->>Client: HTTP 200/201 JSON Response (Gzip Compressed)
        end
    end
```

### 4.3 Struktur Direktori Monorepo

```text
Shoes4Us E-Commerce Platform/
├── backend/                             # Layanan REST API Go
│   ├── cmd/
│   │   ├── api/
│   │   │   └── main.go                  # Entry point server HTTP, worker & pool
│   │   └── seed/
│   │       └── main.go                  # Seeder katalog & kategori awal
│   ├── internal/
│   │   ├── config/                      # Pengurai environment variables
│   │   ├── database/                    # pgxpool, DDL schema & composite index
│   │   ├── domain/                      # Entitas, enum, error definition & model
│   │   ├── handler/                     # HTTP Handler (Product, Order, Cart, Auth, dll)
│   │   ├── middleware/                  # Rate limiter, Security headers, Logger, Auth, CORS
│   │   ├── repository/                  # Akses database PostgreSQL & transaksi atomik
│   │   └── service/                     # Logika bisnis, diskon, kupon, status machine
│   ├── pkg/                             # Paket utilitas independen (hash, token, storage, response)
│   ├── uploads/                         # Direktori berkas statis lokal
│   ├── go.mod & go.sum
│   └── README.md
├── frontend/                            # Aplikasi Web SPA React
│   ├── public/                          # Aset statis, foto kampanye potret, logo
│   │   ├── shop-mens.jpg                # Foto potret kampanye Men's
│   │   ├── shop-womens.jpg              # Foto potret kampanye Women's
│   │   └── shop-kids.jpg                # Foto potret kampanye Kids'
│   ├── src/
│   │   ├── components/                  # Komponen UI modular
│   │   │   ├── ShopByCategory.tsx       # Kampanye editorial potret beranda
│   │   │   ├── ProductCard.tsx          # Kartu ritel footwear edge-to-edge
│   │   │   ├── ProductFilters.tsx       # Sidebar filter kotak bersudut tajam
│   │   │   ├── OrderTracking.tsx        # Timeline status visual & resi
│   │   │   ├── HeroCarousel.tsx         # Banner slider LCP optimized
│   │   │   ├── Navbar.tsx               # Navigasi utama & mega menu
│   │   │   └── Footer.tsx               # Footer terhubung ke 8 halaman info
│   │   ├── context/                     # Context providers (Auth, Cart, Wishlist)
│   │   ├── pages/                       # Halaman aplikasi
│   │   │   ├── HomePage.tsx             # Halaman utama
│   │   │   ├── ProductListPage.tsx      # Katalog produk dengan filter URL
│   │   │   ├── ProductDetailPage.tsx    # Showcase ritel & ukuran sepatu
│   │   │   ├── CartPage.tsx             # Keranjang belanja & voucher preview
│   │   │   ├── PaymentPage.tsx          # Checkout, kurir & pembayaran
│   │   │   ├── InfoPages.tsx            # 8 Halaman Tentang & Layanan Pelanggan
│   │   │   ├── OrderStatusPage.tsx      # Pelacakan status pesanan
│   │   │   └── AdminDashboard.tsx       # Panel kendali toko admin
│   │   ├── services/                    # Client API dengan in-memory SWR cache
│   │   ├── types/                       # Definisi TypeScript
│   │   ├── App.tsx                      # Pendaftaran rute & lazy loading
│   │   └── main.tsx                     # Entry point React Vite
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── package.json                         # Script monorepo root
├── README.md                            # Panduan cepat proyek
└── PROJECT.md                           # Dokumentasi arsitektur komprehensif
```

---

## 🚀 5. Fitur-Fitur Sistem (Feature Modules)

### 5.1 Pengalaman Belanja Footwear Ritel & Katalog
* **Studio Edge-to-Edge Product Card ([`ProductCard.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ProductCard.tsx))**:
  - Foto produk memenuhi kartu tanpa batas celah (*zero padding*), rasio persegi studio, ikon wishlist di pojok kanan atas, nama merek kapital (*uppercase*), lini audiens & warna, harga diskon merah + harga coret + badge *20% OFF*, serta visualisasi bintang rating.
* **Showcase Detail Produk Kelas Ritel ([`ProductDetailPage.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/ProductDetailPage.tsx))**:
  - Breadcrumb bergaris miring, galeri *thumbnail* vertikal di sisi kiri, foto utama dengan badge *EXCLUSIVE* / *BEST SELLER*, SKU produk, pemilihan ukuran US (`US 7.5` – `US 11`) dengan pengecekan stok otomatis, link modal *Panduan Ukuran*, tombol beli bertumpuk (*BELI SEKARANG* & *TAMBAH KE KERANJANG*), serta modal *Periksa ketersediaan di toko*.
* **Kampanye Editorial Potret Beranda ([`ShopByCategory.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ShopByCategory.tsx))**:
  - Menampilkan 3 kartu kampanye potret rasio 3:4 dengan tema fotografi *streetwear rooftop golden-hour*:
    - **SHOP MEN'S**: Tautan langsung ke *Men's Footwear*, *Men's Clothing*, dan *Men's Accessories*.
    - **SHOP WOMEN'S**: Tautan langsung ke *Women's Footwear*, *Women's Clothing*, dan *Women's Accessories*.
    - **SHOP KIDS'**: Tautan langsung ke *Kids' Footwear*, *Kids' Clothing*, dan *Kids' Accessories*.

### 5.2 Filter Produk Kotak Presisi (Sharp Rectangular Filters)
* **Sidebar Filter Kotak Ritel ([`ProductFilters.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/ProductFilters.tsx))**:
  - Seluruh elemen filter mengusung estetika kotak tegas bersudut tajam (*sharp rectangular*, `border-slate-300`, aktif `bg-slate-900 text-white`):
    1. **Urutkan Berdasarkan**: Pilihan Terbaru, Harga Rendah-Tinggi, Harga Tinggi-Rendah, dan Nama A-Z.
    2. **Ukuran Sepatu (EU)**: Matriks 10 tombol ukuran (36 – 45).
    3. **Brand**: Kotak centang merek populer (Nike, Adidas, New Balance, Puma, Jordan, Vans, Converse, Asics).
    4. **Gender / Audiens**: Kotak pilihan Pria, Wanita, Unisex, dan Anak.
    5. **Kategori Sepatu**: Kotak pilihan Semua, Basketball, Lifestyle, Running, Sneakers, Training.
    6. **Koleksi & Status**: *Switch* persegi stok tersedia, tombol Sedang Diskon, Rilisan Baru, dan Exclusive.
    7. **Rentang Harga**: Preset kotak cepat (`< 1 Jt`, `1 - 2 Jt`, `> 2 Jt`) dan input nominal angka dengan *debounce* aman.
  - **Sinkronisasi URL Penuh**: Setiap pilihan filter tercermin pada query URL (`useSearchParams`), mendukung navigasi *back/forward*, *bookmarking*, dan pembatalan instan per *chip tag*.

### 5.3 Guest Cart & Auto-Sync Transaksional
* **Keranjang Belanja Non-Login**: Pengunjung dapat langsung memasukkan sepatu ke keranjang sebelum mendaftar akun (`localStorage` key: `shoes4us_guest_cart_v1`).
* **Auto-Sync saat Login / Register**: Saat pengguna masuk atau mendaftar di halaman `/login` atau `/register`, seluruh item dari keranjang tamu otomatis dikirim ke endpoint `/api/cart` backend dan disatukan tanpa ada barang yang hilang.

### 5.4 Mesin Diskon Voucher & Seleksi Kurir Dinamis
* **Voucher Discount Engine**:
  - `DISKON10`: Potongan harga 10% dari subtotal belanja.
  - `HEMAT50RB`: Potongan nominal langsung Rp 50.000.
  - `GRATISONGKIR`: Potongan 100% pada ongkos kirim kurir yang dipilih.
* **Seleksi Kurir Pengiriman Real-Time**:
  - Integrasi opsi ekspedisi: **JNE Reguler** (2-3 hari, Rp 18.000), **SiCepat REG** (2-3 hari, Rp 16.000), **J&T Express** (1-2 hari, Rp 20.000), dan **JNE YES** (1 hari, Rp 32.000). Biaya pengiriman dan total pesanan diperbarui seketika.

### 5.5 Pelacakan Logistik & Nomor Resi
* **Visual Logistics Timeline ([`OrderTracking.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/OrderTracking.tsx))**:
  - Visualisasi tahapan pesanan: *Menunggu Pembayaran* → *Diproses Gudang* → *Dalam Pengiriman* → *Pesanan Selesai*.
  - Menampilkan nama kurir logistik dan **Nomor Resi Resmi** (contoh: `JNE-ORD202611`, `SCP-ORD8829`) yang dapat disalin dengan satu klik (*Copy to Clipboard*).

### 5.6 Pusat Informasi & Layanan Pelanggan Terpadu
* **8 Halaman Informasi Resmi ([`InfoPages.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/pages/InfoPages.tsx))**:
  - Dilengkapi *sidebar* navigasi kotak terpadu sehingga pengguna dapat berpindah halaman dengan mudah:
    1. `/tentang-kami`: Profil resmi perusahaan ritel Shoes4Us Indonesia, nilai keaslian produk, dan statistik pencapaian.
    2. `/tentang-shoes4us`: Standar kurasi 5 tahap verifikasi keaslian (*100% Original Guarantee*).
    3. `/syarat-dan-ketentuan`: Ketentuan layanan transaksi, pembayaran, dan pengiriman.
    4. `/kebijakan-privasi`: Kebijakan perlindungan data pelanggan dan keamanan transaksi.
    5. `/faq`: Tanya jawab interaktif (*accordion*) seputar pemesanan, pengiriman, dan panduan ukuran.
    6. `/kebijakan-pengembalian`: Panduan 4 tahap penukaran ukuran dan garansi retur 14 hari.
    7. `/kontak-kami`: Formulir kirim pesan pelanggan interaktif, kontak WhatsApp/Email, dan daftar 3 *Flagship Store* fisik.
    8. `/peta-situs`: Direktori tautan lengkap seluruh halaman belanja, akun, dan layanan pelanggan.

### 5.7 Portal Administrator (Admin Dashboard & Operasional)
* **Dashboard Analitik**: Ringkasan omzet penjualan, total pesanan berhasil, jumlah produk aktif, dan grafik status.
* **Manajemen Produk (CRUD)**: Penambahan produk baru dengan multi-ukuran, pengaturan stok, penandaan status promo, upload gambar ke storage, serta penghapusan produk.
* **Manajemen Status Pesanan**: Kemampuan mengubah status pesanan pelanggan (*Processing*, *Shipped*, *Delivered*, *Cancelled*) yang otomatis memperbarui nomor resi pengiriman.

---

## 🗄 6. Skema & Model Basis Data (Database Schema)

### 6.1 Diagram Relasi Entitas (ERD)

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
```

### 6.2 Indeks Komposit & Optimasi Query Database
Untuk menjamin kecepatan pencarian dan pengurutan katalog saat jutaan baris data tersimpan, skema database dilengkapi indeks komposit PostgreSQL ([`schema.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/database/schema.go#L156-L161)):
1. `idx_products_active_created`: Mempercepat query katalog aktif berurutan waktu (`products ("isActive", "createdAt" DESC)`).
2. `idx_products_category`: Mempercepat pemfilteran berdasarkan kategori sepatu (`products ("categoryId")`).
3. `idx_products_segment_audience`: Mempercepat filter multi-dimensi segmen & gender (`products ("segment", "audience")`).
4. `idx_products_price`: Mempercepat sorting dan rentang harga (`products ("price")`).
5. `idx_products_brand_lower`: Mempercepat pencarian merek tanpa membedakan huruf besar/kecil (`products (LOWER("brand"))`).
6. `idx_reviews_product_id`: Menjamin agregasi rating ulasan produk secepat kilat (`reviews ("productId")`).

---

## 📡 7. Katalog Endpoint REST API

Semua endpoint berbasis JSON dan mengembalikan amplop data seragam:
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { ... },
  "meta": { ... }
}
```

| Kelompok | Method | Endpoint | Akses | Keterangan & Proteksi |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Publik | Health check status service & ping koneksi database PostgreSQL |
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
| | `PATCH`| `/api/orders/{orderId}/status`| Admin | Pembaruan status pesanan (*state machine*) |
| | `POST` | `/api/payment` | User | Konfirmasi pembayaran pesanan (Proteksi `Idempotency-Key`) |
| **Reviews** | `GET` | `/api/reviews` | Publik | Daftar review berdasarkan produk |
| | `POST` | `/api/reviews` | User | Menulis review & penilaian bintang |

---

## 🛡 8. Keamanan, Performa & Durability (Platform Hardening)

### 8.1 Keamanan & Hardening (Tiered Rate Limiter & Security Headers)
1. **Tiered In-Memory IP Rate Limiting ([`rate_limit_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/rate_limit_middleware.go))**:
   - Membatasi serangan *brute-force* password pada `/api/auth/*` maksimum **30 request/menit** per IP.
   - Melindungi seluruh endpoint `/api/*` maksimum **600 request/menit** per IP dengan header standar `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `Retry-After`.
2. **HTTP Security Headers ([`security_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/security_middleware.go))**:
   - Otomatis menyertakan `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Permissions-Policy` pada setiap respons.
3. **Payload Size Guard & Server Timeout ([`main.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/cmd/api/main.go#L139-L147))**:
   - Membatasi ukuran *request body* JSON maksimum **2 MB** (`http.MaxBytesReader`) untuk mencegah eksploitasi kehabisan memori.
   - Mengonfigurasi `ReadTimeout: 15s`, `WriteTimeout: 30s`, `IdleTimeout: 60s`, dan `MaxHeaderBytes: 1 MB` untuk pertahanan terhadap serangan *Slowloris*.

### 8.2 Performa Web & Strategi Caching (SWR Client, Category TTL & Gzip)
1. **Client-Side SWR In-Memory Caching & In-Flight Request Deduplication ([`api.ts`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/services/api.ts))**:
   - Menyimpan *cache* GET selama **30 detik** untuk endpoint katalog publik (`/products`, `/categories`, `/shipping/couriers`, `/reviews`). Navigasi bolak-balik antara katalog dan detail produk berjalan instan (0ms).
   - Menggabungkan *request* GET identik yang terjadi bersamaan (*in-flight deduplication*), serta mengosongkan cache secara otomatis saat terjadi mutasi data (`POST`, `PUT`, `PATCH`, `DELETE`).
2. **In-Memory Server-Side Category Cache ([`product_service.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/service/product_service.go#L37-L86))**:
   - Menyimpan kategori produk di memori Go selama 60 detik (*TTL*) dengan mekanisme thread-safe `sync.RWMutex`, dan otomatis diinvalidasi saat Admin menambah kategori baru.
3. **Kompresi Gzip & Static Assets Cache**:
   - Router Go mengaktifkan kompresi Gzip level 5 (`chimw.Compress(5)`) untuk memangkas ukuran transfer payload JSON.
   - Endpoint gambar `/uploads/*` menyertakan header `Cache-Control: public, max-age=31536000, immutable`.
4. **Optimasi LCP (Largest Contentful Paint) Beranda ([`HeroCarousel.tsx`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/frontend/src/components/HeroCarousel.tsx#L70-L77))**:
   - Gambar *hero slide* pertama dimuat dengan `fetchPriority="high"` dan `loading="eager"`, sementara slide berikutnya menggunakan `loading="lazy"` dan `decoding="async"`.

### 8.3 Ketahanan Data & Transaksi (Idempotency & Auto-Expire Worker)
1. **Proteksi Idempotency Key ([`order_handler.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/handler/order_handler.go#L49-L124))**:
   - Endpoint pembuatan order dan konfirmasi pembayaran mendukung header `Idempotency-Key`. Permintaan duplikat yang sedang berjalan ditahan (*conflict*), dan permintaan ulang yang sudah sukses langsung mengembalikan hasil tersimpan tanpa membuat pesanan atau potongan stok ganda.
2. **Auto-Expiration Worker Pesanan PENDING ([`order_repository.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/repository/order_repository.go#L620-L656))**:
   - *Background worker* berjalan setiap 15 menit untuk membatalkan secara otomatis pesanan `PENDING` yang tidak dibayar lebih dari 24 jam dan memulihkan kembali stok ukuran sepatu ke database dalam transaksi atomik.

### 8.4 Observabilitas & Health Check (Structured Logging & DB Ping)
1. **Structured Access Logging ([`logger_middleware.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/middleware/logger_middleware.go))**:
   - Menggunakan `log/slog` bawaan Go untuk mencatat setiap request HTTP dengan `request_id`, `method`, `path`, `status`, `duration_ms`, dan `bytes`.
2. **Deep Database Health Check ([`router.go`](file:///d:/Codingan%20Umum/Shoes4Us%20E-Commerce%20Platform/backend/internal/handler/router.go#L77-L95))**:
   - Endpoint `GET /api/health` melakukan `pool.Ping` ke database PostgreSQL. Jika koneksi terputus, endpoint mengembalikan HTTP 503 dengan rincian status degradasi.

---

## 💻 9. Panduan Instalasi & Menjalankan Proyek

### 9.1 Prasyarat Sistem
* **Go**: Versi `1.24.0` atau lebih baru.
* **Node.js**: Versi `20.x` atau lebih baru & **npm**.
* **PostgreSQL**: Server PostgreSQL aktif (lokal atau Neon DB Cloud).

### 9.2 Konfigurasi Lingkungan (`.env`)
Salin berkas `.env.example` menjadi `.env` di root atau di dalam direktori `backend/`:
```env
PORT=8080
DATABASE_URL=postgresql://username:password@localhost:5432/shoes4us?sslmode=disable
JWT_SECRET=rahasia_super_aman_shoes4us_jwt_2026
JWT_EXPIRES_HOURS=168
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
UPLOAD_DIR=./uploads
STORAGE_DRIVER=local
```

### 9.3 Perintah Menjalankan Aplikasi
Dari direktori akar (root):

```bash
# 1. Menjalankan Frontend (React Vite di http://localhost:3000)
npm run dev:fe

# 2. Menjalankan Backend (Go REST API di http://localhost:8080)
npm run dev:be

# 3. Menjalankan Database Seeder (Membuat data produk, kategori & admin awal)
npm run seed:be

# 4. Menjalankan Seluruh Unit Test Backend
npm run test:be

# 5. Build Produksi Frontend
npm run build:fe
```

---

## 🗺 10. Roadmap Pengembangan Masa Depan
- [ ] **Multi-Warehouse Stock Allocation**: Dukungan manajemen stok di beberapa gudang cabang kota secara terdistribusi.
- [ ] **Direct Midtrans Webhook Live Signature Verification**: Penguatan verifikasi hash SHA512 notifikasi Midtrans pada environment produksi live.
- [ ] **OpenTelemetry Tracing**: Integrasi ekspor span trace OTel untuk pelacakan mikro-latensi database di cloud APM.
- [ ] **PWA & Offline Browsing**: Pemanfaatan Service Worker untuk kemampuan *offline catalog browsing* pada perangkat seluler.

---

<div align="center">
  <sub>Dikembangkan dengan bangga untuk Shoes4Us Footwear Retail E-Commerce Platform © 2026. Seluruh hak cipta dilindungi.</sub>
</div>

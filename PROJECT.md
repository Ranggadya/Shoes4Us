# 👟 Shoes4Us E-Commerce Platform
> Dokumentasi Komprehensif Arsitektur, Fitur, Database, dan Panduan Pengembangan Sistem

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Midtrans](https://img.shields.io/badge/Payment-Midtrans_Snap-0052CC?style=for-the-badge)](https://midtrans.com/)
[![Supabase](https://img.shields.io/badge/Storage-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

---

## 📋 Daftar Isi
1. [Deskripsi Proyek](#-1-deskripsi-proyek)
   - [1.1 Gambaran Umum](#11-gambaran-umum)
   - [1.2 Latar Belakang & Masalah](#12-latar-belakang--masalah)
   - [1.3 Target Pengguna](#13-target-pengguna)
   - [1.4 Nilai Unggulan (Unique Selling Points)](#14-nilai-unggulan-unique-selling-points)
2. [Tujuan Proyek](#-2-tujuan-proyek)
   - [2.1 Tujuan Fungsional & Bisnis](#21-tujuan-fungsional--bisnis)
   - [2.2 Tujuan Teknis & Arsitektur](#22-tujuan-teknis--arsitektur)
   - [2.3 Indikator Keberhasilan](#23-indikator-keberhasilan)
3. [Teknologi & Ekosistem (Tech Stack)](#-3-teknologi--ekosistem-tech-stack)
4. [Arsitektur Sistem (Layered Architecture)](#-4-arsitektur-sistem-layered-architecture)
   - [4.1 Pola Arsitektur](#41-pola-arsitektur)
   - [4.2 Diagram Alur Permintaan (Request Lifecycle)](#42-diagram-alur-permintaan-request-lifecycle)
   - [4.3 Struktur Direktori Proyek](#43-struktur-direktori-proyek)
5. [Fitur-Fitur Sistem (Feature Modules)](#-5-fitur-fitur-sistem-feature-modules)
   - [5.1 Modul Pengguna (Customer Experience)](#51-modul-pengguna-customer-experience)
   - [5.2 Modul Transaksi & Pembayaran](#52-modul-transaksi--pembayaran)
   - [5.3 Modul Administrator (Admin Portal)](#53-modul-administrator-admin-portal)
6. [Skema & Model Basis Data (Database Schema)](#-6-skema--model-basis-data-database-schema)
   - [6.1 Diagram Relasi Entitas (ERD)](#61-diagram-relasi-entitas-erd)
   - [6.2 Rincian Model Prisma](#62-rincian-model-prisma)
   - [6.3 Tipe Enumerasi (Enums)](#63-tipe-enumerasi-enums)
7. [Katalog Endpoint API (API Reference)](#-7-katalog-endpoint-api-api-reference)
8. [Alur Bisnis Utama (Core Workflows)](#-8-alur-bisnis-utama-core-workflows)
   - [8.1 Alur Checkout dan Pembayaran Midtrans](#81-alur-checkout-dan-pembayaran-midtrans)
   - [8.2 Alur Reset Kata Sandi Pengguna](#82-alur-reset-kata-sandi-pengguna)
9. [Panduan Instalasi & Menjalankan Proyek](#-9-panduan-instalasi--menjalankan-proyek)
   - [9.1 Prasyarat Sistem](#91-prasyarat-sistem)
   - [9.2 Konfigurasi Environment Variables (.env)](#92-konfigurasi-environment-variables-env)
   - [9.3 Setup Database & Migrasi Prisma](#93-setup-database--migrasi-prisma)
   - [9.4 Menjalankan Server Development](#94-menjalankan-server-development)
   - [9.5 Membangun Versi Production (Build)](#95-membangun-versi-production-build)
10. [Keamanan & Praktik Terbaik (Security & Best Practices)](#-10-keamanan--praktik-terbaik-security--best-practices)
11. [Roadmap & Rencana Pengembangan Masa Depan](#-11-roadmap--rencana-pengembangan-masa-depan)

---

## 📖 1. Deskripsi Proyek

### 1.1 Gambaran Umum
**Shoes4Us** adalah platform e-commerce berbasis web modern yang dirancang secara khusus untuk penjualan produk alas kaki (sepatu & sandal), pakaian olahraga (*apparel*), dan aksesoris gaya hidup. Platform ini mengusung pengalaman belanja digital yang mulus, cepat, responsif, dan elegan, baik untuk konsumen akhir (*B2C*) maupun pemilik toko/administrator.

Shoes4Us dibangun dari pondasi awal menggunakan teknologi terkini di ekosistem JavaScript/TypeScript: **Next.js 16 (App Router)**, **React 19**, **Prisma ORM 6**, basis data **PostgreSQL (Neon Cloud)**, penyimpanan media awan **Supabase Storage**, serta sistem pembayaran terpadu **Midtrans Snap Payment Gateway**.

### 1.2 Latar Belakang & Masalah
Dalam industri ritel sepatu, kendala operasional yang paling sering terjadi pada platform penjualan online meliputi:
1. **Ketidaksesuaian Stok per Ukuran (Size Variant Discrepancy)**: Banyak platform hanya mencatat stok total tanpa memisahkan ketersediaan stok fisik per ukuran (misalnya: Size 40, 41, 42), menyebabkan pembatalan pesanan akibat kehabisan stok spesifik.
2. **Proses Pembayaran Manual yang Rentan Kesalahan**: Konfirmasi transfer manual memperlambat pengiriman barang dan rawan bukti transfer palsu.
3. **Arsitektur Kode yang Sulit Dikembangkan**: Monolithic code yang mencampur logika database, logika bisnis, dan presentasi UI dalam satu file menyebabkan aplikasi sulit dirawat (*maintainability issue*) dan rawan bug saat terjadi penambahan fitur.

Shoes4Us hadir menjawab persoalan tersebut dengan:
- Manajemen stok granuler berbasis varian ukuran (`ProductSize`).
- Verifikasi stok ganda saat menambahkan ke keranjang dan sebelum finalisasi order (*stock locking validation*).
- Integrasi pembayaran otomatis dengan Midtrans (QRIS, Virtual Account, Kartu Kredit, GoPay).
- Penerapan **Layered Architecture** (*Controller-Service-Repository-Validator*) berstandar industri.

### 1.3 Target Pengguna
1. **Pelanggan (Customer)**:
   - Pengguna umum yang ingin mencari, memfilter, dan membeli sepatu sesuai kategori (Men, Women, Unisex, Kids) dan segmen (Shoes, Apparel, Accessories).
   - Menikmati fitur wishlist, ulasan produk terverifikasi, keranjang belanja real-time, dan pelacakan status pesanan secara mandiri.
2. **Administrator Toko (Store Admin)**:
   - Pengelola operasional toko yang memiliki akses ke dashboard analitik, manajemen produk (CRUD & manajemen stok varian ukuran), upload media ke cloud storage, serta kontrol siklus hidup status pesanan pelanggan.

### 1.4 Nilai Unggulan (Unique Selling Points)
* **Real-Time Size-Based Inventory**: Pencatatan stok multi-dimensi per ukuran yang mencegah terjadinya *overselling*.
* **Automated Secure Checkout**: Pengguna mendapatkan Snap URL Midtrans langsung tanpa perlu konfirmasi manual.
* **Dual Authentication Flow**: Mendukung autentikasi lokal via email + kata sandi (dengan enkripsi Bcrypt) dan Social Login melalui Google OAuth 2.0.
* **End-to-End Type Safety**: Dari skema database Prisma, Zod validator, DTO TypeScript, hingga komponen React Client/Server.
* **Cloud-First Media Storage**: Integrasi langsung dengan Supabase Storage untuk penyimpanan foto produk beresolusi tinggi dengan CDN bawaan.
* **Self-Healing Password Recovery**: Fitur lupa kata sandi otomatis dengan token berbatas waktu (*expiry token*) via pengiriman email transaksional Nodemailer.

---

## 🎯 2. Tujuan Proyek

### 2.1 Tujuan Fungsional & Bisnis
* **Mempermudah Transaksi Penjualan**: Menyediakan alur belanja yang ringkas, dari penemuan produk (*discovery*), seleksi ukuran, keranjang belanja, hingga penyelesaian pembayaran dalam hitungan detik.
* **Otomasi Manajemen Pesanan**: Memangkas waktu verifikasi pembayaran dari menit/jam menjadi instan secara *real-time* melalui webhook notification Midtrans.
* **Transparansi Status Bagi Pelanggan**: Menyediakan halaman khusus *Order Tracking* (`/status-pesanan` dan `/order`) agar pembeli dapat memantau kapan pesanan diproses, dikirim, hingga sampai ke tujuan.
* **Pemberdayaan Pengambilan Keputusan Admin**: Menyediakan dashboard analitik yang menampilkan ringkasan omzet penjualan, total pesanan aktif, dan ketersediaan stok kritis.

### 2.2 Tujuan Teknis & Arsitektur
* **Penerapan Clean Layered Architecture**: Memisahkan tanggung jawab kode (*Separation of Concerns*) menjadi lapisan Controller, Service, Repository, dan Validator pada Next.js API Routes.
* **Pencegahan Race Condition pada Stok**: Mengimplementasikan validasi ketersediaan stok yang ketat di level transaksi sebelum order dibuat.
* **Optimasi Performa Web Modern**: Memanfaatkan keunggulan Next.js App Router (Server-Side Rendering, Static Site Generation, Server Components, dan dynamic bundle splitting) untuk menjamin nilai Core Web Vitals yang optimal.
* **Standarisasi Penanganan Error (Centralized Error Handling)**: Menggunakan kelas turunan `AppError` (seperti `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`) untuk menghasilkan response JSON konsisten dengan status HTTP yang tepat.

### 2.3 Indikator Keberhasilan
| Kriteria | Indikator Target |
| :--- | :--- |
| **Kestabilan Kode** | 0 TypeScript Error (`tsc --noEmit`), Build Production sukses tanpa warning kritis |
| **Keamanan** | Seluruh endpoint sensitif dilindungi JWT Middleware & RBAC (Role-Based Access Control) |
| **Integritas Data** | Tidak ada inkonsistensi stok saat checkout konkuren |
| **Skalabilitas** | Mudah memperluas fitur (contoh: integrasi kurir pengiriman seperti RajaOngkir) tanpa merombak ulang controller atau repository |

---

## 🛠 3. Teknologi & Ekosistem (Tech Stack)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHOES4US TECH STACK                             │
├────────────────────────────────┬───────────────────────────────────────┤
│ Frontend Presentation          │ Next.js 16 (App Router), React 19     │
│ Styling & Icons                │ Tailwind CSS 3.3, Lucide, React Icons │
│ Language                       │ TypeScript 5.x                        │
│ Backend API                    │ Next.js Route Handlers (Edge/Node.js) │
│ Database ORM                   │ Prisma ORM 6.16.2                     │
│ Database Provider              │ PostgreSQL (Hosted on Neon DB Server) │
│ Cloud Media Storage            │ Supabase Storage (S3-compatible)      │
│ Payment Gateway                │ Midtrans Snap Engine v1.4             │
│ Authentication & Security      │ JWT (jose & jsonwebtoken), BcryptJS   │
│ Social Identity Provider       │ Google OAuth 2.0 (google-auth-library)│
│ Email Transaksional            │ Nodemailer (SMTP Service)             │
│ Validasi Skema                 │ Zod v4                                │
│ Notifikasi UI & Feedback       │ React Hot Toast, React Skeleton       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Rincian Dependensi Utama:
* **Core**: `next@16.2.6`, `react@19.1.0`, `react-dom@19.1.0`, `typescript@^5`
* **Data Access**: `@prisma/client@^6.16.2`, `prisma@^6.16.2`
* **Security & Auth**: `jose@^6.1.0`, `jsonwebtoken@^9.0.2`, `bcryptjs@^3.0.2`, `google-auth-library@^10.4.0`
* **Third-Party Integration**: `midtrans-client@^1.4.3`, `@supabase/supabase-js@^2.75.0`, `nodemailer@^7.0.9`
* **Utility & Validation**: `zod@^4.1.12`, `date-fns@^4.1.0`, `uuid@^13.0.0`

---

## 🏛 4. Arsitektur Sistem (Layered Architecture)

### 4.1 Pola Arsitektur
Shoes4Us mengadopsi prinsip **Layered Clean Architecture** pada backend API untuk menjamin kode terstruktur, modular, mudah diuji (*testable*), dan mudah dipelihara (*maintainable*).

```
                      [ Client / Browser Request ]
                                   │
                                   ▼
                      [ Next.js Middleware ]
                    (JWT Auth & Role Guard)
                                   │
                                   ▼
             [ API Route Handler / Presentation Layer ]
                       (src/app/api/.../route.ts)
                                   │
                                   ▼
                         [ Controller Layer ]
                     (src/layers/controllers/)
             - Menangani HTTP Request / Response
             - Memanggil Validator untuk parsing input
             - Menentukan HTTP Status Code
                                   │
                                   ▼
                          [ Validator Layer ]
                     (src/layers/validators/)
             - Validasi skema Zod (tipe data, format)
             - Sanitasi data masukan dari client
                                   │
                                   ▼
                          [ Service Layer ]
                      (src/layers/services/)
             - Logika Bisnis Inti (Business Logic)
             - Kalkulasi harga, validasi stok produk
             - Integrasi eksternal (Midtrans, Email, dll)
                                   │
                                   ▼
                         [ Repository Layer ]
                    (src/layers/repositories/)
             - Lapisan Akses Data (Data Access Layer)
             - Komunikasi langsung dengan Prisma ORM
             - Abstraksi query SQL / database
                                   │
                                   ▼
                   [ Database (PostgreSQL / Neon) ]
```

### 4.2 Diagram Alur Permintaan (Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna / Browser
    participant MW as Middleware (Auth/Role)
    participant Route as Next.js Route Handler
    participant Ctrl as Controller
    participant Val as Zod Validator
    participant Svc as Service
    participant Repo as Repository
    participant DB as PostgreSQL (Prisma)

    User->>MW: HTTP Request + Bearer Token / Cookie
    alt Token Tidak Valid / Expired
        MW-->>User: 401 Unauthorized
    else Token Valid
        MW->>Route: Next() + Inject x-user-id & x-user-role
        Route->>Ctrl: Panggil method Controller
        Ctrl->>Val: Validasi Body / Query Params
        alt Validasi Gagal
            Val-->>Ctrl: ValidationError
            Ctrl-->>User: 400 Bad Request
        else Validasi Berhasil
            Ctrl->>Svc: Eksekusi Operasi Bisnis
            Svc->>Repo: Request Data / Mutasi DB
            Repo->>DB: Prisma Client Query
            DB-->>Repo: Hasil Data
            Repo-->>Svc: Domain Model
            Svc-->>Ctrl: Service Result
            Ctrl-->>User: 200/201 JSON Response ({ success: true, data: ... })
        end
    end
```

### 4.3 Struktur Direktori Proyek

```
Shoes4Us E-Commerce Platform/
├── prisma/
│   ├── schema.prisma            # Skema pemodelan database & relasi tabel
│   └── migrations/              # Berkas riwayat migrasi database
├── public/                      # Asset statis publik (logo, icon, placeholder)
├── scripts/
│   └── prisma-local.mjs         # Script pembantu automasi Prisma lingkungan lokal
├── src/
│   ├── app/                     # Next.js App Router (Halaman & Endpoint API)
│   │   ├── admin/               # Halaman portal Admin (Dashboard, Kelola Produk)
│   │   │   ├── dashboard/       # Ringkasan analitik & kontrol pesanan
│   │   │   └── product/         # Daftar produk & form tambah/edit produk
│   │   ├── api/                 # REST API Endpoints
│   │   │   ├── admin/           # Endpoint operasional admin
│   │   │   ├── auth/            # Login, register, google oauth, forgot/reset password
│   │   │   ├── cart/            # Operasi keranjang belanja pengguna
│   │   │   ├── categories/      # Query kategori produk
│   │   │   ├── checkout/        # Finalisasi checkout & pembuatan order
│   │   │   ├── orders/          # Query & tracking pesanan
│   │   │   ├── payment/         # Integrasi & webhook notifikasi Midtrans
│   │   │   ├── products/        # Query katalog & filter produk publik
│   │   │   ├── reviews/         # Ulasan & penilaian produk
│   │   │   ├── users/           # Manajemen profil akun pengguna
│   │   │   └── wishlist/        # Operasi daftar keinginan pengguna
│   │   ├── cart/                # Halaman keranjang belanja
│   │   ├── checkout/            # Halaman pengisian pengiriman & pembayaran
│   │   ├── forgot-password/     # Halaman formulir minta reset kata sandi
│   │   ├── login/               # Halaman autentikasi login
│   │   ├── order/               # Halaman riwayat order pengguna
│   │   ├── payment/             # Halaman konfirmasi pembayaran Midtrans
│   │   ├── product/             # Halaman katalog & detail produk ([id])
│   │   ├── profile/             # Halaman profil & informasi akun
│   │   ├── register/            # Halaman pendaftaran pengguna baru
│   │   ├── reset-password/      # Halaman pembuatan kata sandi baru via token
│   │   ├── status-pesanan/      # Halaman pelacakan pesanan publik/terbuka
│   │   ├── wishlist/            # Halaman daftar produk favorit
│   │   ├── globals.css          # Styling Tailwind global
│   │   ├── layout.tsx           # Root layout aplikasi (Navbar, Footer, Providers)
│   │   ├── loading.tsx          # UI indikator loading global
│   │   ├── not-found.tsx        # UI penanganan halaman 404 modern
│   │   └── page.tsx             # Homepage aplikasi (Hero, Featured, Category)
│   ├── components/              # Komponen React Modular
│   │   ├── AdminDashboard.tsx   # Komponen utama panel admin
│   │   ├── AuthNavbar.tsx       # Navbar khusus alur autentikasi
│   │   ├── AuthProvider.tsx     # Context provider sesi & state pengguna
│   │   ├── CartContext.tsx      # Context provider state keranjang belanja
│   │   ├── CategoryShowcase.tsx # Komponen showcase kategori produk
│   │   ├── ErrorBoundary.tsx    # Penangkap error render sisi klien
│   │   ├── FeaturedProducts.tsx # Slider/grid produk unggulan
│   │   ├── Footer.tsx           # Footer informasi toko & navigasi
│   │   ├── GlobalSearch.tsx     # Modal/search bar pencarian produk global
│   │   ├── HeroCarousel.tsx     # Banner slider hero dinamis
│   │   ├── Navbar.tsx           # Navigasi utama dengan cart counter & user badge
│   │   ├── OrderTracking.tsx    # Komponen visualisasi timeline status pesanan
│   │   ├── ProductCard.tsx      # Kartu preview produk
│   │   ├── ProductFilters.tsx   # Sidebar filter (kategori, harga, ukuran, segmen)
│   │   ├── ReviewForm.tsx       # Formulir ulasan produk
│   │   ├── ReviewList.tsx       # Tampilan ulasan & rating bintang
│   │   ├── WishlistButton.tsx   # Tombol toggle wishlist interaktif
│   │   └── WishlistContext.tsx  # Context provider state wishlist
│   ├── exceptions/              # Definisi Error & Centralized Handler
│   │   ├── AppError.ts          # Base class untuk seluruh custom exception
│   │   ├── AuthError.ts         # Exception autentikasi
│   │   ├── ConflictError.ts     # Exception konflik data (HTTP 409)
│   │   ├── ForbiddenError.ts    # Exception hak akses terlarang (HTTP 403)
│   │   ├── NotFoundError.ts     # Exception data tidak ditemukan (HTTP 404)
│   │   ├── UnauthorizedError.ts # Exception token/sesi tidak valid (HTTP 401)
│   │   ├── ValidationError.ts   # Exception kegagalan validasi input (HTTP 400)
│   │   └── handlerError.ts      # Router error parser menjadi HTTP NextResponse
│   ├── layers/                  # Lapisan Logika Sistem (Clean Architecture)
│   │   ├── controllers/         # Lapisan Controller
│   │   ├── repositories/        # Lapisan Repository (Query Prisma)
│   │   ├── services/            # Lapisan Service (Logika Bisnis)
│   │   └── validators/          # Lapisan Validator (Zod Schemas)
│   ├── lib/                     # Inisialisasi Library & Helper Klien Pihak Ketiga
│   │   ├── BcryptUtil.ts        # Hashing & komparasi password aman
│   │   ├── auth.ts              # Utilitas pembuatan & verifikasi JWT
│   │   ├── midtrans.ts          # Inisialisasi Midtrans Snap SDK
│   │   ├── password-strength.ts # Kalkulator kekuatan kata sandi pengguna
│   │   ├── prisma.ts            # Prisma Client Singleton
│   │   ├── sendEmail.ts         # Konfigurasi Nodemailer transporter
│   │   ├── supabase.ts          # Inisialisasi Supabase JS Client
│   │   └── uploadSupabase.ts    # Helper upload gambar produk ke Supabase bucket
│   ├── middleware.ts            # Next.js Route Guard Middleware (JWT & RBAC)
│   ├── types/                   # Definisi Type & Interface TypeScript
│   └── utils/                   # Utilitas respons API & sanitasi
├── .env                         # Berkas variabel lingkungan (Credentials)
├── next.config.ts               # Konfigurasi Next.js Compiler & Image Domains
├── package.json                 # Manifest dependensi & script proyek
├── tailwind.config.ts           # Konfigurasi Tailwind CSS theme & plugin
└── tsconfig.json                # Konfigurasi TypeScript Compiler
```

---

## 🚀 5. Fitur-Fitur Sistem (Feature Modules)

### 5.1 Modul Pengguna (Customer Experience)
* **Katalog & Navigasi Produk Dinamis**:
  - Banner interaktif pada beranda (*Hero Carousel*).
  - Tampilan *Featured Products*, *New Arrivals*, *Exclusive Editions*, dan *Sale Items*.
  - Pemfilteran multi-kriteria: Kategori, Segmen (*Shoes, Apparel, Accessories*), Audiens (*Men, Women, Unisex, Kids*), rentang harga, dan ketersediaan ukuran.
  - Pencarian global (*Global Search*) dengan penanganan respons instan.
* **Halaman Detail Produk Interaktif**:
  - Galeri visual produk beresolusi tinggi.
  - Seleksi varian ukuran sepatu dengan indikator stok dinamis secara *real-time*.
  - Informasi spesifikasi produk lengkap, brand, segmen, dan kategori.
  - Penilaian bintang (*Star Rating*) dan daftar ulasan pelanggan terverifikasi.
* **Keranjang Belanja (Smart Cart)**:
  - Menyimpan item per varian ukuran spesifik.
  - Menghitung subtotal secara otomatis.
  - Sinkronisasi instan dengan state server saat terjadi perubahan kuantitas.
  - Validasi batas stok agar kuantitas tidak melebihi stok fisik yang tersedia.
* **Wishlist (Daftar Keinginan)**:
  - Pelanggan dapat menandai produk favorit cukup dengan satu klik.
  - Sinkronisasi wishlist dengan basis data pengguna terotentikasi.
* **Sistem Autentikasi Komprehensif**:
  - Registrasi akun baru dengan validasi format email dan pengukur kekuatan kata sandi (*Password Strength Meter*).
  - Login berbasis email & password terenkripsi.
  - Social Login instan menggunakan **Google Sign-In**.
  - Fitur **Lupa Kata Sandi**: Pengiriman token reset kata sandi ke inbox email pengguna melalui SMTP Nodemailer dengan masa kedaluwarsa.
* **Manajemen Profil & Riwayat Pesanan**:
  - Memperbarui informasi nama, alamat pengiriman default, nomor telepon, dan foto profil.
  - Melihat daftar seluruh transaksi pesanan masa lalu dan status terkini.
* **Pelacakan Pesanan Terbuka (Public Order Tracking)**:
  - Pelanggan dapat memantau perjalanan paket pesanan menggunakan nomor order (`orderNumber`).

### 5.2 Modul Transaksi & Pembayaran
* **Checkout Terintegrasi**:
  - Formulir informasi pengiriman (Alamat, Kota, Kode Pos, Nomor Kontak).
  - Pengecekan ketersediaan stok kritis sebelum data pesanan dikunci (*atomic stock checking*).
* **Payment Gateway Midtrans Snap**:
  - Membuat transaksi token pembayaran Midtrans Snap secara otomatis saat order dibuat.
  - Mendukung metode pembayaran beragam:
    - QRIS (GoPay, ShopeePay, Dana, LinkAja).
    - Bank Virtual Account (BCA, Mandiri, BNI, BRI, Permata).
    - Kartu Kredit / Debit.
  - Redirect otomatis ke halaman status setelah pembayaran berhasil.
* **Webhook Notifikasi Otomatis (`/api/payment/notification`)**:
  - Menerima webhook langsung dari server Midtrans.
  - Otomatis mengubah status order dari `PENDING` menjadi `PAID` begitu dana terkonfirmasi.

### 5.3 Modul Administrator (Admin Portal)
* **Dashboard Metrik & Analitik**:
  - Ringkasan total pendapatan (*revenue*).
  - Total transaksi pesanan yang berhasil diproses.
  - Jumlah total produk terdaftar dan peringatan stok menipis (*low stock alert*).
* **Manajemen Produk Lengkap (CRUD Product)**:
  - Tambah produk baru dengan integrasi upload gambar langsung ke Supabase Storage.
  - Pengaturan multi-varian ukuran (misal: Size 38, 39, 40, 41, 42, 43) beserta alokasi kuantitas stok masing-masing.
  - Menandai produk sebagai *New Arrival*, *Exclusive*, *Coming Soon*, atau *On Sale*.
  - Mengubah informasi produk dan menghapus produk lama.
* **Manajemen Pesanan Toko (Order Management)**:
  - Melihat seluruh pesanan masuk dari semua pelanggan.
  - Memfilter pesanan berdasarkan status: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `PAID`, `CANCELLED`.
  - Mengubah status pesanan secara manual (misal: memperbarui status menjadi `SHIPPED` setelah barang diserahkan ke ekspedisi).
  - Mengunduh atau mencetak ringkasan rincian pesanan.

---

## 🗄 6. Skema & Model Basis Data (Database Schema)

### 6.1 Diagram Relasi Entitas (ERD)

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o| Cart : "owns"
    User ||--o{ Order : "places"
    User ||--o{ Wishlist : "saves"
    User ||--o{ Review : "writes"
    User ||--o{ PasswordResetToken : "requests"

    Category ||--o{ Product : "categorizes"

    Product ||--o{ ProductSize : "has variants"
    Product ||--o{ CartItem : "stored in"
    Product ||--o{ OrderItem : "ordered in"
    Product ||--o{ Wishlist : "bookmarked by"
    Product ||--o{ Review : "evaluated by"

    Cart ||--o{ CartItem : "contains"
    Order ||--o{ OrderItem : "composed of"

    User {
        String id PK
        String email UK
        String password
        String name
        UserRole role
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String image
    }

    Product {
        String id PK
        String name
        String slug UK
        String description
        Decimal price
        Int stock
        String imageUrl
        String categoryId FK
        String brand
        ProductSegment segment
        ProductAudience audience
        Boolean isNewArrival
        Boolean isExclusive
        Boolean isComingSoon
        Boolean isSale
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    ProductSize {
        String id PK
        String productId FK
        String size
        Int stock
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name UK
        String slug UK
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Cart {
        String id PK
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    CartItem {
        String id PK
        String cartId FK
        String productId FK
        Int quantity
        Decimal priceSnap
        String size
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        String id PK
        String orderNumber
        String userId FK
        OrderStatus status
        Float totalAmount
        String shippingAddress
        String shippingCity
        String shippingPostalCode
        String shippingPhone
        String paymentMethod
        String paymentUrl
        DateTime createdAt
        DateTime updatedAt
    }

    OrderItem {
        String id PK
        String orderId FK
        String productId FK
        Int quantity
        Float price
        String size
    }

    Wishlist {
        String id PK
        String userId FK
        String productId FK
        DateTime createdAt
    }

    PasswordResetToken {
        String id PK
        String token UK
        String userId FK
        DateTime expiresAt
        DateTime createdAt
    }

    Review {
        String id PK
        String productId FK
        String userId FK
        Int rating
        String title
        String comment
        Boolean verified
        Int helpful
        DateTime createdAt
        DateTime updatedAt
    }
```

### 6.2 Rincian Model Prisma
1. **User (`users`)**: Menyimpan data identitas kredensial pelanggan dan admin, peran pengguna (`role`), serta status keaktifan akun.
2. **Account (`accounts`)**: Mendukung autentikasi pihak ketiga (*NextAuth/Google OAuth provider tokens*).
3. **Session (`Session`)**: Mengelola token sesi pengguna terotentikasi.
4. **Category (`categories`)**: Pengelompokan produk (contoh: *Sneakers, Running Shoes, Formal, Sandals*).
5. **Product (`products`)**: Entitas master katalog yang menyimpan nama, slug SEO, harga, deskripsi, gambar, kategori, brand, segment, audiens, dan status promosi.
6. **ProductSize (`product_sizes`)**: Tabel relasional varian ukuran produk. Menyimpan stok fisik per ukuran (misal: Size 42 stok 5, Size 43 stok 12).
7. **Cart (`carts`) & CartItem (`cart_items`)**: Keranjang belanja sementara pengguna yang menyimpan snapshot harga saat dimasukkan (`priceSnap`), kuantitas, dan ukuran yang dipilih.
8. **Order (`orders`) & OrderItem (`order_items`)**: Data pesanan permanen pelanggan yang mencatat nomor order unik, status transaksi, total biaya, alamat pengiriman, dan link transaksi Midtrans Snap.
9. **Wishlist (`wishlists`)**: Tabel relasi penanda produk yang disimpan pengguna untuk dibeli di kemudian hari.
10. **PasswordResetToken (`password_reset_tokens`)**: Token acak yang digenerasi saat pengguna meminta reset password, lengkap dengan waktu kedaluwarsa (`expiresAt`).
11. **Review (`reviews`)**: Ulasan teks dan penilaian bintang (1-5) dari pembeli untuk suatu produk.

### 6.3 Tipe Enumerasi (Enums)
* **`UserRole`**:
  - `USER`: Pelanggan biasa (dapat berbelanja, kelola wishlist, riwayat order).
  - `ADMIN`: Administrator toko (akses penuh ke portal dashboard, produk, dan pesanan).
* **`OrderStatus`**:
  - `PENDING`: Menunggu pembayaran dari pelanggan.
  - `PAID`: Pembayaran berhasil diverifikasi.
  - `PROCESSING`: Barang sedang dikemas oleh toko.
  - `SHIPPED`: Barang telah dikirim melalui kurir ekspedisi.
  - `DELIVERED`: Barang telah diterima oleh pelanggan.
  - `CANCELLED`: Pesanan dibatalkan (kadaluwarsa atau stok batal).
* **`ProductAudience`**:
  - `UNISEX`, `MEN`, `WOMEN`, `KIDS`.
* **`ProductSegment`**:
  - `SHOES`, `APPAREL`, `ACCESSORIES`.

---

## 📡 7. Katalog Endpoint API (API Reference)

Semua endpoint berbasis JSON dan mengembalikan struktur seragam:
```json
{
  "success": true,
  "message": "Deskripsi pesan",
  "data": { ... }
}
```

### 7.1 Autentikasi (`/api/auth`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Mendaftarkan akun pelanggan baru |
| `POST` | `/api/auth/login` | Publik | Autentikasi dengan email & password, mengembalikan JWT |
| `POST` | `/api/auth/google` | Publik | Autentikasi cepat via Google OAuth token |
| `POST` | `/api/auth/forgot-password` | Publik | Meminta tautan/token pemulihan kata sandi via email |
| `POST` | `/api/auth/reset-password` | Publik | Mengubah kata sandi baru menggunakan token valid |

### 7.2 Produk & Kategori (`/api/products` & `/api/categories`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Publik | Mendapatkan katalog produk (mendukung pagination, search, filter) |
| `GET` | `/api/products/[id]` | Publik | Mengambil detail 1 produk lengkap dengan stok varian ukuran |
| `POST` | `/api/products` | Admin | Menambahkan produk baru (beserta stok varian ukuran) |
| `PUT` | `/api/products/[id]` | Admin | Memperbarui data produk dan stok ukuran |
| `DELETE` | `/api/products/[id]` | Admin | Menghapus produk dari sistem |
| `GET` | `/api/categories` | Publik | Mengambil daftar seluruh kategori produk aktif |

### 7.3 Keranjang Belanja (`/api/cart`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | User | Mengambil seluruh item di keranjang belanja pengguna |
| `POST` | `/api/cart` | User | Menambahkan item ke keranjang (validasi produk, size, qty) |
| `PUT` | `/api/cart/[id]` | User | Mengubah jumlah (quantity) item di dalam keranjang |
| `DELETE` | `/api/cart/[id]` | User | Menghapus item tertentu dari keranjang |
| `DELETE` | `/api/cart` | User | Mengosongkan keranjang belanja |

### 7.4 Checkout, Pesanan & Pembayaran (`/api/checkout`, `/api/orders`, `/api/payment`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/checkout` | User | Membuat order baru, mengunci stok, dan menghasilkan Midtrans token |
| `GET` | `/api/orders` | User/Admin | Mengambil daftar pesanan (User: riwayat sendiri; Admin: scope=all) |
| `GET` | `/api/orders/[id]` | User/Admin | Mengambil detail spesifik satu pesanan |
| `PUT` | `/api/orders/[id]` | Admin | Memperbarui status pesanan (`OrderStatus`) |
| `POST` | `/api/payment/notification` | Publik (Midtrans) | Webhook handler notifikasi pembayaran otomatis dari Midtrans |

### 7.5 Wishlist & Ulasan (`/api/wishlist` & `/api/reviews`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/wishlist` | User | Mengambil daftar produk yang disimpan pengguna |
| `POST` | `/api/wishlist` | User | Menambahkan produk ke wishlist pengguna |
| `DELETE` | `/api/wishlist/[productId]` | User | Menghapus produk dari wishlist |
| `GET` | `/api/reviews` | Publik | Mengambil ulasan produk berdasarkan `productId` |
| `POST` | `/api/reviews` | User | Menulis ulasan dan memberikan rating produk yang dibeli |

---

## 🔄 8. Alur Bisnis Utama (Core Workflows)

### 8.1 Alur Checkout dan Pembayaran Midtrans

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Pelanggan
    participant Frontend as Frontend Next.js
    participant OrderCtrl as Order / Checkout API
    participant OrderSvc as OrderService
    participant DB as PostgreSQL
    participant Midtrans as Midtrans Snap Engine

    Customer->>Frontend: Klik "Checkout" dari Halaman Keranjang
    Frontend->>Customer: Tampilkan Formulir Pengiriman
    Customer->>Frontend: Isi Alamat, Kota, Telepon & Klik "Bayar Sekarang"
    Frontend->>OrderCtrl: POST /api/checkout (Payload Alamat & Cart Items)
    OrderCtrl->>OrderSvc: createOrder(userId, shippingDetails)
    OrderSvc->>DB: Validasi Stok Tiap Item Produk & Size
    alt Stok Tidak Mencukupi
        OrderSvc-->>Frontend: 400 Bad Request ("Stok size X tidak mencukupi")
    else Stok Tersedia
        OrderSvc->>DB: Buat Record Order (Status: PENDING)
        OrderSvc->>DB: Buat OrderItem & Kurangi Stok Fisik
        OrderSvc->>Midtrans: Request Snap Token & Payment URL (orderNumber, totalAmount)
        Midtrans-->>OrderSvc: Return Snap Token & Redirect URL
        OrderSvc->>DB: Update paymentUrl di Record Order
        OrderSvc-->>Frontend: 201 Created (snapToken, paymentUrl, orderNumber)
        Frontend->>Customer: Buka Pop-up Snap Midtrans / Redirect
        Customer->>Midtrans: Selesaikan Pembayaran (QRIS / VA / CC)
        Midtrans->>Frontend: Callback Status Pembayaran Sukses
        Midtrans->>OrderCtrl: POST /api/payment/notification (Webhook)
        OrderCtrl->>DB: Update Status Order menjadi PAID
        Frontend->>Customer: Arahkan ke Halaman Konfirmasi Pesanan Sukses
    end
```

### 8.2 Alur Reset Kata Sandi Pengguna

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant Frontend as Halaman Lupa Password
    participant API as /api/auth/forgot-password
    participant DB as Basis Data (Prisma)
    participant SMTP as Layanan Email (Nodemailer)

    User->>Frontend: Masukkan Email Akun & Klik "Kirim Tautan"
    Frontend->>API: POST /api/auth/forgot-password { email }
    API->>DB: Cek Keberadaan User
    alt User Tidak Ditemukan
        API-->>Frontend: 200 OK (Pesan umum demi keamanan data)
    else User Ditemukan
        API->>DB: Simpan PasswordResetToken (Token unik, Expire: 1 Jam)
        API->>SMTP: Kirim Email berisi tautan (/reset-password?token=XYZ)
        SMTP-->>User: Email masuk ke inbox pengguna
        API-->>Frontend: 200 OK ("Instruksi reset password terkirim")
    end
    User->>Frontend: Klik tautan di email & input kata sandi baru
    Frontend->>API: POST /api/auth/reset-password { token, newPassword }
    API->>DB: Validasi token & cek apakah waktu belum expired
    alt Token Tidak Valid / Expired
        API-->>Frontend: 400 Bad Request ("Token tidak valid atau kedaluwarsa")
    else Token Valid
        API->>DB: Hash password baru via Bcrypt & update field password User
        API->>DB: Hapus token yang telah digunakan
        API-->>Frontend: 200 OK ("Kata sandi berhasil diperbarui")
        Frontend->>User: Redirect ke Halaman Login
    end
```

---

## 💻 9. Panduan Instalasi & Menjalankan Proyek

### 9.1 Prasyarat Sistem
Pastikan perangkat pengembangan Anda telah terpasang:
* **Node.js**: Versi `20.9.0` atau yang lebih baru (disarankan LTS).
* **Package Manager**: `npm`, `yarn`, `pnpm`, atau `bun`.
* **Database PostgreSQL**: Akses ke instans PostgreSQL lokal atau cloud provider (seperti **Neon DB** / Supabase PostgreSQL).
* **Git**: Untuk manajemen kontrol versi kode.

### 9.2 Konfigurasi Environment Variables (`.env`)
Buat berkas `.env` di direktori akar proyek dengan menyalin format konfigurasi berikut:

```env
# Koneksi Database PostgreSQL (Wajib)
# Contoh menggunakan Neon DB atau PostgreSQL Lokal
DATABASE_URL="postgresql://username:password@ep-ancient-xxx.neon.tech/Shoes4Us?sslmode=require"
DATABASE_URL_LOCAL="postgresql://admin:1234@localhost:5432/Shoes4Us?schema=public"

# Kunci Rahasia JWT (Wajib diisi string acak aman untuk produksi)
JWT_SECRET="kunci_rahasia_jwt_sangat_aman_shoes4us_2026"

# Kredensial Google OAuth 2.0 (Opsional untuk Social Login)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Kredensial Supabase Storage (Untuk Upload Foto Produk)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_PUBLIC_BUCKET="shoes4us-products"

# Kredensial Payment Gateway Midtrans (Sandbox / Production)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxxxx"
MIDTRANS_PRODUCTION="false"

# Konfigurasi SMTP Email (Untuk Lupa & Reset Password via Nodemailer)
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="587"
MAIL_USER="toko.shoes4us@gmail.com"
MAIL_PASS="aplikasi_password_gmail_16_karakter"
```

### 9.3 Setup Database & Migrasi Prisma
Jalankan perintah berikut untuk menginisialisasi Prisma Client dan menyinkronkan skema tabel ke database:

```bash
# 1. Install seluruh dependensi proyek
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Sinkronisasi skema ke database (Pengembangan cepat)
npx prisma db push

# Atau lakukan migrasi formal:
npx prisma migrate dev --name init_schema
```

> [!TIP]
> Anda dapat membuka antarmuka visual basis data menggunakan Prisma Studio dengan perintah:
> ```bash
> npx prisma studio
> ```

### 9.4 Menjalankan Server Development
Jalankan server pengembangan lokal:

```bash
npm run dev
```

Buka peramban (browser) Anda dan kunjungi:
👉 [http://localhost:3000](http://localhost:3000)

### 9.5 Membangun Versi Production (Build)
Sebelum melakukan *deployment* ke server produksi (misal: Vercel, VPS, atau AWS), pastikan verifikasi tipe dan optimasi build berhasil tanpa kendala:

```bash
# Verifikasi tipe TypeScript
npx tsc --noEmit

# Menjalankan build produksi Next.js
npm run build

# Menjalankan bundle server hasil build
npm start
```

---

## 🛡 10. Keamanan & Praktik Terbaik (Security & Best Practices)

1. **Enkripsi Kredensial Kata Sandi**:
   - Seluruh kata sandi pengguna di-*hash* menggunakan algoritma satu arah **Bcrypt** dengan salt rounds memadai sebelum disimpan ke dalam database.
2. **Perlindungan Rute Terpusat (Route Guard Middleware)**:
   - File `src/middleware.ts` memeriksa token JWT pada *Header Authorization* maupun *Cookie*.
   - Mencegah akses ke endpoint keranjang, order, akun, dan admin dari pengguna yang tidak terautentikasi.
3. **Role-Based Access Control (RBAC)**:
   - Endpoint dan halaman `/admin/*` dipagari verifikasi peran khusus `role === "ADMIN"`. Pengguna biasa yang mencoba mengakses akan ditolak (*403 Forbidden* atau dialihkan).
4. **Validasi & Sanitasi Masukan (Strict Zod Schema Validation)**:
   - Seluruh data masukan dari klien divalidasi format dan batas nilainya melalui modul Validator untuk mencegah serangan *SQL Injection*, *Payload Manipulation*, maupun *Parameter Tampering*.
5. **Verifikasi Stok Transaksional**:
   - Pengecekan stok dilakukan secara atomik sebelum konfirmasi pesanan untuk menghindari skenario stok negatif saat terjadi pembelian bersamaan (*concurrency issue*).

---

## 🗺 11. Roadmap & Rencana Pengembangan Masa Depan

- [ ] **Integrasi Ongkos Kirim Real-Time (RajaOngkir / Kurir API)**: Perhitungan biaya pengiriman otomatis berdasarkan berat produk, kurir (JNE, SiCepat, J&T), dan alamat tujuan pelanggan.
- [ ] **Sistem Kupon & Diskon Promosi**: Fitur kode voucher promosi dengan potongan harga persentase atau nominal tetap.
- [ ] **Notifikasi Transaksi Real-Time via WhatsApp / SMS**: Integrasi gateway pesan singkat untuk mengirimkan resi pengiriman dan status pembayaran langsung ke ponsel pelanggan.
- [ ] **Fitur Rekomendasi Sepatu Berbasis AI**: Sistem rekomendasi produk pintar yang menganalisis preferensi belanja dan riwayat pencarian pelanggan.
- [ ] **Multi-Warehouse Inventory**: Dukungan pengelolaan stok sepatu di beberapa gudang cabang terpisah di berbagai kota.

---

<div align="center">
  <sub>Dikembangkan dengan bangga oleh Tim Pengembang Shoes4Us E-Commerce Platform © 2026. Seluruh hak cipta dilindungi.</sub>
</div>

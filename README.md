# Shoes4Us E-Commerce Platform

Shoes4Us adalah platform e-commerce sepatu modern yang telah dirombak dengan arsitektur **Monorepo**:
- **Frontend**: Single Page Application (SPA) berbasis **React (Vite) + React Router v7 + Tailwind CSS + TypeScript**.
- **Backend**: Dipersiapkan untuk layanan REST API performa tinggi menggunakan **Go (Golang)**. Semua kode backend lama (Prisma, controllers, services, dan lib) tersimpan aman di folder [`backend/reference/`](./backend/reference/) sebagai referensi.

---

## 📁 Struktur Monorepo

```text
Shoes4Us E-Commerce Platform/
├── backend/                  # Direktori Backend Go
│   ├── reference/            # Arsip referensi lengkap (Prisma schema, migration, layers TS)
│   └── README.md             # Panduan arsitektur Go, skema database, & spesifikasi REST API
├── frontend/                 # Frontend React (Vite SPA)
│   ├── public/               # Asset statis, logo, dan gambar produk
│   ├── src/
│   │   ├── components/       # UI components & layouts (Navbar, Footer, Modal, Card, dll.)
│   │   ├── constants/        # Konstanta statis navigasi & katalog produk
│   │   ├── context/          # State management (Auth, Cart, Wishlist)
│   │   ├── pages/            # Halaman aplikasi (Home, Product, Cart, Payment, Admin, dll.)
│   │   ├── services/         # REST API client & helpers
│   │   ├── types/            # TypeScript interfaces & types
│   │   ├── utils/            # Formatters, shipping address & password strength helpers
│   │   ├── App.tsx           # React Router v7 routes
│   │   └── main.tsx          # Vite root entry
│   ├── package.json
│   ├── vite.config.ts        # Konfigurasi Vite & proxy /api ke :8080
│   └── README.md
├── package.json              # Monorepo runner scripts
├── .gitignore                # Konfigurasi git ignore terpadu
└── README.md                 # Dokumentasi proyek utama
```

---

## 🚀 Panduan Menjalankan Frontend

Dari root direktori, Anda dapat menjalankan perintah berikut:

### 1. Mode Development
```bash
npm run dev:fe
```
Frontend akan berjalan di [http://localhost:3000](http://localhost:3000).  
Semua request ke `/api/*` secara otomatis diarahkan (proxy) ke server backend di `http://localhost:8080`.

### 2. Build Produksi
```bash
npm run build:fe
```
Hasil build statis akan tersimpan di dalam folder `frontend/dist/`.

### 3. Preview Hasil Build
```bash
npm run preview:fe
```

---

## 🛠️ Pengembangan Backend (Go) & Database

Backend dibangun dengan **Go 1.24/1.25** menggunakan arsitektur clean architecture (Chi Router, pgx connection pool, JWT authentication, PostgreSQL).

### Menjalankan Backend & Unit Test
```bash
# Menjalankan backend Go di port 8080
npm run dev:be

# Menjalankan Database Seeder (Membuat tabel & data awal)
npm run seed:be

# Menjalankan semua unit tests backend
npm run test:be
```

---

## 🐳 Deployment Produksi (Docker & Cloud)

Proyek ini telah siap untuk dideploy ke lingkungan produksi menggunakan **Docker Compose** atau layanan cloud PaaS (Vercel + Railway/Render + Supabase/Neon).

### Quick Start dengan Docker Compose
```bash
# 1. Salin template konfigurasi environment
cp .env.example .env

# 2. Jalankan seluruh container (PostgreSQL, Backend API, Frontend Nginx)
npm run docker:up

# 3. Jalankan migrasi tabel & seeder awal di dalam container
npm run docker:seed
```
Aplikasi langsung dapat diakses di `http://localhost`.

📖 **Panduan deployment lengkap, monitoring, backup, dan cloud PaaS:**  
👉 **Lihat [`DEPLOYMENT.md`](./DEPLOYMENT.md)**


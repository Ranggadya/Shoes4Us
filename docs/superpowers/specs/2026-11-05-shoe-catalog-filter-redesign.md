# Shoe Catalog Sidebar Filter Redesign (Design Spec)

**Date:** 2026-11-05  
**Scope Size:** Small-to-Medium Feature Enhancement (Backend Filter Extension + Frontend Sidebar Redesign)

## 1. Intent & Why
Halaman katalog **Shoes4Us** saat ini hanya menyediakan 3 kontrol filter sederhana (Kategori, Rentang Harga manual, dan Urutkan) dengan tampilan kartu polos. Untuk memberikan pengalaman belanja layaknya e-commerce sepatu profesional (seperti Nike / Foot Locker), kita akan merombak desain sidebar filter sebelah kiri menjadi **Gaya A (Clean Accordion & Size Matrix)** serta mengaktifkan filter spesifik sepatu yang krusial bagi pembeli—terutama **Ukuran Sepatu (EU Size)**, **Brand**, **Gender**, **Koleksi/Promo**, dan **Ketersediaan Stok**.

## 2. Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Menambahkan filter `size` (memverifikasi `stock > 0` pada tabel `product_sizes`) dan `inStock` (`p.stock > 0`) pada endpoint `GET /api/products` di Go backend.
  - Merombak `ProductFilters.tsx` dan `ProductListPage.tsx` dengan desain **Clean Accordion & Size Matrix** di sidebar kiri.
  - Menghadirkan **Active Filter Tags** (chip filter aktif yang bisa dihapus satu per satu atau `Hapus Semua`).
  - Menerapkan **Instant Filtering** yang tersinkronisasi langsung dengan URL query parameters (`useSearchParams`).
- **Non-Goals:**
  - Mengubah skema tabel database PostgreSQL (seluruh tabel `products`, `categories`, dan `product_sizes` sudah memiliki kolom yang dibutuhkan).
- **Anti-Goals:**
  - *Client-side filtering* yang hanya menyaring 20 item di halaman aktif dan merusak akurasi paginasi server.
  - Memaksa pengguna menekan tombol "Terapkan" berulang kali setiap kali memilih ukuran atau brand di layar desktop.

## 3. Constraints
- Wajib mempertahankan kompatibilitas penuh dengan kontrak API `GET /api/products` yang sudah ada.
- Query filter ukuran (`size`) di PostgreSQL harus menggunakan `EXISTS` subquery ke tabel `product_sizes` agar tidak menimbulkan duplikasi baris produk (*row multiplication*) saat produk memiliki banyak ukuran.

## 4. Approaches Considered
1. **Pendekatan 1 — Full Server-Side Filtering + Instant URL Sync (Dipilih):**
   - Menambahkan filter `size` dan `inStock` di SQL repository Go, serta menghubungkan seluruh filter (`category`, `brand`, `audience`, `collection`, `isSale`, `size`, `inStock`, `minPrice`, `maxPrice`, `sortBy`) langsung ke URL parameter React.
   - *Tradeoff:* Membutuhkan sedikit penambahan kode di backend Go (`product.go`, `product_repository.go`, `product_handler.go`), namun menjamin paginasi dan hasil pencarian 100% akurat.
2. **Pendekatan 2 — Client-Side Filtering di Frontend (Ditolak):**
   - Memfilter array produk di memori browser. Ditolak karena tidak akurat saat katalog memiliki lebih dari 1 halaman.

## 5. Design Decisions (Agreed with Partner)
- **Layout & Visual Style:** **Opsi A (Clean Accordion & Size Matrix)** tetap berada di sidebar kiri pada layar desktop (`lg:w-72`), dan dapat dibuka-tutup (drawer/panel) pada layar mobile.
- **Komponen Filter yang Ditampilkan:**
  1. **Header Filter & Active Tags:** Menampilkan jumlah filter aktif, tombol `Hapus Semua`, dan deretan tag filter aktif (`Size: 42 ✕`, `Nike ✕`, `Pria ✕`, dll.).
  2. **Urutkan Berdasarkan:** Dropdown modern (Terbaru, Harga: Rendah ke Tinggi, Harga: Tinggi ke Rendah, Nama: A–Z, Nama: Z–A).
  3. **Ukuran Sepatu (EU Size Grid):** Kotak grid 4 kolom (`36`, `37`, `38`, `39`, `40`, `41`, `42`, `43`, `44`, `45`).
  4. **Gender / Target Pengguna:** Pill interaktif (`Pria / MEN`, `Wanita / WOMEN`, `Unisex / UNISEX`, `Anak / KIDS`).
  5. **Kategori Sepatu:** Daftar kategori dinamis dari endpoint `/api/categories`.
  6. **Brand / Merek:** Daftar pilihan brand populer (Nike, Adidas, New Balance, Puma,Jordan, Vans, Converse, Asics, Reebok) yang dapat dipilih dengan cepat.
  7. **Koleksi & Status Stok:** Toggle cepat untuk *Sedang Diskon (`isSale`)*, *Rilisan Baru (`new-arrivals`)*, *Exclusive (`exclusive`)*, serta switch *Hanya Stok Tersedia (`inStock`)*.
  8. **Rentang Harga:** Chip cepat (`< Rp 1 Jt`, `Rp 1 – 2 Jt`, `> Rp 2 Jt`) ditambah input angka Min/Max manual.

## 6. Builder Decisions (Implementation Details)
- Klik pada Ukuran, Brand, Gender, Kategori, Koleksi, dan Preset Harga akan langsung memperbarui hasil secara instan.
- Untuk input ketik angka harga manual (Min/Max), perubahan diterapkan menggunakan *debounce* (400ms) atau saat menekan Enter/Blur agar tidak memicu request API setiap ketukan tombol angka.

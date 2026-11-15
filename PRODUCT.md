# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Pembeli B2C (Guest -> Member & Returning Customers):** Pencinta sneaker dan pembeli ritel yang menjelajah katalog, menyimpan wishlist, mengisi keranjang sebagai tamu (tersinkronisasi otomatis ke akun saat login), lalu melanjutkan checkout/pembayaran atau memantau pesanan.
- **Admin Toko Shoes4Us:** Pengelola katalog, stok per ukuran, kupon, dan pesanan yang masuk melalui pintu login yang sama (`/login`) menuju dashboard admin.

## Product Purpose

Platform e-commerce ritel sepatu (`Shoes4Us`) dengan inventaris ukuran real-time (US / EU), pencarian terkurasi berdasarkan merek/kategori/ukuran, keranjang belanja persisten (tamu dan terautentikasi), kode promo, serta pembayaran dan pelacakan pesanan terintegrasi. Keberhasilan berarti pembeli menyelesaikan transaksi dari penemuan produk hingga pembayaran tanpa kehilangan item atau konteks di batas autentikasi.

## Positioning

Sepatu 100% original dengan ketersediaan stok real-time per ukuran (US / EU), jaminan tukar ukuran 7 hari, serta sinkronisasi keranjang tamu ke akun secara otomatis saat login.

## Operating Context

- Bahasa antarmuka utama: Bahasa Indonesia (`<html lang="id">`).
- Skenario masuk utama di `/login`:
  1. Pembeli diarahkan dari `/cart`, `/wishlist`, atau `/payment` lewat `?redirect=...` untuk menyelesaikan checkout sambil menyinkronkan `shoes4us_guest_cart_v1`.
  2. Pembeli lama masuk langsung untuk melihat profil atau status pesanan.
  3. Admin masuk ke `/admin` lewat alur login yang sama.

## Capabilities and Constraints

- **Autentikasi yang tersedia saat ini:** Email & password melalui `AuthContext.login` (`POST /api/auth/login`), dilengkapi tautan `/forgot-password` dan `/register` (meneruskan `?redirect=...`).
- **Google OAuth belum terhubung ke backend:** Tombol "Login dengan Google" tetap dipertahankan interaktif dan jujur menampilkan toast informasi (`Integrasi Google OAuth belum tersedia`) sampai integrasi OAuth nyata dibangun.
- **Pengalihan aman (`?redirect=`):** Target pengalihan harus dibatasi ke rute internal yang valid agar aman dari open redirect.
- **Keterbatasan klaim:** Dilarang mengarang testimoni pelanggan, jumlah pembeli palsu, atau fitur login pihak ketiga yang belum berfungsi.

## Brand Commitments

- **Nama merek tunggal:** `Shoes4Us` (mempertahankan identitas editorial monokrom ritel yang telah diterapkan di storefront, Cart, dan Payment).
- **Aset merek tersedia:** Logo resmi di `/logo.jpg` (`frontend/public/logo.jpg`) dan PWA manifest di `/manifest.webmanifest`.

## Evidence on Hand

- Katalog fotografi sepatu & kategori nyata tersedia di `frontend/public/` (`/logo.jpg`, `/sepatu1.jpeg`–`/sepatu12.jpeg`, `/NB 1000 WHITE.webp`, `/shop-mens.jpg`, `/shop-womens.jpg`, `/shop-kids.jpg`).
- Aplikasi web dibangun dengan React 19, Vite, Tailwind CSS, dan backend Go + PostgreSQL.

## Product Principles

- **Kejujuran di atas dekorasi:** Hanya tampilkan status autentikasi, jaminan, dan kapabilitas yang benar-benar didukung sistem.
- **Kontinuitas funnel tanpa friksi:** Perpindahan dari eksplorasi katalog atau keranjang tamu ke `/login` lalu `/cart` atau `/payment` harus terasa satu merek dan tidak memutus niat belanja pengguna.
- **Kejelasan fokus tugas:** Setiap kontrol, validasi error, dan tautan pemulihan akun harus terbaca jelas pada satu pandang tanpa kebisingan visual.

# Shoes4Us - Backend (Go API Reference & Guide)

> **Catatan Penting**: Folder ini disiapkan untuk pengembangan backend menggunakan bahasa **Go (Golang)**. Semua kode backend Next.js lama telah dimigrasikan dan diarsipkan ke dalam folder `reference/` sebagai panduan referensi lengkap.

---

## 📁 Struktur Folder Backend yang Direkomendasikan (Go Standard Project Layout)

Ketika Anda mulai membuat backend Go, Anda dapat mengimplementasikannya dengan struktur standar seperti berikut:

```text
backend/
├── cmd/
│   └── api/
│       └── main.go              # Entry point aplikasi (server bootstrap)
├── internal/
│   ├── config/                  # Konfigurasi database, JWT, port dari .env
│   ├── domain/                  # Entitas / model data (User, Product, Cart, Order, dll.)
│   ├── repository/              # Query database (GORM / pgx / sqlx)
│   ├── service/                 # Business logic & validasi
│   ├── handler/                 # HTTP handlers / controllers (Gin / Fiber / Echo / Chi)
│   └── middleware/              # JWT Auth & CORS middleware
├── pkg/
│   ├── hash/                    # Bcrypt password hashing
│   └── token/                   # JWT generation & validation
├── reference/                   # Referensi kode lama Next.js (Prisma, Service, Controller, Lib)
│   ├── layers/                  # Controllers, Services, Repositories TypeScript
│   ├── lib/                     # Helpers (JWT, Supabase, hashing)
│   ├── prisma/                  # schema.prisma & SQL migrations
│   └── scripts/                 # Skrip migrasi lokal
├── go.mod
├── go.sum
└── README.md
```

---

## 🗄️ Referensi Skema Database

Skema database lengkap dari PostgreSQL dapat dilihat pada file:
👉 **[`reference/prisma/schema.prisma`](./reference/prisma/schema.prisma)**  
👉 **[`reference/prisma/migrations/`](./reference/prisma/migrations/)**

### Tabel Utama:
1. **`users`**: `id` (UUID), `email`, `password` (hashed), `name`, `role` (`USER` / `ADMIN`), `image`, `isActive`, timestamps.
2. **`products`**: `id` (UUID), `name`, `slug`, `description`, `price`, `stock`, `imageUrl`, `brand`, `categoryId`, `segment`, `audience`, timestamps.
3. **`product_sizes`**: `id`, `productId`, `size`, `stock`.
4. **`categories`**: `id`, `name`, `slug`, `isActive`, timestamps.
5. **`carts` & `cart_items`**: `id`, `userId`, relasi ke item belanja dengan `productId`, `size`, `quantity`.
6. **`orders` & `order_items`**: `id`, `userId`, `orderNumber`, `totalAmount`, `status` (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `PAID`), shipping info, payment method.
7. **`wishlists`**: `id`, `userId`, `productId`, timestamps.
8. **`reviews`**: `id`, `userId`, `productId`, `rating` (1-5), `comment`, timestamps.
9. **`password_reset_tokens`**: `id`, `email`, `token`, `expiresAt`.

---

## 🌐 Kontrak REST API (Dibutuhkan oleh Frontend React)

Frontend React (Vite) sudah dikonfigurasi untuk mem-proxy request `/api` ke **`http://localhost:8080`**.  
Pastikan server Go Anda berjalan di port **8080**.

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Mendaftarkan customer baru (`email`, `password`, `name`) | Tidak |
| `POST` | `/api/auth/login` | Login user, mengembalikan token JWT & data user | Tidak |
| `GET` | `/api/auth/me` | Mendapatkan data user yang sedang login via header Authorization | Ya (`Bearer <token>`) |
| `POST` | `/api/auth/forgot-password` | Kirim token/link reset password ke email | Tidak |
| `POST` | `/api/auth/reset-password` | Reset password dengan token valid | Tidak |

### 2. Products (`/api/products`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/products` | Filter & paginasi produk (`search`, `category`, `sortBy`, `page`, `limit`) | Tidak |
| `GET` | `/api/products/:id` | Detail produk berdasarkan UUID atau slug | Tidak |
| `POST` | `/api/products` | Tambah produk baru | Ya (`ADMIN`) |
| `PUT` | `/api/products/:id` | Update data produk & stok ukuran | Ya (`ADMIN`) |
| `DELETE` | `/api/products/:id` | Hapus produk | Ya (`ADMIN`) |

### 3. Categories (`/api/categories`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/categories` | Daftar semua kategori sepatu | Tidak |

### 4. Cart (`/api/cart`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/cart` | Mengambil isi keranjang belanja user | Ya |
| `POST` | `/api/cart` | Menambahkan item ke keranjang (`productId`, `quantity`, `size`) | Ya |
| `PATCH` | `/api/cart/:itemId` | Update quantity item di keranjang | Ya |
| `DELETE` | `/api/cart/:itemId` | Hapus satu item dari keranjang | Ya |
| `DELETE` | `/api/cart` | Kosongkan seluruh keranjang | Ya |

### 5. Wishlist (`/api/wishlist`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/wishlist` | Mengambil daftar produk wishlist user | Ya |
| `POST` | `/api/wishlist` | Toggle / Tambah produk ke wishlist (`productId`) | Ya |
| `DELETE` | `/api/wishlist/:productId` | Hapus produk dari wishlist | Ya |

### 6. Orders & Payment (`/api/orders`, `/api/payment`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/orders` | Riwayat pesanan user (atau semua pesanan jika `scope=all` untuk admin) | Ya |
| `GET` | `/api/orders/:id` | Detail pesanan tertentu | Ya |
| `POST` | `/api/orders` | Checkout & membuat pesanan baru dari cart | Ya |
| `PATCH` | `/api/orders/:id` | Membatalkan pesanan (`{ status: "CANCELLED" }`) | Ya |
| `PATCH` | `/api/orders/:id/status` | Update status pesanan (`PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) | Ya (`ADMIN`) |
| `POST` | `/api/payment` | Konfirmasi pembayaran pesanan (`{ orderId }`) | Ya |

### 7. Users (`/api/users`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `PATCH` | `/api/users/:id` | Update profil user (`name`, `email`) | Ya |
| `PATCH` | `/api/users/:id/password` | Ubah password user (`currentPassword`, `newPassword`) | Ya |

### 7. Reviews (`/api/reviews`)
| Method | Endpoint | Deskripsi | Auth Required |
|---|---|---|---|
| `GET` | `/api/reviews?productId=:id` | Mengambil review dan ringkasan rating suatu produk | Tidak |
| `POST` | `/api/reviews` | Menambahkan ulasan dan rating produk | Ya |

---

## 💡 Format Respon Standar

Disarankan menggunakan format JSON konsisten seperti yang diharapkan frontend:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operasi berhasil"
}
```

Format Error:
```json
{
  "success": false,
  "error": "Pesan error spesifik"
}
```

# Panduan Deployment Produksi Shoes4Us E-Commerce Platform

Dokumen ini menyediakan panduan lengkap untuk men-deploy aplikasi **Shoes4Us** (React + Go Chi REST API + PostgreSQL) ke lingkungan produksi, baik menggunakan **Docker Compose (VPS / Server)** maupun arsitektur **Cloud PaaS Terpisah (Vercel + Railway/Render + Supabase/Neon)**.

---

## 1. Arsitektur Deployment

Aplikasi didesain modular dengan 2 opsi deployment:

### Opsi A: Full Self-Hosted Container (Docker Compose - VPS)
Semua komponen berjalan di server tunggal (DigitalOcean, Hetzner, AWS EC2, Linode, Contabo) di balik reverse proxy:
```
[ Browser / Client ]
         │
         ▼ (Port 80 / 443 HTTPS)
┌────────────────────────────────────────────────────────┐
│ Nginx Container (shoes4us-frontend)                   │
│  ├─ Melayani React SPA (/usr/share/nginx/html)        │
│  ├─ Cache static assets (/assets/*)                   │
│  ├─ Reverse proxy /api/*     ──► [ Go API:8080 ]       │
│  └─ Reverse proxy /uploads/* ──► [ Go API:8080 ]       │
└─────────────────────────┬──────────────────────────────┘
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ Go API (shoes4us-backend)   │   │ PostgreSQL 16 (shoes4us-db) │
│  ├─ REST API Endpoints      │◄──┤  └─ Volume: pgdata          │
│  ├─ Volume: /app/uploads    │   └─────────────────────────────┘
│  └─ Binary: /app/seed       │
└─────────────────────────────┘
```

### Opsi B: Cloud PaaS Decoupled (Managed Services)
- **Frontend**: [Vercel](https://vercel.com) atau [Netlify](https://netlify.com)
- **Backend API**: [Railway](https://railway.app), [Render](https://render.com), atau [Fly.io](https://fly.io)
- **Database**: [Supabase](https://supabase.com), [Neon](https://neon.tech), atau [AWS RDS](https://aws.amazon.com/rds/)

---

## 2. Opsi A: Panduan Deployment Docker Compose (VPS)

### Langkah 1: Persiapan Server & Prasyarat
Pastikan server Anda sudah terinstal:
- Linux (Ubuntu 22.04 LTS / Debian 12 direkomendasikan)
- [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) (v24+) & Docker Compose Plugin (v2+)
- Git

### Langkah 2: Clone Repository
```bash
git clone https://github.com/ranggadya/shoes4us.git
cd shoes4us
```

### Langkah 3: Konfigurasi File Environment
Salin file template `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan ganti nilai berikut dengan nilai produksi yang aman:
```env
# Port Publik
FRONTEND_PORT=80
DB_PORT=5432

# Kredensial Database
POSTGRES_DB=shoes4us_db
POSTGRES_USER=shoes4us
POSTGRES_PASSWORD=ganti_dengan_password_database_yang_sangat_kuat_32char

# JWT Secret (Wajib acak & kuat di produksi, minimal 32 karakter)
# Tip: buat dengan command `openssl rand -hex 32`
JWT_SECRET=b63f8d098e9471f54a8e2cb91b94514a6012c4ea78e38466b02a7b64ff192e21
JWT_EXPIRES_HOURS=168

# Domain & CORS
FRONTEND_URL=https://shoes4us.yourdomain.com
CORS_ORIGINS=https://shoes4us.yourdomain.com,http://localhost

# Konfigurasi Email SMTP (Opsional, untuk Reset Password)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=admin@yourdomain.com
MAIL_PASS=your_app_password
MAIL_FROM="Shoes4Us <no-reply@yourdomain.com>"
```

### Langkah 4: Build dan Jalankan Kontainer
Jalankan perintah berikut:
```bash
docker compose up -d --build
```
Verifikasi bahwa seluruh 3 container sudah berjalan sehat:
```bash
docker compose ps
```
Output yang diharapkan:
```
NAME                IMAGE                COMMAND                  SERVICE    STATUS
shoes4us-db         postgres:16-alpine   "docker-entrypoint.s…"   db         Up (healthy)
shoes4us-backend    shoes4us-backend     "/app/api"               backend    Up (healthy)
shoes4us-frontend   shoes4us-frontend    "nginx -g 'daemon of…"   frontend   Up (healthy)
```

### Langkah 5: Inisialisasi Skema & Data Awal Database (Seeding)
Database PostgreSQL Shoes4Us dilengkapi binary seeder otomatis yang membuat DDL table, enum type, dan data seed awal:
```bash
docker compose exec backend /app/seed
```
Setelah proses selesai, akun default siap digunakan:
- **Admin**: `admin@shoes4us.com` / `AdminPass123!`
- **Customer**: `customer@shoes4us.com` / `CustomerPass123!`

### Langkah 6: Konfigurasi Domain & HTTPS / SSL (Let's Encrypt / Certbot)
Untuk mengamankan traffic produksi dengan sertifikat SSL gratis:
1. Pastikan DNS A record domain Anda (`shoes4us.yourdomain.com`) mengarah ke IP publik VPS.
2. Gunakan Certbot pada host OS atau gunakan Cloudflare Proxy (Fleksibel/Full Strict).
   Contoh menggunakan Nginx Host / Certbot reverse proxy:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d shoes4us.yourdomain.com
   ```

---

## 3. Opsi B: Panduan Deployment Cloud PaaS (Vercel + Railway + Supabase)

### 1. Database (Supabase / Neon)
1. Buat project PostgreSQL baru di [Supabase](https://supabase.com) atau [Neon](https://neon.tech).
2. Dapatkan **Connection String URI** berformat:
   `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
3. Jalankan migrasi & data seed dari terminal lokal ke database cloud:
   ```bash
   cd backend
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require" go run ./cmd/seed
   ```

### 2. Backend Go REST API (Railway / Render)
1. Buat Service baru di [Railway](https://railway.app) / [Render](https://render.com) terhubung ke repository GitHub.
2. Atur **Root Directory** ke: `backend` (atau gunakan Dockerfile di `./backend/Dockerfile`).
3. Tambahkan **Persistent Volume** di path `/app/uploads` (ukuran 1GB-5GB) untuk menyimpan upload gambar produk.
4. Set Environment Variables di dashboard:
   - `PORT=8080`
   - `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
   - `JWT_SECRET=[generate-strong-key]`
   - `JWT_EXPIRES_HOURS=168`
   - `UPLOAD_DIR=/app/uploads`
   - `FRONTEND_URL=https://shoes4us.vercel.app`
   - `CORS_ORIGINS=https://shoes4us.vercel.app`
5. Deploy dan catat domain publik backend Anda (contoh: `https://shoes4us-api-production.up.railway.app`).

### 3. Frontend React SPA (Vercel / Netlify)
1. Import repository ke [Vercel](https://vercel.com).
2. Pengaturan Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Tambahkan Environment Variable:
   - `VITE_API_URL`: `https://shoes4us-api-production.up.railway.app/api`
4. Deploy! Vercel akan otomatis meng-compile dan mendistribusikan React bundle ke Global CDN.

---

## 4. Perintah Operasional & Monitoring (Cheat Sheet)

| Operasi | Perintah Docker Compose |
|---|---|
| **Melihat status kontainer** | `docker compose ps` |
| **Melihat log real-time API** | `docker compose logs -f backend` |
| **Melihat log real-time Frontend/Nginx** | `docker compose logs -f frontend` |
| **Melihat log real-time Database** | `docker compose logs -f db` |
| **Restart semua service** | `docker compose restart` |
| **Stop semua service** | `docker compose down` |
| **Stop & hapus volume database (HATI-HATI)** | `docker compose down -v` |
| **Jalankan database seeder ulang** | `docker compose exec backend /app/seed` |
| **Akses terminal kontainer backend** | `docker compose exec -it backend sh` |
| **Akses PostgreSQL CLI (psql)** | `docker compose exec -it db psql -U shoes4us -d shoes4us_db` |

---

## 5. Prosedur Backup & Restore

### Backup Database PostgreSQL
Jalankan backup otomatis ke file `.sql`:
```bash
docker compose exec -T db pg_dump -U shoes4us shoes4us_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database PostgreSQL
```bash
cat backup_file.sql | docker compose exec -T db psql -U shoes4us -d shoes4us_db
```

### Backup Gambar Upload
Folder upload disimpan di Docker volume `shoes4us_uploads_data`. Untuk mem-backup ke direktori lokal:
```bash
docker run --rm -v shoes4us_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

---

## 6. Checklist Keamanan Produksi (Production Hardening)

- [x] **Non-Root Container**: Kontainer backend berjalan sebagai user `appuser:appgroup` (UID 10001), bukan root.
- [x] **Minimal Attack Surface**: Menggunakan multi-stage Dockerfile berbasis `alpine:3.20` dengan binary statis tanpa compiler di production image.
- [x] **HTTP Security Headers**: Nginx menginjeksi header `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, dan `Referrer-Policy`.
- [x] **Reverse Proxy API**: Request `/api/*` diteruskan secara internal oleh Nginx tanpa mengekspos port Go API langsung jika tidak diperlukan.
- [x] **Client Request Body Limiting**: Nginx membatasi ukuran body upload maksimal `15M` untuk mencegah serangan DoS memori.
- [ ] **Ganti Kredensial Default**: Pastikan `JWT_SECRET` dan `POSTGRES_PASSWORD` pada `.env` telah diganti dengan string acak sebelum go-live.
- [ ] **SSL / TLS**: Pastikan trafik HTTPS aktif (via Let's Encrypt atau Cloudflare SSL Strict).

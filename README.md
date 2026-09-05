<div align="center">
  <h1>💈 Barberflow Backend</h1>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
    <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtoken&logoColor=white" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
    <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
  </p>

  <p>
    <strong>Backend REST API untuk sistem manajemen antrean barbershop (Barberflow / Hair Connect)</strong><br />
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" />
    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" />
    <img src="https://img.shields.io/badge/CI-Passing-brightgreen?style=flat-square&logo=githubactions" />
  </p>
</div>

---

## 🌟 Overview

**Barberflow** adalah backend REST API untuk sistem manajemen antrean barbershop — mencakup autentikasi (JWT access + refresh token), manajemen layanan & barber, antrean pelanggan (join, cek antrean, panggil giliran), pembayaran/kasir, status buka-tutup toko, dan dashboard statistik. Notifikasi WhatsApp ke pelanggan dikirim otomatis melalui **Fonnte**.

Dibangun dengan **Node.js + Express.js**, **MySQL 8** sebagai database utama, dan **JWT** untuk autentikasi dengan **feature-module structure** (satu folder per fitur). Project ini sepenuhnya **dockerized** dan memiliki **CI/CD** (GitHub Actions) yang otomatis build & push image ke **GitHub Container Registry (GHCR)** setiap ada perubahan ke branch `main`.

> Frontend (React) ada di repo terpisah. Repo ini khusus **backend**.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi JWT** — `accessToken` (15 menit) dikirim via JSON, `refreshToken` (7 hari) disimpan di **httpOnly cookie** dengan endpoint `/refresh` untuk mendapatkan token baru
- 🗂️ **Feature-Module Structure** — satu folder per fitur (`auth`, `queue`, `services`, `barbers`, `payments`, `stats`, `store`) dengan pemisahan route → controller → model
- 🚶 **Manajemen Antrean** — pelanggan masuk antrean tanpa akun (cukup nama, no HP, dan pilihan layanan), cek nomor antrean sendiri, plus auto-assignment ke barber yang idle
- 💈 **Manajemen Barber** — overview beban antrean tiap barber, panggil pelanggan berikutnya (`call-next`), dan toggle status aktif/istirahat (dengan aturan minimal 1 barber aktif)
- 🪒 **Manajemen Layanan** — CRUD layanan (potong rambut, cukur jenggot, dll) beserta durasi & harga
- 💳 **Pembayaran / Kasir** — tagihan otomatis dibuat saat pelanggan join antrean, daftar antrean selesai belum bayar, terima/refund pembayaran, dan ringkasan revenue (per metode & rentang tanggal)
- 📊 **Dashboard Statistik** — jumlah pelanggan masuk & selesai (hari ini / bulan ini), revenue, dan total potong per barber
- 🏪 **Status Toko** — buka/tutup toko; antrean ditolak (503) saat toko tutup
- 📱 **Notifikasi WhatsApp (Fonnte)** — konfirmasi antrean, reminder ketika giliran tinggal 2 antrean lagi, dan pemberitahuan saat giliran tiba
- 🛡️ **Keamanan** — rate limiting (`express-rate-limit`: global API & khusus auth), `helmet()`, CORS dibatasi origin tertentu (default `http://localhost:5173`), validasi payload dengan **Joi**, limit ukuran body `1mb`
- ✅ **Unit test** — framework bawaan Node.js (`node --test`)

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Express.js (Node.js 20) |
| Database | MySQL 8 |
| Driver DB | `mysql2` (connection pool, named placeholders) |
| Auth | JWT (access token + refresh token via cookie) |
| Validasi | Joi |
| Notifikasi | WhatsApp via Fonnte API |
| Keamanan | Helmet, CORS, Rate Limiter |
| Testing | Node.js Test Runner (`node --test`) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → GHCR |

---

## 📋 Daftar Isi

1. [Environment Configuration](#️-environment-configuration)
2. [Cara Menjalankan Aplikasi](#-cara-menjalankan-aplikasi)
   - [Mode A — Manual (Lokal, MySQL XAMPP/standalone)](#mode-a--manual-lokal-mysql-xamppstandalone)
   - [Mode B — Docker Development](#mode-b--docker-development)
   - [Mode C — Docker Production (Lokal)](#mode-c--docker-production-lokal)
3. [Skema Database](#-skema-database)
4. [Project Structure](#-project-structure)
5. [Autentikasi & Format Response](#️-autentikasi--format-response)
6. [Daftar Endpoint](#-daftar-endpoint)
7. [Testing](#-testing)
8. [CI/CD](#-cicd)
9. [Troubleshooting](#️-troubleshooting)

---

## ⚙️ Environment Configuration

Copy `.env.example` menjadi `.env`, lalu isi semua value:

```bash
cp .env.example .env
```

| Variabel | Deskripsi | Default |
|---|---|---|
| `PORT` | Port aplikasi | `5000` |
| `DB_HOST` | Host database MySQL | `127.0.0.1` (untuk Docker: `mysql`) |
| `DB_USER` | User database | `root` (untuk Docker: `root`) |
| `DB_PASSWORD` | Password database | `-` (untuk Docker: `root`) |
| `DB_NAME` | Nama database | `hair_connect` |
| `JWT_SECRET` | Secret key access token | wajib diisi |
| `JWT_REFRESH_SECRET` | Secret key refresh token | wajib diisi |
| `FONNTE_TOKEN` | Token API WhatsApp Fonnte (opsional — jika kosong, notifikasi WA dilewati) | `-` |
| `CLIENT_URL` | Origin frontend yang diizinkan CORS | `http://localhost:5173` |

> 💡 **Untuk mode Docker:** nilai `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `PORT` sudah di-inject langsung oleh `docker-compose.yml`/`docker-compose.dev.yml` — kolom `.env` untuk variabel tersebut boleh dibiarkan apa adanya. `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, dan `FONNTE_TOKEN` tetap dibaca dari `.env`.

---

## 🚀 Cara Menjalankan Aplikasi

> ⚠️ **PENTING — Pilih SATU mode saja.** Mode A, B, dan C sama-sama memakai port host yang sama (`5000` aplikasi dan `3306` MySQL secara default). Menjalankan lebih dari satu mode secara bersamaan dapat menyebabkan error `port is already allocated`. Matikan mode lain dulu sebelum berpindah (`docker compose down` / matikan proses lokal).

### Mode A — Manual (Lokal, MySQL XAMPP/standalone)

Cocok jika kamu sudah punya MySQL (mis. XAMPP) yang berjalan di host.

**Prerequisites:** Node.js 20 (LTS), MySQL 8 berjalan di host.

```bash
git clone https://github.com/RahmatHedo/backend-barberflow.git
cd backend-barberflow
cp .env.example .env   # isi DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, dll

npm install

# Untuk DB baru, buat database dulu: CREATE DATABASE hair_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# Untuk DB yang sudah ada, jalankan migrasi (idempotent — aman dijalankan berulang):
node migrate.js            # tambah kolom/tabel baru di skema inti
node migratePayments.js    # buat tabel payments

npm run dev                # hot reload (nodemon) → http://localhost:5000
```

Untuk production lokal tanpa hot reload:

```bash
npm start                  # node src/app.js → http://localhost:5000
```

---

### Mode B — Docker Development

Menjalankan aplikasi + MySQL di dalam container, dengan **hot-reload** (nodemon) dan mount source code secara live.

**Prerequisites:** Docker & Docker Compose.

```bash
git clone https://github.com/RahmatHedo/backend-barberflow.git
cd backend-barberflow
cp .env.example .env       # isi JWT_SECRET, JWT_REFRESH_SECRET, dll (DB diinject oleh compose)

docker compose -f docker-compose.dev.yml up -d --build
```

- Aplikasi: `http://localhost:5000`
- MySQL container `hair_connect_db_dev` di port host `3306`
- Skema & seed DB otomatis di-apply saat volume pertama kali dibuat (dari `docker/mysql-init/`)

Log container (hot reload otomatis saat file `src/` berubah):

```bash
docker compose -f docker-compose.dev.yml logs -f app
```

Untuk mematikan:

```bash
docker compose -f docker-compose.dev.yml down
```

---

### Mode C — Docker Production (Lokal)

Menjalankan **image production** (dependencies production saja, tanpa nodemon) bersama MySQL.

**Prerequisites:** Docker & Docker Compose.

```bash
git clone https://github.com/RahmatHedo/backend-barberflow.git
cd backend-barberflow
cp .env.example .env       # isi value

docker compose up -d --build
```

- Aplikasi: `http://localhost:5000`
- MySQL container `hair_connect_db` di port host `3306`

Untuk mematikan:

```bash
docker compose down
```

---

## 🗄️ Skema Database

Database: **`hair_connect`** (MySQL 8, charset `utf8mb4`). Skema lengkap ada di `docker/mysql-init/01-schema.sql` (di-apply otomatis oleh Docker saat init, atau bisa dijalankan manual).

| Tabel | Deskripsi |
|---|---|
| `users` | User admin & barber (`role: 'admin'` / `'barber'`), termasuk kolom `is_available` untuk status aktif/istirahat barber |
| `services` | Layanan barbershop (nama, deskripsi, `duration_minutes`, `price`, `is_active`, `display_order`) |
| `queue_entries` | Entri antrean: `queue_number`, customer, `service_id`, `barber_id`, status (`waiting`/`serving`/`completed`/`cancelled`/`no_show`), `lane_type` (`request`/`free`), `preferred_barber_id` |
| `payments` | Pembayaran: `queue_entry_id`, `amount`, `method` (`cash`/`qris`/`e_wallet`/`bank_transfer`/`card`), status (`pending`/`paid`/`refunded`) |
| `queue_logs` | Log riwayat aksi antrean (`joined`, `called`, `completed`, `cancelled`, `no_show`) |
| `store_settings` | Status buka/tutup toko (single row, `id = 1`) |

### Akun default (seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hairconnect.id` | `admin123` |
| Barber | `agus@barberflow.id` | `barber123` |
| Barber | `budi@barberflow.id` | `barber123` |
| Barber | `chandra@barberflow.id` | `barber123` |

---

## 📁 Project Structure

```
backend-barberflow/
├── .github/workflows/       # CI/CD (ci.yml + docker-build.yml)
├── docker/mysql-init/        # 01-schema.sql + 02-seed.sql (auto-init container MySQL)
├── src/
│   ├── app.js                # bootstrap Express: middleware global, mount semua modul
│   ├── config/
│   │   ├── db.js             # MySQL connection pool (mysql2/promise) + testConnection
│   │   └── seed.sql          # seed 3 barber (untuk MySQL yang sudah ada)
│   ├── middleware/
│   │   ├── auth.js           # authenticateToken (JWT) + authorizeRole('admin','barber')
│   │   ├── errorHandler.js   # AppError + global error handler
│   │   └── validate.js       # validasi Joi (body/params/query)
│   ├── services/
│   │   └── whatsappService.js # notifikasi WhatsApp via Fonnte
│   ├── validations/
│   │   └── common.js         # schema reusable: phone number, ID param
│   └── modules/               # SATU FOLDER PER FITUR
│       ├── auth/              # login, refresh, logout, me
│       ├── queue/             # join, check, today, transisi status (+ model/: helpers, workload, queries, join, transitions, log)
│       ├── services/          # CRUD layanan
│       ├── barbers/           # overview, queue per barber, call-next, availability
│       ├── payments/          # kasir, settle, refund, revenue summary
│       ├── stats/             # dashboard, today, month, per barber
│       └── store/             # status buka/tutup toko
├── test/                      # unit test (node --test)
├── migrate.js                 # migrasi idempotent DB yang sudah ada (kolom/tabel baru)
├── migratePayments.js         # migrasi tabel payments
├── Dockerfile                 # production image (single stage, non-root user)
├── Dockerfile.dev             # development image (nodemon hot reload)
├── docker-compose.yml         # production stack (MySQL + app)
├── docker-compose.dev.yml     # development stack (MySQL + app, live mount src)
└── .env.example
```

---

## 🔐 Autentikasi & Format Response

### Alur autentikasi

1. **Login** (`POST /api/auth/login`) → response berisi `accessToken` (masa berlaku **15 menit**) + data user. `refreshToken` (masa berlaku **7 hari**) otomatis disimpan di **httpOnly cookie** `refreshToken`.

2. **Akses endpoint terproteksi** → kirim header:
   ```
   Authorization: Bearer <accessToken>
   ```

3. **Token habis** → panggil `POST /api/auth/refresh` (menggunakan cookie otomatis, tanpa body) untuk mendapatkan `accessToken` baru, atau login ulang.

4. **Logout** (`POST /api/auth/logout`) → menghapus cookie `refreshToken`.

### Role

| Role | Keterangan |
|---|---|
| `admin` | Akses penuh: kelola layanan, barber, pembayaran, statistik, status toko |
| `barber` | Kelola antrean miliknya sendiri (call-next, availability, transisi status) |

### Format response umum

Semua endpoint mengembalikan JSON dalam format envelope yang konsisten:

```jsonc
// Sukses
{ "success": true, "message": "...(opsional)", "data": { ... } }

// Error
{ "success": false, "message": "Pesan error", "code": "KODE_OPTIONAL(opsional)" }
```

### Contoh login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hairconnect.id","password":"admin123"}'
```

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 7,
      "name": "Admin",
      "email": "admin@hairconnect.id",
      "role": "admin",
      "phone": "08120000000",
      "avatar_url": null
    }
  }
}
```

### Contoh akses endpoint terproteksi

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🔌 Daftar Endpoint

> Semua endpoint menggunakan prefix **`/api`** (contoh: `/auth/login` berarti `/api/auth/login`). Endpoint terproteksi membutuhkan header `Authorization: Bearer <accessToken>`.

> **Legenda Access:** 🌍 Public · 🔒 Admin + Barber (barber hanya untuk dirinya sendiri) · 🔐 Admin saja

### Health

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/health` | 🌍 Public | Health check API (status, timestamp, environment) |

### Auth

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/auth/login` | 🌍 Public | Login, return `accessToken` + set cookie `refreshToken` |
| POST | `/auth/refresh` | 🌍 Public | Refresh `accessToken` baru dari cookie `refreshToken` |
| POST | `/auth/logout` | 🌍 Public | Logout, hapus cookie `refreshToken` |
| GET | `/auth/me` | 🔒 Login | Lihat data user yang sedang login |

**Body `POST /auth/login`:**

```json
{ "email": "admin@hairconnect.id", "password": "admin123" }
```

---

### Store (Status Toko)

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/store/status` | 🌍 Public | Cek status buka/tutup toko: `{ "data": { "is_open": true } }` |
| PUT | `/store/status` | 🔐 Admin | Ubah status toko |

**Body `PUT /store/status`:**

```json
{ "is_open": false }
```

---

### Services (Layanan)

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/services` | 🌍 Public | List layanan yang aktif |
| GET | `/services/all` | 🔐 Admin | List semua layanan (termasuk nonaktif) |
| POST | `/services` | 🔐 Admin | Tambah layanan baru |
| PUT | `/services/:id` | 🔐 Admin | Update layanan (parsial) |
| DELETE | `/services/:id` | 🔐 Admin | Soft delete layanan (`is_active = false`) |

**Body `POST /services`:**

```json
{
  "name": "Potong Rambut",
  "description": "Potong rambut standar",
  "duration_minutes": 30,
  "price": 35000,
  "display_order": 1
}
```

**Body `PUT /services/:id`** — minimal satu field:

```json
{ "price": 40000, "is_active": true }
```

---

### Queue (Antrean)

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| POST | `/queue` | 🌍 Public | Pelanggan masuk antrean (tagihan pending otomatis dibuat) |
| GET | `/queue/check?phone=` | 🌍 Public | Cek nomor antrean pelanggan sendiri hari ini |
| GET | `/queue/today` | 🔒 Admin + Barber | List semua antrean hari ini beserta statusnya |
| PUT | `/queue/:id` | 🔒 Admin + Barber | Transisi status: `complete` / `no-show` / `cancel` |

**Body `POST /queue`:**

```json
{
  "customer_name": "Budi",
  "customer_phone": "081234567890",
  "service_id": 1,
  "preferred_barber_id": 4,
  "notes": "Minta rapikan samping"
}
```

> `preferred_barber_id` opsional. Jika diisi → `lane_type: 'request'`. Jika barber preferensi sedang idle, pelanggan langsung `serving`. Jika kosong dan ada barber idle, di-assign otomatis (`lane_type: 'free'`); jika semua sibuk, masuk antrean barber dengan estimasi tunggu terpendek.

**Body `PUT /queue/:id`:**

```json
{ "action": "complete" }
```

> `action` valid: `complete` (hanya status `serving`), `no-show`, `cancel`.

---

### Barbers

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/barbers` | 🌍 Public | Overview tiap barber: `waiting_count`, `serving_count`, `total_queue`, `estimated_wait_minutes`, `is_available` |
| GET | `/barbers/:id/queue` | 🔒 Admin + Barber | Antrean milik satu barber (menunggu, dilayani, total selesai) |
| PUT | `/barbers/:id/next` | 🔒 Admin + Barber | Panggil pelanggan berikutnya (kirim WA otomatis + reminder ke 2 antrean berikutnya) |
| PUT | `/barbers/:id/availability` | 🔒 Admin + Barber | Toggle status aktif/istirahat (minimal 1 barber harus aktif) |

> ⚠️ Barber hanya bisa memanggil/mengubah status untuk **dirinya sendiri** (`req.user.id === :id`). Admin bebas untuk barber manapun.

---

### Payments (Kasir)

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/payments/unpaid-queue` | 🔒 Admin + Barber | List antrean selesai yang belum lunas (untuk kasir) |
| GET | `/payments/revenue/summary` | 🔐 Admin | Ringkasan revenue + per metode (`date` / `start_date` / `end_date`) |
| GET | `/payments` | 🔐 Admin | List pembayaran + filter query |
| GET | `/payments/:id` | 🔐 Admin | Detail satu pembayaran |
| POST | `/payments` | 🔐 Admin | Input pembayaran manual oleh kasir (langsung `paid`) |
| PUT | `/payments/:id/paid` | 🔐 Admin | Terima tagihan `pending` → `paid` |
| PUT | `/payments/:id/refund` | 🔐 Admin | Refund pembayaran (`paid` → `refunded`) |

**Query filter `GET /payments`:** `method` (`cash`/`qris`/`e_wallet`/`bank_transfer`/`card`), `status` (`pending`/`paid`/`refunded`), `date` (`YYYY-MM-DD`), `start_date`, `end_date`, `limit` (1–1000).

**Body `POST /payments`:**

```json
{
  "queue_entry_id": 9,
  "amount": 35000,
  "method": "qris",
  "notes": "Bayar oleh kasir"
}
```

**Body `PUT /payments/:id/paid`** — minimal satu field:

```json
{ "method": "cash", "amount": 35000 }
```

---

### Stats (Dashboard)

| Method | Endpoint | Access | Kegunaan |
|---|---|---|---|
| GET | `/stats` | 🔐 Admin | Dashboard lengkap: `{ today, month, barbers }` |
| GET | `/stats/today` | 🔐 Admin | Ringkasan hari ini (jumlah pelanggan, selesai, revenue) |
| GET | `/stats/month` | 🔐 Admin | Ringkasan bulan ini (jumlah pelanggan, selesai, revenue) |
| GET | `/stats/barbers` | 🔐 Admin | Total potong per barber (`today_cuts`, `month_cuts`) |

Contoh respons `GET /stats`:

```json
{
  "success": true,
  "data": {
    "today": { "total": 12, "served": 9, "revenue": { "total": 315000, "cash": 200000, "qris": 115000, "refunded": 0 } },
    "month": { "total": 210, "served": 180, "revenue": { "total": 5300000, "cash": 3200000, "qris": 2100000, "refunded": 10000 } },
    "barbers": [
      { "barber_id": 4, "barber_name": "Agus Santoso", "today_cuts": 5, "month_cuts": 80 }
    ]
  }
}
```

---

## 🧪 Testing

```bash
npm test
```

Menjalankan seluruh unit test dengan framework bawaan Node.js (`node --test`). Test tersedia di folder `test/`.

---

## ⚡ CI/CD

### CI (`ci.yml`)

Jalan di setiap **push dan pull request** ke branch `main`:

1. `npm ci` (install dependencies)
2. `npm test` (jalankan unit test)
3. Build image Docker (tanpa push — hanya validasi)

### Docker Build & Push (`docker-build.yml`)

Jalan di **push ke `main`** (khusus perubahan `src/**`, `Dockerfile`, `docker-compose.yml`, `package.json`, atau workflow itu sendiri) serta bisa di-trigger manual (`workflow_dispatch`):

1. Login ke **GitHub Container Registry (GHCR)**
2. Build image production (dari `Dockerfile`)
3. Push ke `ghcr.io/<owner>/backend-barberflow` dengan tag `:latest` dan `:<sha-commit>`

Image terbaru dapat ditarik dengan:

```bash
docker pull ghcr.io/rahmathedo/backend-barberflow:latest
```

---

## 🛠️ Troubleshooting

### Problem: `ECONNREFUSED ...` saat aplikasi mencoba konek ke database

**Penyebab:** MySQL tidak berjalan di host, atau kredensial di `.env` salah.

**Solusi:** pastikan MySQL berjalan (mis. aktifkan MySQL di XAMPP), lalu cek `.env`:
- `DB_HOST=127.0.0.1` (bukan `localhost` jika konektor butuh TCP)
- `DB_USER=root`, `DB_PASSWORD=` (kosong di XAMPP default), `DB_NAME=hair_connect`
- Pastikan database `hair_connect` sudah dibuat: `CREATE DATABASE hair_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### Problem: `port is already allocated` saat menjalankan dua mode Docker bersamaan

**Penyebab:** `docker-compose.yml` dan `docker-compose.dev.yml` sama-sama memakai port host `5000` dan `3306`. Container MySQL punya nama berbeda, tetapi memakai port host yang sama.

**Solusi:** jalankan **satu mode saja**. Sebelum berpindah mode, matikan yang berjalan:
```bash
docker compose -f docker-compose.dev.yml down    # dari mode dev
docker compose down                               # dari mode prod
```
Atau override port untuk salah satunya:
```bash
docker compose -f docker-compose.dev.yml up -d -e "PORT=5001"
```

### Problem: Notifikasi WhatsApp tidak terkirim / log `FONNTE_TOKEN not configured`

**Penyebab:** `FONNTE_TOKEN` di `.env` kosong. Ini **opsional** — aplikasi tetap berjalan, hanya notifikasi WA dilewati.

**Solusi:** isi token dari [Fonnte](https://fonnte.com). Token dikirim langsung di header `Authorization` (tanpa prefix `Bearer`).

### Problem: `ERR_DUP_ENTRY` saat menjalankan seed Docker berulang

**Penyebab:** seed (`02-seed.sql`) hanya di-apply saat volume MySQL **pertama kali** dibuat. Volume lama sudah berisi data.

**Solusi:** hapus volume untuk mengulang dari awal (hati-hati, data hilang):
```bash
docker compose down -v
```

### Problem: `Token expired. Please refresh.` (401 `TOKEN_EXPIRED`)

**Penyebab:** `accessToken` berlaku 15 menit.

**Solusi:** panggil `POST /api/auth/refresh` (cookie `refreshToken` otomatis terkirim) untuk mendapatkan `accessToken` baru, atau login ulang.

### Problem: Antrean ditolak saat toko tutup (503)

**Penyebab:** `store_settings.is_open = false`.

**Solusi:** buka toko dulu via `PUT /api/store/status` dengan `{ "is_open": true }` (role admin).

---

<div align="center">
  <sub>Dibuat dan dikembangkan oleh <strong>RahmatHedo (Rahmat Hedo)</strong></sub>

  <br /><br />

  <a href="https://github.com/RahmatHedo"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="mailto:rahmathedo@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" /></a>
</div>
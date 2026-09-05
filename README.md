# Backend Barberflow

[![CI](https://github.com/RahmatHedo/backend-barberflow/actions/workflows/ci.yml/badge.svg)](https://github.com/RahmatHedo/backend-barberflow/actions/workflows/ci.yml)
[![Docker Build & Push](https://github.com/RahmatHedo/backend-barberflow/actions/workflows/docker-build.yml/badge.svg)](https://github.com/RahmatHedo/backend-barberflow/actions/workflows/docker-build.yml)

Barbershop queue management API — Express.js, modular per-fitur, MySQL, Dockerized, CI/CD via GitHub Actions.

> Frontend (React) ada di repo terpisah. Repo ini khusus **backend**.

## Fitur (per-modul)

| Modul | Endpoint utama |
|---|---|
| `auth` | `POST /api/auth/login`, `/refresh`, `/logout`, `GET /api/auth/me` |
| `store` | `GET/PUT /api/store/status` (buka/tutup toko) |
| `services` | `GET /api/services`, CRUD admin |
| `queue` | `POST /api/queue` (join + tagihan pending otomatis), transisi status, `GET /api/queue/today`, `GET /api/queue/check` |
| `barbers` | `GET /api/barbers`, call-next, toggle availability, reminder WhatsApp (Fonnte) |
| `payments` | `unpaid-queue`, `settle`, `refund`, `revenue/summary` |
| `stats` | `GET /api/stats` (+ `/today`, `/month`, `/barbers`) |

## Struktur

```
├── src/
│   ├── app.js              # bootstrap + mount modul per fitur
│   ├── config/             # db.js (mysql2 pool), seed.sql
│   ├── middleware/         # auth (JWT), errorHandler, validate
│   ├── services/           # whatsappService.js (Fonnte)
│   ├── validations/        # common.js (schema ID & phone)
│   └── modules/            # SATU FOLDER PER FITUR
│       ├── auth/
│       ├── queue/          # (+ model/: helpers, workload, queries, join, transitions, log)
│       ├── services/
│       ├── barbers/
│       ├── stats/
│       ├── payments/
│       └── store/
├── test/                   # unit test (node --test)
├── docker/mysql-init/      # skema & seed DB untuk container MySQL
├── .github/workflows/      # ci.yml + docker-build.yml
├── Dockerfile              # production image
├── Dockerfile.dev          # development image (nodemon + hot reload)
├── docker-compose.yml      # production stack
└── docker-compose.dev.yml  # development stack
```

## Menjalankan

### Lokal (XAMPP MySQL)
```bash
cp .env.example .env        # isi sesuai environment Anda
npm install
npm run migrate && npm run migrate:payments   # (lihat catatan migrate)
npm run dev                 # http://localhost:5000
```

### Docker (development, hot reload)
```bash
docker compose -f docker-compose.dev.yml up
```

### Docker (production)
```bash
docker compose up -d --build
```

DB container memakai port host **3306** (port standar MySQL). Skema & seed di-apply otomatis saat volume pertama kali dibuat.

## Akun default (seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hairconnect.id` | `admin123` |
| Barber | `agus@barberflow.id`, `budi@barberflow.id`, `chandra@barberflow.id` | `barber123` |

## CI/CD di repo ini

- **CI** (`ci.yml`): `npm ci` → `npm test` → build image Docker (tanpa push). Jalan di tiap push & PR ke `main`.
- **Docker** (`docker-build.yml`): build & push image ke **GHCR** (`ghcr.io/<owner>/backend-barberflow:latest`) saat push ke `main`.

## Catatan migrate

`migrate.js` & `migratePayments.js` dipakai untuk DB yang sudah ada untuk menambah kolom/tabel baru (idempotent). Untuk DB baru, Docker seed sudah mencakup seluruh skema & data awal.
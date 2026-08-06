<div align="center">

# 🌐 Sistem Otomasi Layanan Internet ISP
### Internet Service Automation System — CV Citra Mandiri Grobogan

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

**Proyek Akhir Sarjana — Teknik Informatika**  
Dikembangkan bersama **CV Citra Mandiri Grobogan** (Internet Service Provider)

</div>

---

## 📋 Deskripsi Proyek

Sistem Otomasi Layanan Internet berbasis **RESTful API** yang dirancang untuk meningkatkan efisiensi operasional sebuah ISP lokal. Sistem ini mengintegrasikan manajemen pelanggan, penagihan otomatis, tiket gangguan, jadwal teknisi, hingga monitoring jaringan Mikrotik secara real-time — semuanya dalam satu platform terintegrasi.

Proyek ini dikembangkan sebagai **Tugas Akhir Skripsi** dalam program studi Teknik Informatika, dengan studi kasus nyata di CV Citra Mandiri Grobogan.

---

## ✨ Fitur Utama

### 👤 Manajemen Pelanggan & Layanan
- Pendaftaran & autentikasi pelanggan (Login, Register, Forgot Password)
- Pemesanan paket internet baru dengan alur approval admin
- **Upgrade paket** — pelanggan bisa ajukan upgrade, admin approve/tolak
- Pembayaran terintegrasi via **Midtrans Payment Gateway** (Snap)
- Penagihan bulanan otomatis dengan notifikasi jatuh tempo
- Isolir pelanggan otomatis jika tagihan overdue

### 🎫 Tiket Gangguan (Help Desk)
- Pelanggan lapor gangguan dengan foto & deskripsi
- Admin assign teknisi, update status (Menunggu → Diproses → Selesai)
- Teknisi upload bukti foto penyelesaian langsung dari aplikasi mobile
- Notifikasi real-time via **WhatsApp** & **Email** di setiap perubahan status

### 📅 Jadwal Teknisi
- Admin buat jadwal kunjungan untuk instalasi baru & perbaikan gangguan
- Teknisi pantau & update status jadwal dari aplikasi mobile (Berangkat → Pengerjaan → Selesai)
- Notifikasi otomatis ke pelanggan saat teknisi berangkat

### 🌐 Manajemen Jaringan (Mikrotik Integration)
- CRUD perangkat jaringan (Router, OLT, ODP, Access Point, Switch, Server)
- **Monitoring real-time** status perangkat (online/offline/terisolir)
- **Topologi jaringan** hierarkis (Core Router → ODP → Pelanggan)
- Sinkronisasi PPPoE Secrets dari MikroTik RouterOS API
- Auto-enable/disable PPPoE user saat pembayaran atau isolir

### 📊 Laporan & Dashboard
- Dashboard admin dengan ringkasan pendapatan, pelanggan aktif, tiket, teknisi bertugas
- Grafik pendapatan dinamis (7 hari, 1 bulan, 6 bulan, 1 tahun)
- Laporan paket terlaris & breakdown status order

### 🔔 Notifikasi Multi-channel
- **WhatsApp** (via WA Gateway) — order, billing, tiket, teknisi berangkat
- **Email** (SMTP Gmail) — welcome, order aktif/ditolak, tagihan, upgrade
- **In-app Notifications** — real-time untuk semua role

### 📍 Survey Lokasi
- Calon pelanggan bisa ajukan survey lokasi dengan koordinat GPS
- Admin assign teknisi, teknisi update hasil survey (Layak/Ditolak)
- Lokasi terverifikasi tampil di peta coverage area publik

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────┐          ┌──────────────────────────┐  │
│  │  Web Dashboard   │          │    Mobile App (Expo)     │  │
│  │  React + Vite    │          │    React Native          │  │
│  │  (Admin/Cust)    │          │    (Pelanggan/Teknisi)   │  │
│  └────────┬─────────┘          └───────────┬──────────────┘  │
└───────────┼────────────────────────────────┼─────────────────┘
            │  HTTP/REST                     │  HTTP/REST
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX REVERSE PROXY (Port 80)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   BACKEND LAYER (Laravel 11)                  │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ RESTful API │  │  Scheduler   │  │   Queue Worker     │  │
│  │ (Sanctum)   │  │ (Cron Jobs)  │  │ (Email/WA/Jobs)    │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Midtrans   │  │  MikroTik    │  │  WhatsApp + Email  │  │
│  │  Payment    │  │  RouterOS    │  │  Notifications     │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   DATABASE LAYER — PostgreSQL 16              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 11, PHP 8.2, Laravel Sanctum, Spatie Roles & Permissions |
| **Frontend Web** | React 18, TypeScript, Vite, React Router, Recharts |
| **Mobile App** | React Native (Expo), TypeScript |
| **Database** | PostgreSQL 16 |
| **Payment Gateway** | Midtrans (Snap API) |
| **Network Management** | MikroTik RouterOS API (PPPoE) |
| **Notifikasi** | SMTP Gmail, WhatsApp Gateway |
| **Containerization** | Docker, Docker Compose |
| **Reverse Proxy** | Nginx |
| **Authentication** | Laravel Sanctum (Token-based) |
| **Authorization** | Spatie Laravel Permission (RBAC) |

---

## 👥 Role & Akses

| Role | Akses |
|------|-------|
| **Admin** | Manajemen penuh: pelanggan, order, billing, tiket, jadwal, paket, laporan, jaringan, pengaturan sistem |
| **Teknisi** | Dashboard tugas, jadwal kunjungan, tiket gangguan, instalasi, survey lokasi |
| **Pelanggan** | Pemesanan paket, pembayaran, tagihan, tiket gangguan, upgrade paket, profil |

---

## 📡 RESTful API Endpoints

<details>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/register` | Registrasi pelanggan baru |
| POST | `/api/login` | Login semua role |
| POST | `/api/logout` | Logout (hapus token) |
| GET | `/api/me` | Data user yang sedang login |
| POST | `/api/forgot-password` | Kirim link reset password |
| POST | `/api/reset-password` | Reset password baru |

</details>

<details>
<summary><b>📦 Paket Internet</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/pakets` | Public | Daftar semua paket |
| GET | `/api/pakets/{id}` | Public | Detail paket |
| POST | `/api/pakets` | Admin | Tambah paket baru |
| PUT | `/api/pakets/{id}` | Admin | Update paket |
| DELETE | `/api/pakets/{id}` | Admin | Hapus paket |
| GET | `/api/admin/pakets` | Admin | Daftar paket (view admin) |

</details>

<details>
<summary><b>🛒 Order & Pemasangan</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/orders` | Customer | Buat order baru |
| GET | `/api/orders/my` | Customer | Lihat order milik sendiri |
| GET | `/api/orders/{id}` | Customer | Detail order |
| GET | `/api/traffic/my` | Customer | Data traffic internet |
| POST | `/api/orders/{id}/upgrade` | Customer | Ajukan upgrade paket |
| GET | `/api/orders` | Admin | Semua order |
| PATCH | `/api/orders/{id}/status` | Admin | Update status order |
| PATCH | `/api/orders/{id}/specs` | Admin | Update spesifikasi teknis |

</details>

<details>
<summary><b>💳 Pembayaran (Midtrans)</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/orders/{id}/pay` | Customer | Get Snap Token (instalasi baru) |
| POST | `/api/billings/{id}/pay` | Customer | Get Snap Token (tagihan bulanan) |
| POST | `/api/orders/{id}/demo-pay-success` | Customer | Simulasi pembayaran berhasil |
| POST | `/api/billings/{id}/demo-pay-success` | Customer | Simulasi tagihan lunas |
| POST | `/api/midtrans/webhook` | Public | Webhook callback Midtrans |
| GET | `/api/admin/payments` | Admin | Riwayat semua pembayaran |

</details>

<details>
<summary><b>🧾 Tagihan Bulanan</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/my-billings` | Customer | Tagihan milik sendiri |
| GET | `/api/admin/billings` | Admin | Semua tagihan |
| POST | `/api/admin/billings` | Admin | Buat tagihan manual |
| PATCH | `/api/admin/billings/{id}/pay` | Admin | Tandai lunas (cash/transfer) |
| POST | `/api/admin/billing/generate` | Admin | Trigger generate tagihan bulanan |
| POST | `/api/admin/billing/check-overdue` | Admin | Trigger cek & isolir overdue |

</details>

<details>
<summary><b>🎫 Tiket Gangguan</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/tickets` | Customer | Tiket milik sendiri |
| POST | `/api/tickets` | Customer | Buat tiket gangguan baru |
| GET | `/api/admin/tickets` | Admin | Semua tiket |
| POST | `/api/admin/tickets` | Admin | Buat tiket atas nama pelanggan |
| PATCH | `/api/admin/tickets/{id}/status` | Admin | Update status tiket |
| GET | `/api/technician/tickets` | Teknisi | Daftar tiket untuk teknisi |
| PATCH | `/api/technician/tickets/{id}/status` | Teknisi | Update status tiket |
| POST | `/api/technician/tickets/{id}/upload` | Teknisi | Upload foto bukti penyelesaian |

</details>

<details>
<summary><b>📅 Jadwal Teknisi</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/schedules/my` | Customer | Jadwal kunjungan ke saya |
| GET | `/api/admin/technician-schedules` | Admin | Semua jadwal |
| POST | `/api/admin/technician-schedules` | Admin | Buat jadwal baru |
| PATCH | `/api/admin/technician-schedules/{id}/status` | Admin | Update status jadwal |
| DELETE | `/api/admin/technician-schedules/{id}` | Admin | Hapus jadwal |
| GET | `/api/technician/installations` | Teknisi | Daftar instalasi aktif |
| PATCH | `/api/technician/installations/{id}/status` | Teknisi | Update status instalasi |
| GET | `/api/technician/dashboard` | Teknisi | Dashboard teknisi |
| GET | `/api/technician/history` | Teknisi | Riwayat pekerjaan selesai |

</details>

<details>
<summary><b>📍 Survey Lokasi</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/public/survey-requests` | Public | Ajukan survey lokasi baru |
| GET | `/api/public/survey-requests/verified` | Public | Lokasi survey yang layak |
| GET | `/api/technician/survey-requests` | Teknisi | Daftar permintaan survey |
| PATCH | `/api/technician/survey-requests/{id}/status` | Teknisi | Update hasil survey |
| POST | `/api/technician/survey-requests/{id}/assign` | Admin | Assign teknisi ke survey |

</details>

<details>
<summary><b>🌐 Perangkat Jaringan (Mikrotik)</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/network-devices/status` | Public | Status semua perangkat jaringan |
| GET | `/api/network-devices/topology` | Auth | Topologi jaringan hierarkis |
| GET | `/api/network-devices` | Auth | Daftar semua perangkat |
| POST | `/api/network-devices` | Auth | Tambah perangkat baru |
| PUT | `/api/network-devices/{id}` | Auth | Update perangkat |
| DELETE | `/api/network-devices/{id}` | Auth | Hapus perangkat |
| POST | `/api/network-devices/{id}/test-connection` | Auth | Uji koneksi ke Mikrotik |
| POST | `/api/network-devices/{id}/sync` | Auth | Sinkronisasi PPPoE dari Mikrotik |

</details>

<details>
<summary><b>📊 Laporan, Pelanggan & Lainnya</b></summary>

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/reports/summary` | Admin | Ringkasan laporan & grafik |
| GET | `/api/customers` | Admin | Daftar semua pelanggan |
| POST | `/api/customers` | Admin | Tambah pelanggan manual |
| PUT | `/api/customers/{id}` | Admin | Update data pelanggan |
| DELETE | `/api/customers/{id}` | Admin | Hapus pelanggan |
| PATCH | `/api/customers/{id}/status` | Admin | Update status layanan pelanggan |
| GET | `/api/profile` | Auth | Profil user |
| PUT | `/api/profile` | Auth | Update profil (termasuk avatar) |
| PUT | `/api/profile/password` | Auth | Ganti password |
| GET | `/api/notifications` | Auth | Daftar notifikasi |
| PATCH | `/api/notifications/{id}/read` | Auth | Tandai notifikasi dibaca |
| GET | `/api/settings` | Admin | Pengaturan sistem |
| POST | `/api/settings` | Admin | Update pengaturan |
| GET | `/api/search` | Auth | Pencarian global |
| GET | `/api/testimonials/public` | Public | Testimoni publik |
| POST | `/api/testimonials` | Customer | Kirim testimoni |
| GET | `/api/admin/testimonials` | Admin | Kelola testimoni |
| GET | `/api/admin/upgrades` | Admin | Daftar permintaan upgrade |
| PATCH | `/api/admin/upgrades/{id}/status` | Admin | Approve/tolak upgrade |
| GET | `/api/admin/users` | Admin | Semua user sistem |

</details>

---

## 🗄️ Struktur Database

```
users                    — Data user (customer, admin, teknisi)
├── roles                — RBAC: customer | admin | teknisi
├── orders               — Pemesanan & langganan aktif
│   ├── pakets           — Paket internet (nama, harga, kecepatan)
│   ├── billings         — Tagihan bulanan per order
│   └── upgrade_requests — Permintaan upgrade paket
├── tickets              — Tiket gangguan/laporan
├── technician_schedules — Jadwal kunjungan teknisi
├── network_devices      — Inventaris perangkat jaringan
├── survey_requests      — Permohonan survey lokasi
├── testimonials         — Testimoni pelanggan
├── notifications        — Notifikasi in-app
└── settings             — Konfigurasi sistem
```

---

## 🚀 Cara Menjalankan (Docker)

### Prasyarat
- Docker & Docker Compose terinstall
- Git

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/<username>/wifi-management.git
cd wifi-management

# 2. Salin file environment
cp .env.docker.example .env.docker

# 3. Isi variabel wajib di .env.docker
#    - APP_KEY
#    - POSTGRES_PASSWORD
#    - MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_MERCHANT_ID
#    - MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS
#    - WHATSAPP_API_KEY (opsional)

# 4. Jalankan semua service
docker compose up -d

# 5. Migrasi database & seed data awal
docker exec wifi_backend php artisan migrate --seed

# 6. Generate app key (jika belum ada di .env.docker)
docker exec wifi_backend php artisan key:generate

# 7. Storage link
docker exec wifi_backend php artisan storage:link
```

### Akses Aplikasi

| Service | URL |
|---------|-----|
| **Frontend Web** | http://localhost:5173 |
| **Backend API** | http://localhost/api |
| **Database** | localhost:5432 |

---

## 📱 Aplikasi Mobile

Aplikasi mobile dikembangkan dengan **React Native (Expo)** untuk pelanggan dan teknisi.

**Fitur Mobile:**
- Onboarding & autentikasi (Login, Register)
- Dashboard pelanggan — status layanan & traffic internet
- Pemesanan paket & riwayat order
- Tagihan bulanan & pembayaran
- Tiket gangguan (lapor, pantau status)
- Jadwal kunjungan teknisi
- Testimoni & notifikasi
- Profil & pengaturan

```bash
# Jalankan aplikasi mobile
cd mobile
npm install
npx expo start
```

---

## 📂 Struktur Proyek

```
wifi-management/
├── backend/                     # Laravel 11 (RESTful API)
│   ├── app/
│   │   ├── Http/Controllers/    # API Controllers (Auth, Order, Billing, dll.)
│   │   ├── Models/              # Eloquent Models
│   │   ├── Mail/                # Email Notifications
│   │   └── Services/            # MikrotikService, WhatsAppService
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php           # Semua definisi route API
│
├── frontend/                    # React + Vite (Web Dashboard)
│   └── src/
│       ├── pages/
│       │   ├── admin/           # 15 halaman admin
│       │   ├── customer/        # Halaman pelanggan
│       │   ├── technician/      # Halaman teknisi
│       │   ├── dashboard/       # Dashboard umum
│       │   └── auth/            # Login, Register, Forgot Password
│       ├── components/          # Komponen reusable
│       └── services/            # API service layer
│
├── mobile/                      # React Native (Expo)
│   └── src/
│       ├── screens/             # 13 layar aplikasi
│       ├── components/          # Komponen mobile
│       └── api/                 # API client mobile
│
├── nginx/
│   └── nginx.conf               # Konfigurasi reverse proxy
│
└── docker-compose.yml           # Orkestrasi: Backend, Frontend, DB, Nginx
```

---

## 📸 Demo & Tampilan Aplikasi

### 🎬 Video Demo

[![Demo Video - Sistem Otomasi Layanan Internet ISP](https://img.youtube.com/vi/FUHFOXE-Ikg/maxresdefault.jpg)](https://www.youtube.com/watch?v=FUHFOXE-Ikg)

> 📌 *Klik thumbnail di atas untuk menonton demo lengkap di YouTube*

---

### 🖥️ Web Dashboard — Admin

| Dashboard Utama | Manajemen Order |
|---|---|
| ![Admin Dashboard](docs/screenshots/admin-dashboard.png) | ![Admin Orders](docs/screenshots/admin-orders.png) |

| Manajemen Jaringan | Laporan & Grafik |
|---|---|
| ![Network Topology](docs/screenshots/network-topology.png) | ![Reports](docs/screenshots/admin-reports.png) |

### 👤 Web Dashboard — Pelanggan

| Halaman Utama | Tagihan & Pembayaran |
|---|---|
| ![Customer Dashboard](docs/screenshots/customer-dashboard.png) | ![Billing](docs/screenshots/customer-billing.png) |

### 📱 Aplikasi Mobile

| Onboarding | Dashboard | Tiket Gangguan |
|---|---|---|
| ![Onboarding](docs/screenshots/mobile-onboarding.png) | ![Mobile Dashboard](docs/screenshots/mobile-dashboard.png) | ![Ticket](docs/screenshots/mobile-ticket.png) |

---

## 🎓 Tentang Proyek

| Keterangan | Detail |
|------------|--------|
| **Jenis** | Tugas Akhir Skripsi (S1 Teknik Informatika) |
| **Mitra** | CV Citra Mandiri Grobogan (ISP) |
| **Fokus** | Otomasi operasional ISP berbasis RESTful API |
| **Cakupan** | Full-stack: Backend API, Web Dashboard, Mobile App |

### Kontribusi Utama
- Merancang dan mengimplementasikan **RESTful API** lengkap dengan 50+ endpoint
- Integrasi **Mikrotik RouterOS API** untuk manajemen PPPoE otomatis
- Integrasi **Midtrans Payment Gateway** untuk pembayaran online
- Sistem notifikasi multi-channel (**WhatsApp** + **Email**)
- Penagihan bulanan **otomatis** dengan cron scheduler + isolir overdue
- Arsitektur **Docker Compose** untuk deployment yang konsisten
- Aplikasi mobile cross-platform dengan **React Native (Expo)**

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan akademis dan tidak tersedia untuk distribusi komersial tanpa izin dari pihak terkait.

---

<div align="center">

**Dikembangkan dengan ❤️ untuk CV Citra Mandiri Grobogan**

*Tugas Akhir Skripsi — Teknik Informatika*

</div>

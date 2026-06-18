# 📋 LAPORAN TEKNIS BACKEND
## Sistem Manajemen WiFi — CV Citra Mandiri

**Tanggal:** 18 Juni 2026  
**Versi:** 2.0  
**Framework:** Laravel 13.8 (PHP 8.3+)  
**Database:** PostgreSQL (Production) / SQLite (Development)  
**Autentikasi:** Laravel Sanctum 4.0 (Token-Based API)  
**Manajemen Role:** Spatie Laravel Permission 8.0  

---

## Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Arsitektur & Teknologi](#2-arsitektur--teknologi)
3. [Struktur Direktori Backend](#3-struktur-direktori-backend)
4. [Database & Model](#4-database--model)
5. [Sistem Autentikasi & Otorisasi](#5-sistem-autentikasi--otorisasi)
6. [Daftar API Endpoint](#6-daftar-api-endpoint)
7. [Controller — Penjelasan Detail](#7-controller--penjelasan-detail)
8. [Service Layer](#8-service-layer)
9. [Task Scheduling & Console Commands](#9-task-scheduling--console-commands)
10. [Sistem Email (Mailable)](#10-sistem-email-mailable)
11. [Sistem Notifikasi](#11-sistem-notifikasi)
12. [Integrasi Pihak Ketiga](#12-integrasi-pihak-ketiga)
13. [Database Seeder](#13-database-seeder)
14. [Diagram Relasi Entitas (ERD)](#14-diagram-relasi-entitas-erd)
15. [Alur Bisnis Utama](#15-alur-bisnis-utama)
16. [Konfigurasi Environment](#16-konfigurasi-environment)
17. [Dependensi Proyek](#17-dependensi-proyek)
18. [Ringkasan Statistik Kode](#18-ringkasan-statistik-kode)

---

## 1. Gambaran Umum Sistem

Sistem Manajemen WiFi CV Citra Mandiri adalah aplikasi **full-stack** yang dibangun untuk mengelola layanan internet berbasis WiFi. Backend berfungsi sebagai **RESTful API** yang melayani frontend (React/TypeScript) melalui endpoint JSON.

### Fitur Utama Backend:
- **Autentikasi & Otorisasi** — Registrasi, login, logout dengan token Sanctum dan role-based access (admin, customer, teknisi)
- **Manajemen Paket Internet** — CRUD paket layanan WiFi dengan berbagai kecepatan dan harga
- **Manajemen Pemesanan (Order)** — Pembuatan, pembayaran, dan perubahan status order
- **Sistem Pembayaran** — Integrasi Midtrans Payment Gateway (Snap Token + Webhook)
- **Tagihan Bulanan (Billing)** — Penerbitan otomatis, pembayaran, dan perpanjangan otomatis
- **Task Scheduling** — Penerbitan tagihan otomatis & isolir pelanggan menunggak via cron job harian
- **Tiket Gangguan** — Pelaporan dan penanganan keluhan pelanggan
- **Penjadwalan Teknisi** — Pengaturan jadwal kunjungan teknisi untuk instalasi/perbaikan
- **Upgrade Paket** — Permintaan dan persetujuan upgrade paket oleh admin
- **Monitoring Perangkat Jaringan** — Pemantauan status router/switch/AP secara real-time
- **Integrasi MikroTik RouterOS** — Manajemen PPPoE user otomatis via API
- **Notifikasi WhatsApp** — Pengiriman pesan otomatis ke pelanggan
- **Notifikasi Email** — Email transaksional untuk order dan upgrade
- **Manajemen Pelanggan** — CRUD data pelanggan oleh admin
- **Laporan & Dashboard** — Statistik pendapatan, pelanggan aktif, dan laporan periodik
- **Pencarian Global** — Fitur pencarian lintas entitas (user, tiket, order, paket, notifikasi)
- **Testimonial** — Ulasan pelanggan dengan moderasi admin
- **Pengaturan Dinamis** — Konfigurasi sistem melalui tabel settings (SMTP, Midtrans, WhatsApp API)

---

## 2. Arsitektur & Teknologi

| Komponen | Teknologi |
|---|---|
| **Framework** | Laravel 13.8 |
| **Bahasa** | PHP 8.3+ |
| **Database** | PostgreSQL (Production) / SQLite (Development) |
| **Autentikasi** | Laravel Sanctum 4.0 (Token API) |
| **Manajemen Role** | Spatie Laravel Permission 8.0 |
| **Payment Gateway** | Midtrans (midtrans-php 2.6) |
| **Router API** | RouterOS API PHP 1.7 (evilfreelancer/routeros-api-php) |
| **Queue** | Database Driver |
| **Cache** | Database Driver |
| **Session** | Database Driver |
| **File Storage** | Local (Public Disk) |
| **Mail** | SMTP (Gmail / Configurable via Settings) |
| **Task Scheduler** | Laravel Schedule (2 command harian) |

### Arsitektur Pattern
```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Laravel API    │────▶│  PostgreSQL  │
│  (React/TS)  │◀────│  (Sanctum Auth) │◀────│   Database   │
└──────────────┘     └────────┬────────┘     └──────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              ┌─────▼───┐ ┌──▼────┐ ┌──▼──────────┐
              │ Midtrans │ │ Mail  │ │  MikroTik   │
              │ Payment  │ │ SMTP  │ │  RouterOS   │
              └─────────┘ └───────┘ └─────────────┘
                    │
              ┌─────▼───────────┐
              │ Laravel Scheduler│
              │ (Cron Job Harian)│
              └─────────────────┘
```

---

## 3. Struktur Direktori Backend

```
backend/
├── app/
│   ├── Console/                    # Artisan Commands & Scheduler
│   │   └── Commands/
│   │       ├── GenerateMonthlyBillings.php   # billing:generate
│   │       └── CheckOverdueBillings.php      # billing:check-overdue
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Api/                # API Controllers (12 file)
│   │       │   ├── AuthController.php
│   │       │   ├── BillingController.php
│   │       │   ├── CustomerController.php
│   │       │   ├── OrderController.php
│   │       │   ├── OwnerUserController.php
│   │       │   ├── PaketController.php
│   │       │   ├── PaymentController.php
│   │       │   ├── ReportController.php
│   │       │   ├── SettingController.php
│   │       │   ├── TechnicianController.php
│   │       │   ├── TestimonialController.php
│   │       │   └── UpgradeController.php
│   │       ├── Controller.php
│   │       ├── NetworkDeviceController.php
│   │       ├── NotificationController.php
│   │       ├── ProfileController.php
│   │       ├── SearchController.php
│   │       ├── TechnicianAccountController.php
│   │       ├── TechnicianScheduleController.php
│   │       └── TicketController.php
│   ├── Mail/                       # Mailable Classes (5 file)
│   │   ├── OrderActivatedMail.php
│   │   ├── OrderCreatedMail.php
│   │   ├── OrderRejectedMail.php
│   │   ├── UpgradeProcessedMail.php
│   │   └── UpgradeRequestedMail.php
│   ├── Models/                     # Eloquent Models (11 file)
│   │   ├── Billing.php
│   │   ├── NetworkDevice.php
│   │   ├── Notification.php
│   │   ├── Order.php
│   │   ├── Paket.php
│   │   ├── Setting.php
│   │   ├── TechnicianSchedule.php
│   │   ├── Testimonial.php
│   │   ├── Ticket.php
│   │   ├── UpgradeRequest.php
│   │   └── User.php
│   ├── Providers/                  # Service Providers
│   │   └── AppServiceProvider.php  # Dynamic SMTP config dari tabel settings
│   └── Services/                   # Business Logic Services (2 file)
│       ├── MikrotikService.php
│       └── WhatsAppService.php
├── config/                         # Konfigurasi (10 file)
│   ├── app.php
│   ├── auth.php
│   ├── cache.php
│   ├── database.php
│   ├── filesystems.php
│   ├── logging.php
│   ├── mail.php
│   ├── queue.php
│   ├── services.php
│   └── session.php
├── database/
│   ├── database.sqlite             # Database SQLite (dev)
│   ├── migrations/                 # Migrasi (24 file)
│   └── seeders/                    # Seeder (3 file)
│       ├── DatabaseSeeder.php
│       ├── PaketSeeder.php
│       └── RoleSeeder.php
├── resources/
│   └── views/
│       └── emails/                 # Template Email (5 file)
│           ├── order-activated.blade.php
│           ├── order-created.blade.php
│           ├── order-rejected.blade.php
│           ├── upgrade-processed.blade.php
│           └── upgrade-requested.blade.php
├── routes/
│   ├── api.php                     # Definisi route API (145 baris)
│   ├── console.php                 # Definisi Laravel Schedule (2 jadwal)
│   └── web.php
├── composer.json
└── .env
```

**Total File Backend:**
- **20 Controllers** (12 Api + 8 General)
- **11 Models**
- **5 Mailable Classes**
- **5 Email Blade Templates**
- **2 Service Classes**
- **2 Artisan Console Commands**
- **24 Database Migrations**
- **3 Seeders**
- **1 Service Provider** (dengan dynamic SMTP config)
- **10 Config Files**

---

## 4. Database & Model

### 4.1 Daftar Tabel & Model

| No | Model | Tabel | Deskripsi |
|---|---|---|---|
| 1 | `User` | `users` | Data pengguna (customer, admin, teknisi) |
| 2 | `Paket` | `pakets` | Paket layanan internet |
| 3 | `Order` | `orders` | Pemesanan layanan WiFi |
| 4 | `Billing` | `billings` | Tagihan bulanan pelanggan |
| 5 | `Ticket` | `tickets` | Tiket pengaduan gangguan |
| 6 | `TechnicianSchedule` | `technician_schedules` | Jadwal kunjungan teknisi |
| 7 | `Notification` | `notifications` | Notifikasi in-app |
| 8 | `NetworkDevice` | `network_devices` | Perangkat jaringan (router, switch, dll) |
| 9 | `Testimonial` | `testimonials` | Ulasan/testimoni pelanggan |
| 10 | `UpgradeRequest` | `upgrade_requests` | Permintaan upgrade paket |
| 11 | `Setting` | `settings` | Pengaturan sistem (key-value) |

### 4.2 Detail Kolom Setiap Model

#### User (`users`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `name` | String | Nama lengkap |
| `email` | String (unique) | Alamat email |
| `password` | String (hashed) | Password (bcrypt) |
| `avatar` | String (nullable) | Path file avatar |
| `phone` | String (nullable) | Nomor telepon/WhatsApp |
| `address` | String (nullable) | Alamat |
| `email_notif` | Boolean | Preferensi notifikasi email |
| `wa_notif` | Boolean | Preferensi notifikasi WhatsApp |
| `email_verified_at` | DateTime | Timestamp verifikasi email |
| `remember_token` | String | Token remember me |
| `created_at` | Timestamp | Waktu dibuat |
| `updated_at` | Timestamp | Waktu diperbarui |

**Traits:** `HasApiTokens`, `HasFactory`, `HasRoles`, `Notifiable`

**Relasi:**
- `hasMany(UpgradeRequest)` — Satu user memiliki banyak upgrade request
- Role dikelola melalui Spatie `HasRoles` trait

**Accessor:**
- `avatar_url` — URL lengkap avatar (`asset('storage/' . $avatar)`)

---

#### Paket (`pakets`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `nama` | String | Nama paket (Basic, Standard, Premium, Ultra) |
| `deskripsi` | String (nullable) | Deskripsi paket |
| `kecepatan` | Integer | Kecepatan internet (Mbps) |
| `fup` | String (nullable) | Fair Usage Policy |
| `harga` | Integer | Harga per bulan (Rupiah) |
| `durasi` | Integer | Durasi langganan (hari) |
| `is_aktif` | Boolean | Status keaktifan paket |

**Relasi:**
- `hasMany(UpgradeRequest, 'old_paket_id')` — Paket lama pada upgrade
- `hasMany(UpgradeRequest, 'new_paket_id')` — Paket baru pada upgrade

---

#### Order (`orders`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pelanggan |
| `paket_id` | BigInt (FK) | ID paket yang dipesan |
| `status` | Enum | `pending`, `aktif`, `ditolak`, `selesai`, `suspend` |
| `alamat` | String | Alamat pemasangan |
| `catatan` | String (nullable) | Catatan tambahan |
| `tanggal_mulai` | Date | Tanggal mulai layanan |
| `tanggal_selesai` | Date | Tanggal selesai layanan |
| `total_harga` | Integer | Total harga (Rupiah) |
| `ip_address` | String (nullable) | IP Address pelanggan |
| `tipe_perangkat` | String (nullable) | Tipe perangkat yang digunakan |
| `mikrotik_username` | String (nullable) | Username PPPoE MikroTik |
| `mikrotik_password` | String (nullable) | Password PPPoE MikroTik |
| `network_device_id` | BigInt (nullable) | ID perangkat jaringan terkait |

**Relasi:**
- `belongsTo(User)` — Pemilik order
- `belongsTo(Paket)` — Paket yang dipesan
- `hasMany(UpgradeRequest)` — Permintaan upgrade terkait

---

#### Billing (`billings`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pelanggan |
| `order_id` | BigInt (FK) | ID order terkait |
| `jumlah_tagihan` | Integer | Jumlah tagihan (Rupiah) |
| `status` | Enum | `unpaid`, `paid`, `overdue` |
| `jatuh_tempo` | Date | Tanggal jatuh tempo |
| `tanggal_bayar` | DateTime (nullable) | Tanggal pembayaran |

**Relasi:**
- `belongsTo(User)` — Pelanggan
- `belongsTo(Order)` — Order terkait

---

#### Ticket (`tickets`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pelapor |
| `judul` | String | Judul gangguan |
| `deskripsi` | String | Deskripsi gangguan |
| `status` | Enum | `menunggu`, `diproses`, `selesai` |
| `prioritas` | Enum | `rendah`, `sedang`, `tinggi` |
| `foto` | String (nullable) | Path foto bukti gangguan |

**Relasi:**
- `belongsTo(User)` — Pelapor

---

#### TechnicianSchedule (`technician_schedules`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pelanggan terkait |
| `ticket_id` | BigInt (nullable FK) | ID tiket gangguan |
| `order_id` | BigInt (nullable FK) | ID order instalasi |
| `nama_teknisi` | String | Nama teknisi yang ditugaskan |
| `tanggal_kunjungan` | Date | Tanggal kunjungan |
| `status` | Enum | `menunggu`, `berangkat`, `pengerjaan`, `selesai`, `dibatalkan` |

**Relasi:**
- `belongsTo(User)` — Pelanggan
- `belongsTo(Ticket)` — Tiket gangguan (jika perbaikan)
- `belongsTo(Order)` — Order (jika instalasi baru)

---

#### Notification (`notifications`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID penerima |
| `title` | String | Judul notifikasi |
| `message` | String | Isi pesan |
| `is_read` | Boolean | Status sudah dibaca |
| `type` | String | Tipe notifikasi (`system`, `order`, `billing`, `ticket`, `order_update`, `ticket_update`, `billing_overdue`, `upgrade_update`) |

**Relasi:**
- `belongsTo(User)` — Penerima

**Static Methods:**
- `notifyAdmins($title, $message, $type)` — Kirim notifikasi ke semua user dengan role admin
- `notifyTechnician($technicianName, $title, $message, $type)` — Kirim notifikasi ke teknisi berdasarkan nama

---

#### NetworkDevice (`network_devices`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `name` | String | Nama perangkat |
| `type` | Enum | `Router`, `Switch`, `OLT`, `Access Point`, `Server`, `Other` |
| `ip_address` | String | Alamat IP perangkat |
| `username` | String (nullable) | Username login perangkat |
| `password` | String (hidden) | Password login perangkat |
| `api_port` | String (nullable) | Port API (default 8728) |
| `is_active` | Boolean | Status aktif/nonaktif |
| `status` | String | Status operasional (`online`, `offline`, `terisolir`) |
| `last_seen_at` | DateTime (nullable) | Terakhir terlihat online |

---

#### Testimonial (`testimonials`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pembuat ulasan |
| `rating` | Integer | Rating 1-5 |
| `content` | String | Isi ulasan |
| `is_published` | Boolean | Status publikasi (moderasi admin) |

**Relasi:**
- `belongsTo(User)` — Pembuat ulasan

---

#### UpgradeRequest (`upgrade_requests`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `user_id` | BigInt (FK) | ID pelanggan |
| `order_id` | BigInt (FK) | ID order yang diupgrade |
| `old_paket_id` | BigInt (FK) | ID paket lama |
| `new_paket_id` | BigInt (FK) | ID paket baru |
| `status` | Enum | `pending`, `approved`, `rejected` |
| `admin_catatan` | String (nullable) | Catatan admin |

**Relasi:**
- `belongsTo(User)`, `belongsTo(Order)`, `belongsTo(Paket, 'old_paket_id')`, `belongsTo(Paket, 'new_paket_id')`

---

#### Setting (`settings`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BigInt (PK) | Auto increment |
| `key` | String (unique) | Kunci pengaturan |
| `value` | String | Nilai pengaturan |

**Key yang digunakan sistem:**
- `midtrans_server_key` — Server key Midtrans
- `midtrans_client_key` — Client key Midtrans
- `midtrans_is_production` — Mode production/sandbox Midtrans
- `wa_api_url` — URL API WhatsApp
- `wa_api_key` — API Key WhatsApp
- `smtp_host`, `smtp_port`, `smtp_username`, `smtp_password`, `smtp_from_name` — Konfigurasi SMTP dinamis

---

## 5. Sistem Autentikasi & Otorisasi

### 5.1 Autentikasi (Laravel Sanctum)

Menggunakan **Token-Based Authentication** via Laravel Sanctum:

| Fitur | Implementasi |
|---|---|
| **Register** | `POST /api/register` → Validasi input (name, email, phone, password) → buat user → assign role `customer` → kirim WhatsApp welcome → generate token |
| **Login** | `POST /api/login` → Validasi credentials → generate token → return user + roles |
| **Me** | `GET /api/me` → Return user info + roles (protected) |
| **Logout** | `POST /api/logout` → Hapus current access token |

### 5.2 Role & Permission (Spatie)

Terdapat **3 role** dalam sistem:

| Role | Akses |
|---|---|
| **`customer`** | Melihat paket, buat order, bayar tagihan, buat tiket, lihat jadwal, kirim testimonial, upgrade paket |
| **`admin`** | Semua fitur customer + kelola order, billing, tiket, jadwal teknisi, paket, pelanggan, upgrade, testimonial, pengaturan, laporan, akun teknisi |
| **`teknisi`** | Dashboard teknisi, lihat instalasi yang ditugaskan, update status instalasi/tiket, upload bukti foto |

### 5.3 Middleware Proteksi Route

```php
// Route publik (tanpa auth)
Route::post('/register', ...);
Route::post('/login', ...);
Route::get('/pakets', ...);
Route::post('/midtrans/webhook', ...);
Route::get('/testimonials/public', ...);
Route::get('/settings/public', ...);
Route::get('/network-devices/status', ...);
Route::apiResource('technician-accounts', ...);

// Route terproteksi (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Semua user yang login
    Route::get('/me', ...);
    Route::post('/logout', ...);
    
    // Hanya Admin
    Route::middleware('role:admin')->group(function () {
        // Admin-only endpoints
    });
    
    // Teknisi
    Route::get('/technician/dashboard', ...);
    Route::get('/technician/installations', ...);
});
```

---

## 6. Daftar API Endpoint

### 6.1 Route Publik (Tanpa Autentikasi)

| Method | Endpoint | Controller | Deskripsi |
|---|---|---|---|
| `POST` | `/api/register` | `AuthController@register` | Registrasi akun baru |
| `POST` | `/api/login` | `AuthController@login` | Login |
| `GET` | `/api/pakets` | `PaketController@index` | Daftar paket aktif |
| `GET` | `/api/pakets/{id}` | `PaketController@show` | Detail paket |
| `POST` | `/api/midtrans/webhook` | `PaymentController@webhook` | Webhook callback Midtrans |
| `GET` | `/api/testimonials/public` | `TestimonialController@publicIndex` | Testimoni publik (landing page) |
| `GET` | `/api/settings/public` | `SettingController@publicIndex` | Pengaturan publik (Midtrans client key) |
| `GET` | `/api/network-devices/status` | `NetworkDeviceController@status` | Status perangkat jaringan |
| CRUD | `/api/technician-accounts` | `TechnicianAccountController` | Manajemen akun teknisi |

### 6.2 Route Terproteksi — Semua User Login

| Method | Endpoint | Controller | Deskripsi |
|---|---|---|---|
| `GET` | `/api/me` | `AuthController@me` | Info user saat ini |
| `POST` | `/api/logout` | `AuthController@logout` | Logout |
| `GET` | `/api/profile` | `ProfileController@show` | Lihat profil + roles |
| `PUT` | `/api/profile` | `ProfileController@update` | Update profil + avatar |
| `PUT` | `/api/profile/password` | `ProfileController@changePassword` | Ganti password |
| `GET` | `/api/search` | `SearchController@index` | Pencarian global |
| `GET` | `/api/orders/my` | `OrderController@myOrders` | Order milik customer |
| `GET` | `/api/orders/{id}` | `OrderController@show` | Detail order |
| `POST` | `/api/orders` | `OrderController@store` | Buat order baru |
| `POST` | `/api/orders/{id}/pay` | `PaymentController@getSnapToken` | Dapatkan Snap Token pembayaran |
| `POST` | `/api/orders/{id}/demo-pay-success` | `PaymentController@demoOrderSuccess` | Demo pembayaran sukses |
| `POST` | `/api/orders/{id}/upgrade` | `UpgradeController@store` | Ajukan upgrade paket |
| `GET` | `/api/my-billings` | `BillingController@myBillings` | Tagihan milik customer |
| `POST` | `/api/billings/{id}/pay` | `PaymentController@getBillingSnapToken` | Snap Token tagihan |
| `POST` | `/api/billings/{id}/demo-pay-success` | `PaymentController@demoBillingSuccess` | Demo bayar tagihan sukses |
| `GET` | `/api/traffic/my` | `OrderController@myTraffic` | Data traffic customer |
| `GET` | `/api/tickets` | `TicketController@myTickets` | Tiket milik customer |
| `POST` | `/api/tickets` | `TicketController@store` | Buat tiket gangguan baru |
| `GET` | `/api/schedules/my` | `TechnicianScheduleController@mySchedules` | Jadwal teknisi (customer) |
| `GET` | `/api/notifications` | `NotificationController@index` | Daftar notifikasi |
| `PATCH` | `/api/notifications/{id}/read` | `NotificationController@markAsRead` | Tandai sudah dibaca |
| `GET` | `/api/testimonials/my` | `TestimonialController@myTestimonial` | Testimonial sendiri |
| `POST` | `/api/testimonials` | `TestimonialController@store` | Kirim/update testimonial |
| CRUD | `/api/network-devices` | `NetworkDeviceController` | CRUD perangkat jaringan |

### 6.3 Route Admin Only (`role:admin`)

| Method | Endpoint | Controller | Deskripsi |
|---|---|---|---|
| `GET` | `/api/admin/tickets` | `TicketController@indexAdmin` | Semua tiket gangguan |
| `POST` | `/api/admin/tickets` | `TicketController@storeAdmin` | Buat tiket (atas nama user) |
| `PATCH` | `/api/admin/tickets/{id}/status` | `TicketController@updateStatus` | Update status tiket |
| `GET` | `/api/admin/technician-schedules` | `TechnicianScheduleController@indexAdmin` | Semua jadwal teknisi |
| `POST` | `/api/admin/technician-schedules` | `TechnicianScheduleController@storeAdmin` | Buat jadwal teknisi |
| `PATCH` | `/api/admin/technician-schedules/{id}/status` | `TechnicianScheduleController@updateStatus` | Update status jadwal |
| `DELETE` | `/api/admin/technician-schedules/{id}` | `TechnicianScheduleController@destroy` | Hapus jadwal |
| `GET` | `/api/admin/payments` | `PaymentController@indexAdmin` | Riwayat pembayaran |
| `GET` | `/api/admin/billings` | `BillingController@indexAdmin` | Semua tagihan |
| `POST` | `/api/admin/billings` | `BillingController@storeAdmin` | Buat tagihan baru |
| `PATCH` | `/api/admin/billings/{id}/pay` | `BillingController@markAsPaid` | Tandai lunas manual |
| `POST` | `/api/admin/billing/generate` | `BillingController@triggerGenerate` | Manual trigger `billing:generate` |
| `POST` | `/api/admin/billing/check-overdue` | `BillingController@triggerCheckOverdue` | Manual trigger `billing:check-overdue` |
| `GET` | `/api/admin/pakets` | `PaketController@indexAdmin` | Semua paket (termasuk nonaktif) |
| `POST` | `/api/pakets` | `PaketController@store` | Buat paket baru |
| `PUT` | `/api/pakets/{id}` | `PaketController@update` | Update paket |
| `DELETE` | `/api/pakets/{id}` | `PaketController@destroy` | Hapus paket |
| `GET` | `/api/orders` | `OrderController@index` | Semua order |
| `PATCH` | `/api/orders/{id}/status` | `OrderController@updateStatus` | Update status order |
| `PATCH` | `/api/orders/{id}/specs` | `OrderController@updateSpecs` | Update spesifikasi teknis |
| `GET` | `/api/admin/upgrades` | `UpgradeController@indexAdmin` | Semua permintaan upgrade |
| `PATCH` | `/api/admin/upgrades/{id}/status` | `UpgradeController@updateStatus` | Setujui/tolak upgrade |
| `GET` | `/api/reports/summary` | `ReportController@summary` | Laporan ringkasan dashboard |
| `GET` | `/api/customers` | `CustomerController@index` | Daftar pelanggan |
| `POST` | `/api/customers` | `CustomerController@store` | Tambah pelanggan |
| `PUT` | `/api/customers/{id}` | `CustomerController@update` | Update pelanggan |
| `DELETE` | `/api/customers/{id}` | `CustomerController@destroy` | Hapus pelanggan |
| `PATCH` | `/api/customers/{id}/status` | `CustomerController@updateStatus` | Update status pelanggan |
| `GET` | `/api/admin/testimonials` | `TestimonialController@indexAdmin` | Semua testimonial |
| `PATCH` | `/api/admin/testimonials/{id}/status` | `TestimonialController@updateStatus` | Setujui/tolak testimonial |
| `DELETE` | `/api/admin/testimonials/{id}` | `TestimonialController@destroy` | Hapus testimonial |
| `GET` | `/api/settings` | `SettingController@index` | Semua pengaturan |
| `POST` | `/api/settings` | `SettingController@update` | Update pengaturan |
| `GET` | `/api/admin/users` | `OwnerUserController@index` | Daftar semua user + roles |

### 6.4 Route Teknisi

| Method | Endpoint | Controller | Deskripsi |
|---|---|---|---|
| `GET` | `/api/technician/dashboard` | `TechnicianController@dashboard` | Dashboard teknisi |
| `GET` | `/api/technician/installations` | `TechnicianScheduleController@myInstallations` | Instalasi yang ditugaskan |
| `PATCH` | `/api/technician/installations/{id}/status` | `TechnicianScheduleController@updateStatus` | Update status instalasi |
| `GET` | `/api/technician/tickets` | `TicketController@indexAdmin` | Tiket gangguan |
| `PATCH` | `/api/technician/tickets/{id}/status` | `TicketController@updateStatus` | Update status tiket |
| `POST` | `/api/technician/tickets/{id}/upload` | `TicketController@uploadFoto` | Upload bukti foto perbaikan |

**Total Endpoint: 55+ endpoint API**

---

## 7. Controller — Penjelasan Detail

### 7.1 AuthController
**Lokasi:** `app/Http/Controllers/Api/AuthController.php` (86 baris)

| Method | Fungsi |
|---|---|
| `register()` | Validasi input (name, email, phone, password+confirmed) → buat user → assign role `customer` → kirim WhatsApp welcome message → generate Sanctum token |
| `login()` | Validasi credentials → `Auth::attempt()` → generate token → return user + roles |
| `me()` | Return info user yang sedang login beserta roles |
| `logout()` | Hapus current access token via `currentAccessToken()->delete()` |

---

### 7.2 OrderController
**Lokasi:** `app/Http/Controllers/Api/OrderController.php` (181 baris)

| Method | Fungsi |
|---|---|
| `myOrders()` | Ambil semua order milik user dengan relasi paket dan pending upgrade requests |
| `myTraffic()` | Return mock data traffic (download/upload) berdasarkan kecepatan paket aktif user |
| `store()` | Buat order baru (paket_id, alamat, catatan) → kirim email `OrderCreatedMail` → kirim WA → notifikasi admin |
| `show()` | Detail order milik user (scoped by user_id) |
| `index()` | [Admin] Semua order dengan relasi user & paket |
| `updateStatus()` | [Admin] Update status order (pending/aktif/ditolak/selesai) → kirim email sesuai status (`OrderActivatedMail` / `OrderRejectedMail`) → notifikasi user |
| `updateSpecs()` | [Admin] Update spesifikasi teknis (IP Address, tipe perangkat) |

---

### 7.3 PaymentController
**Lokasi:** `app/Http/Controllers/Api/PaymentController.php` (299 baris)

Controller terbesar yang menangani seluruh proses pembayaran.

| Method | Fungsi |
|---|---|
| `__construct()` | Konfigurasi Midtrans dari tabel `settings` atau `.env` (server key, production mode, sanitize, 3DS) |
| `indexAdmin()` | [Admin] Gabungkan data pembayaran dari Orders (aktif/selesai/suspend) + Billings (paid), format unified, urutkan terbaru |
| `getSnapToken()` | Generate Midtrans Snap Token untuk pembayaran order pemasangan baru (validasi: hanya status pending, hanya pemilik/admin) |
| `getBillingSnapToken()` | Generate Midtrans Snap Token untuk pembayaran tagihan bulanan (validasi: bukan yang sudah paid) |
| `webhook()` | Handle callback Midtrans → parse order ID (INV-ORD/INV-BIL) → update status → kelola PPPoE MikroTik |
| `demoOrderSuccess()` | Simulasi pembayaran order sukses (untuk demo) + buat PPPoE user di MikroTik |
| `demoBillingSuccess()` | Simulasi pembayaran tagihan sukses (untuk demo) + enable PPPoE user |

**Alur Webhook Midtrans:**
```
Midtrans → POST /api/midtrans/webhook
        → Parse order_id (INV-ORD-{id}-{timestamp} atau INV-BIL-{id}-{timestamp})
        → Cek transaction_status:
           • capture + accept / settlement = SUKSES
           • cancel / deny / expire = GAGAL
           • pending = PENDING
        → Jika Order sukses:
           • Status → aktif
           • Set tanggal_mulai = now, tanggal_selesai = +durasi hari
           • Buat PPPoE user di MikroTik (username random, password random)
           • Simpan mikrotik_username & mikrotik_password di order
        → Jika Order gagal:
           • Status → ditolak
        → Jika Billing sukses:
           • Status → paid, set tanggal_bayar
           • Perpanjang order.tanggal_selesai += durasi paket
           • Kembalikan order.status → aktif
           • Enable PPPoE user di MikroTik
        → Jika Billing gagal + sudah overdue:
           • Status → overdue
           • Disable PPPoE user di MikroTik
```

---

### 7.4 BillingController
**Lokasi:** `app/Http/Controllers/Api/BillingController.php` (105 baris)

| Method | Fungsi |
|---|---|
| `indexAdmin()` | [Admin] Semua tagihan dengan relasi user & order.paket, urut terbaru |
| `myBillings()` | Tagihan milik customer yang sedang login |
| `storeAdmin()` | [Admin] Buat tagihan baru (order_id, jumlah, jatuh_tempo, status) → notifikasi in-app user → kirim WA |
| `markAsPaid()` | [Admin] Tandai tagihan lunas → status billing → paid → perpanjang order.tanggal_selesai → status order → aktif → enable PPPoE MikroTik → notifikasi user → kirim WA |
| `triggerGenerate()` | [Admin] Manual trigger untuk command `billing:generate` (untuk keperluan demo/testing) |
| `triggerCheckOverdue()` | [Admin] Manual trigger untuk command `billing:check-overdue` (untuk keperluan demo/testing) |

---

### 7.5 TicketController
**Lokasi:** `app/Http/Controllers/TicketController.php` (173 baris)

| Method | Fungsi |
|---|---|
| `myTickets()` | Tiket milik customer, urut terbaru |
| `store()` | Customer buat tiket + upload foto (max 5MB) → notifikasi admin |
| `storeAdmin()` | Admin buat tiket atas nama user tertentu |
| `indexAdmin()` | Semua tiket diurutkan custom: menunggu → diproses → selesai, lalu terbaru |
| `updateStatus()` | Update status tiket (menunggu/diproses/selesai) → auto-fix demo (perbaikan IP device) → notifikasi in-app + WA |
| `uploadFoto()` | Teknisi upload bukti foto perbaikan (max 5MB) + update status → auto-fix demo → WA notifikasi |

**Fitur Auto-Fix Demo:**
Ketika tiket ditandai "selesai", sistem otomatis mencari NetworkDevice yang namanya mengandung nama user pelapor, dan jika IP-nya berakhiran `.99` (simulasi fiber putus), diubah menjadi `.1` (simulasi diperbaiki).

---

### 7.6 TechnicianScheduleController
**Lokasi:** `app/Http/Controllers/TechnicianScheduleController.php` (161 baris)

| Method | Fungsi |
|---|---|
| `mySchedules()` | Jadwal kunjungan untuk customer yang sedang login, urut terbaru |
| `myInstallations()` | Instalasi yang ditugaskan ke teknisi yang login (filter by nama_teknisi, status aktif) |
| `indexAdmin()` | [Admin] Semua jadwal teknisi dengan relasi lengkap |
| `storeAdmin()` | [Admin] Buat jadwal baru (ticket_id/order_id, nama_teknisi, tanggal) → update status tiket ke "Diproses" → notifikasi customer + teknisi |
| `updateStatus()` | Update status jadwal (menunggu/selesai/dibatalkan) → jika selesai: update tiket → auto-fix IP demo → notifikasi |
| `destroy()` | Hapus jadwal |

---

### 7.7 UpgradeController
**Lokasi:** `app/Http/Controllers/Api/UpgradeController.php` (141 baris)

| Method | Fungsi |
|---|---|
| `store()` | Customer ajukan upgrade → cek order milik sendiri → cek order status aktif → cek tidak ada pending request → buat UpgradeRequest → notifikasi admin + email `UpgradeRequestedMail` |
| `indexAdmin()` | [Admin] Semua upgrade request diurutkan: pending → approved → rejected, lalu terbaru |
| `updateStatus()` | [Admin] Setujui/tolak → jika approved: ubah paket_id & total_harga di order → notifikasi user + email `UpgradeProcessedMail` |

**Catatan:** Terdapat placeholder TODO untuk integrasi Mikrotik RouterOS API agar PPPoE Profile klien berubah otomatis saat upgrade disetujui.

---

### 7.8 CustomerController
**Lokasi:** `app/Http/Controllers/Api/CustomerController.php` (144 baris)

| Method | Fungsi |
|---|---|
| `index()` | Daftar semua user role `customer` + attach latest order & status, urut terbaru |
| `store()` | Admin buat customer baru (name, email, password, phone, address) → assign role `customer` |
| `update()` | Update data customer (nama, email, phone, address, password optional) |
| `updateStatus()` | Update status melalui latest order |
| `destroy()` | Hapus customer |

---

### 7.9 ReportController
**Lokasi:** `app/Http/Controllers/Api/ReportController.php` (139 baris)

Endpoint `GET /api/reports/summary` mengembalikan data dashboard lengkap:

| Data | Keterangan |
|---|---|
| `total_pendapatan` | Total pendapatan dari order aktif + selesai |
| `pendapatan_bulan_ini` | Pendapatan bulan berjalan |
| `pelanggan_aktif` | Jumlah order berstatus aktif |
| `pelanggan_suspend` | Jumlah order berstatus ditolak |
| `total_order` | Total semua order |
| `order_pending` | Order menunggu proses |
| `tiket_aktif` | Tiket yang belum selesai/ditutup |
| `teknisi_bertugas` | Teknisi unik yang bertugas hari ini |
| `paket_terlaris` | Top 5 paket berdasarkan jumlah order |
| `pendapatan_per_bulan` | Grafik pendapatan per periode (7d, 1m, 6m, 1y) |
| `status_breakdown` | Breakdown jumlah order per status |

**Pendapatan per periode** mendukung 4 mode:
- `7d` — 7 hari terakhir (grouping per hari)
- `1m` — 30 hari terakhir (grouping per hari)
- `6m` — 6 bulan terakhir (grouping per bulan) — **default**
- `1y` — 12 bulan terakhir (grouping per bulan)

---

### 7.10 SearchController
**Lokasi:** `app/Http/Controllers/SearchController.php` (240 baris)

Pencarian global dengan minimum 2 karakter dan perilaku berbeda berdasarkan role:

**Admin Search:** Cari di Users (name/email), Tickets (judul/deskripsi), Orders (user name/paket nama), Pakets (nama)

**Customer Search:**
- Static Menus (navigasi shortcut: Dashboard, Layanan, Order, Tagihan, dll)
- Tickets milik sendiri (judul/deskripsi + keyword generik: tiket, pengaduan, komplain, rusak, mati)
- Orders milik sendiri (paket nama + keyword generik: paket, layanan)
- Pakets (nama paket)
- Technician Schedules (nama teknisi, status)
- Notifications (title/message)

Hasil disortir secara global berdasarkan `created_at` descending.

---

### 7.11 TechnicianController
**Lokasi:** `app/Http/Controllers/Api/TechnicianController.php` (65 baris)

Dashboard teknisi yang mengembalikan:
- `tugasHariIni` — Total tugas aktif
- `gangguanAktif` — Jumlah tiket gangguan yang ditangani
- `instalasiBaru` — Jumlah instalasi baru yang ditugaskan
- `surveyLokasi` — Placeholder (0)
- `schedules[]` — Array jadwal aktif dengan detail (tipe, waktu, judul, subtitle, warna)

---

### 7.12 Controller Lainnya

| Controller | Lokasi | Baris | Fungsi |
|---|---|---|---|
| `ProfileController` | `app/Http/Controllers/ProfileController.php` | 69 | Lihat profil (+ roles), update profil + avatar (upload file, hapus avatar lama), ganti password (validasi password lama) |
| `NotificationController` | `app/Http/Controllers/NotificationController.php` | 30 | Daftar notifikasi milik user (urut terbaru), tandai sudah dibaca (scoped by user_id) |
| `NetworkDeviceController` | `app/Http/Controllers/NetworkDeviceController.php` | 152 | CRUD perangkat jaringan + endpoint status monitoring dengan simulasi demo (online/offline/terisolir berdasarkan status order & tiket) |
| `TechnicianAccountController` | `app/Http/Controllers/TechnicianAccountController.php` | 80 | CRUD akun teknisi (role `teknisi`) — index, store, update, destroy |
| `PaketController` | `app/Http/Controllers/Api/PaketController.php` | 72 | CRUD paket internet — listing publik (hanya aktif), listing admin (semua), store, update, destroy |
| `TestimonialController` | `app/Http/Controllers/Api/TestimonialController.php` | 97 | CRUD testimonial — publik (approved, max 6), my testimonial, store/update (reset approval), admin: listing, approve/reject, delete |
| `SettingController` | `app/Http/Controllers/Api/SettingController.php` | 57 | CRUD pengaturan sistem — public (midtrans keys only), admin: all settings, batch update (upsert) |
| `OwnerUserController` | `app/Http/Controllers/Api/OwnerUserController.php` | 27 | Daftar semua user beserta roles (id, name, email, roles) |

---

## 8. Service Layer

### 8.1 MikrotikService
**Lokasi:** `app/Services/MikrotikService.php` (156 baris)

Integrasi dengan MikroTik RouterOS untuk manajemen user PPPoE secara otomatis.

| Method | Fungsi |
|---|---|
| `__construct($device)` | Koneksi ke router aktif pertama (tipe Router/Server). Jika IP localhost → mode demo. Timeout 2 detik |
| `getDevice()` | Return NetworkDevice yang sedang terhubung |
| `addPppoeSecret($username, $password, $profile, $comment)` | Tambah PPPoE secret baru. Jika sudah ada, update password dan enable |
| `enablePppoeSecret($username)` | Aktifkan kembali PPPoE secret yang disabled |
| `disablePppoeSecret($username)` | Nonaktifkan PPPoE secret + disconnect semua koneksi aktif user tersebut |

**Fitur Penting:**
- **Demo Mode** — Jika IP `127.0.0.1`, `localhost`, atau `0.0.0.0`, operasi dilog tanpa koneksi nyata
- **Timeout 2 detik** — Mencegah hang jika router offline
- **Fallback otomatis** — Jika koneksi gagal, auto-switch ke demo mode
- **Idempotent** — `addPppoeSecret()` cek terlebih dahulu apakah user sudah ada; jika ya, update saja
- **RouterOS API Commands:**
  - `/ppp/secret/print` — Cek existing user
  - `/ppp/secret/add` — Tambah user baru
  - `/ppp/secret/set` — Update user existing
  - `/ppp/secret/enable` — Enable user
  - `/ppp/secret/disable` — Disable user
  - `/ppp/active/print` + `/ppp/active/remove` — Disconnect koneksi aktif

---

### 8.2 WhatsAppService
**Lokasi:** `app/Services/WhatsAppService.php` (121 baris)

Layanan pengiriman pesan WhatsApp otomatis menggunakan API eksternal (semua method static).

| Method | Fungsi |
|---|---|
| `sendMessage($phone, $message)` | Kirim pesan WA — ambil konfigurasi dari tabel `settings` (wa_api_url, wa_api_key). Semua pesan dilog ke channel `single` |
| `sendWelcomeMessage($user)` | Pesan selamat datang saat registrasi — info akun berhasil dibuat |
| `sendOrderNotification($user, $order, $paket)` | Konfirmasi pemesanan — detail paket, harga, status |
| `sendBillingNotification($user, $billing)` | Tagihan baru (pengingat jatuh tempo) ATAU konfirmasi pembayaran berhasil |
| `sendTicketUpdateNotification($user, $ticket)` | Update status tiket — mapping status ke Bahasa Indonesia (Sedang Menunggu/Dikerjakan/Selesai) |
| `sendSuspendNotification($user, $billing)` | Notifikasi bahwa layanan diisolir karena menunggak tagihan |

**Status Saat Ini:** Telah terintegrasi secara dinamis dengan provider API WhatsApp (mendukung Fonnte dan Wablas). Jika API URL/Key tidak dikonfigurasi, sistem akan otomatis melakukan *fallback* ke simulated logging.

---

## 9. Task Scheduling & Console Commands

### 9.1 Konfigurasi Schedule

**Lokasi:** `routes/console.php`

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('billing:generate')->daily();
Schedule::command('billing:check-overdue')->daily();
```

Kedua command dijalankan **setiap hari** oleh Laravel Scheduler. Untuk mengaktifkan scheduler di production, tambahkan cron entry berikut:

```bash
* * * * * cd /path-to-backend && php artisan schedule:run >> /dev/null 2>&1
```

---

### 9.2 GenerateMonthlyBillings (`billing:generate`)

**Lokasi:** `app/Console/Commands/GenerateMonthlyBillings.php` (84 baris)  
**Signature:** `billing:generate`  
**Deskripsi:** Generate monthly billings for active users 7 days before expiration  
**Jadwal:** Harian (daily)

**Alur Kerja:**
```
1. Cari order dengan status 'aktif' DAN tanggal_selesai ≤ 7 hari ke depan
2. Untuk setiap order yang ditemukan:
   a. Cek apakah sudah ada billing dalam 20 hari terakhir (mencegah duplikasi)
   b. Jika belum ada → Buat Billing baru:
      - user_id dari order
      - order_id dari order  
      - jumlah_tagihan = harga paket (atau total_harga order)
      - jatuh_tempo = tanggal_selesai order
      - status = 'unpaid'
   c. Buat notifikasi in-app → "Tagihan Baru" dengan info jumlah & jatuh tempo
   d. Kirim notifikasi WhatsApp (pengingat tagihan)
3. Log jumlah tagihan yang berhasil dibuat
```

---

### 9.3 CheckOverdueBillings (`billing:check-overdue`)

**Lokasi:** `app/Console/Commands/CheckOverdueBillings.php` (79 baris)  
**Signature:** `billing:check-overdue`  
**Deskripsi:** Check for overdue billings and suspend active orders  
**Jadwal:** Harian (daily)

**Alur Kerja:**
```
1. Cari billing dengan status 'unpaid' DAN jatuh_tempo < hari ini
2. Untuk setiap billing yang ditemukan:
   a. Update status billing → 'overdue'
   b. Jika order terkait masih 'aktif':
      - Update status order → 'suspend'
      - Disable PPPoE user via MikrotikService (isolir internet otomatis)
      - Buat notifikasi in-app → "Layanan Diisolir" 
      - Log info untuk WhatsApp (siap integrasi lanjutan)
3. Log jumlah layanan yang berhasil diisolir
```

**Efek Otomatis:**
- Pelanggan yang tidak membayar sebelum jatuh tempo akan **otomatis diisolir**
- Internet pelanggan **dimatikan via MikroTik API** (PPPoE disabled + active connection disconnected)
- Pelanggan menerima notifikasi isolir di aplikasi
- Layanan akan **otomatis aktif kembali** saat pembayaran diterima (via webhook Midtrans atau markAsPaid admin)

---

## 10. Sistem Email (Mailable)

Menggunakan Laravel Mailable untuk email transaksional. SMTP dikonfigurasi secara dinamis dari tabel `settings` melalui `AppServiceProvider::boot()`.

### 10.1 Daftar Mailable

| Mailable Class | Subject | View | Trigger |
|---|---|---|---|
| `OrderCreatedMail` | 📦 Pesanan Kamu Diterima - CV Citra Mandiri | `emails.order-created` | Saat customer membuat order baru |
| `OrderActivatedMail` | ✅ Paket Internet Kamu Sudah Aktif! | `emails.order-activated` | Saat admin mengaktifkan order |
| `OrderRejectedMail` | ❌ Pesanan Kamu Ditolak - CV Citra Mandiri | `emails.order-rejected` | Saat admin menolak order |
| `UpgradeRequestedMail` | 🚀 Permintaan Upgrade Paket Diterima | `emails.upgrade-requested` | Saat customer mengajukan upgrade |
| `UpgradeProcessedMail` | ✅ Disetujui / ❌ Ditolak (dinamis) | `emails.upgrade-processed` | Saat admin memproses upgrade |

### 10.2 Template Email (Blade Views)

Semua template email terletak di `resources/views/emails/`:
- `order-created.blade.php` (1912 bytes)
- `order-activated.blade.php` (2086 bytes)
- `order-rejected.blade.php` (1799 bytes)
- `upgrade-requested.blade.php` (2068 bytes)
- `upgrade-processed.blade.php` (2536 bytes)

### 10.3 Konfigurasi SMTP Dinamis

**Lokasi:** `app/Providers/AppServiceProvider.php`

Pada saat aplikasi boot, `AppServiceProvider` membaca tabel `settings` dan mengoverride konfigurasi SMTP Laravel:
```php
// Key yang dibaca dari tabel settings:
'smtp_host'      → mail.mailers.smtp.host
'smtp_port'      → mail.mailers.smtp.port  (default: 587)
'smtp_username'  → mail.mailers.smtp.username + mail.from.address
'smtp_password'  → mail.mailers.smtp.password
'smtp_from_name' → mail.from.name
```

Ini memungkinkan admin mengubah konfigurasi email **tanpa restart server** melalui halaman Settings.

---

## 11. Sistem Notifikasi

Sistem notifikasi multi-channel terintegrasi di seluruh alur bisnis:

### 11.1 In-App Notification
- Disimpan di tabel `notifications`
- Diakses via `GET /api/notifications`
- Tandai dibaca via `PATCH /api/notifications/{id}/read`
- **Auto-create saat:**
  - Order baru dibuat (→ notifikasi ke semua admin)
  - Status order berubah (→ notifikasi ke customer)
  - Tagihan baru terbit (→ notifikasi ke customer)
  - Tagihan dibayar (→ notifikasi ke customer)
  - Layanan diisolir (→ notifikasi ke customer, via cron job)
  - Tiket gangguan dibuat (→ notifikasi ke semua admin)
  - Status tiket berubah (→ notifikasi ke customer)
  - Jadwal teknisi dibuat (→ notifikasi ke customer + teknisi)
  - Status jadwal berubah (→ notifikasi ke customer)
  - Upgrade diajukan (→ notifikasi ke semua admin)
  - Upgrade diproses (→ notifikasi ke customer)

### 11.2 Email Notification
- Dikirim via Laravel Mail (SMTP configurable)
- Semua email dikirim dalam try-catch agar tidak mengganggu flow utama jika gagal
- **Trigger:** order created, order activated, order rejected, upgrade requested, upgrade processed

### 11.3 WhatsApp Notification
- Dikirim via API WhatsApp eksternal (configurable dari settings)
- Saat ini mode simulated (logging ke file)
- **Trigger:** registrasi (welcome), order baru, tagihan baru, pembayaran berhasil, update tiket

---

## 12. Integrasi Pihak Ketiga

### 12.1 Midtrans Payment Gateway
- **Library:** `midtrans/midtrans-php` v2.6
- **Mode:** Snap Token (popup pembayaran di frontend)
- **Konfigurasi:** Dinamis dari tabel `settings` dengan fallback ke `.env`
- **Key Environment:**
  - `MIDTRANS_MERCHANT_ID` — ID Merchant
  - `MIDTRANS_CLIENT_KEY` — Client Key (untuk frontend)
  - `MIDTRANS_SERVER_KEY` — Server Key (untuk backend)
  - `MIDTRANS_IS_PRODUCTION` — Mode production/sandbox
- **Fitur:** Pembayaran order pemasangan baru + tagihan bulanan
- **Security:** `isSanitized = true`, `is3ds = true`
- **Webhook:** `POST /api/midtrans/webhook` untuk callback otomatis
- **Format Order ID:** `INV-ORD-{id}-{timestamp}` (order) atau `INV-BIL-{id}-{timestamp}` (billing)
- **Demo Mode:** Endpoint `demoOrderSuccess` dan `demoBillingSuccess` untuk simulasi pembayaran tanpa Midtrans

### 12.2 MikroTik RouterOS API
- **Library:** `evilfreelancer/routeros-api-php` v1.7
- **Fungsi:** Manajemen PPPoE secret (add, enable, disable, disconnect)
- **Otomatisasi:**
  - Pembayaran order sukses → buat PPPoE user baru
  - Pembayaran billing sukses → enable PPPoE user
  - Tagihan overdue (via webhook atau cron job) → disable PPPoE user + disconnect
  - Admin mark as paid → enable PPPoE user
- **Mode Demo:** Auto-detect localhost IP, semua operasi dilog tanpa koneksi nyata
- **Port Default:** 8728 (configurable per device via `api_port`)

### 12.3 WhatsApp API
- **Konfigurasi:** URL dan API Key dari tabel `settings` (`wa_api_url`, `wa_api_key`)
- **Status:** Simulated (logging) — siap untuk integrasi API nyata (Fonnte, Wablas, dll)
- **Pesan yang dikirim:** Welcome, Order Confirmation, Billing Reminder/Receipt, Ticket Update

---

## 13. Database Seeder

### 13.1 DatabaseSeeder
**Lokasi:** `database/seeders/DatabaseSeeder.php`

Menjalankan seeder secara berurutan:
1. `RoleSeeder`
2. `PaketSeeder`

### 13.2 RoleSeeder
**Lokasi:** `database/seeders/RoleSeeder.php`

Membuat 3 role dasar menggunakan `firstOrCreate` (idempotent):
- `customer` — Pelanggan
- `admin` — Administrator
- `teknisi` — Teknisi lapangan

Guard: `web`

### 13.3 PaketSeeder
**Lokasi:** `database/seeders/PaketSeeder.php`

Membuat 4 paket default menggunakan `firstOrCreate` (idempotent):

| Nama Paket | Kecepatan | Harga/bulan | Deskripsi |
|---|---|---|---|
| **Paket Basic** | 10 Mbps | Rp 150.000 | Cocok untuk penggunaan sehari-hari browsing dan sosmed |
| **Paket Standard** | 25 Mbps | Rp 250.000 | Ideal untuk streaming dan WFH ringan |
| **Paket Premium** | 50 Mbps | Rp 400.000 | Kecepatan tinggi untuk gaming dan streaming 4K |
| **Paket Ultra** | 100 Mbps | Rp 700.000 | Koneksi dedicated untuk kebutuhan bisnis |

Semua paket memiliki durasi 30 hari dan status aktif.

---

## 14. Diagram Relasi Entitas (ERD)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  users   │────<│  orders  │>────│  pakets  │
│          │     │          │     │          │
│ id       │     │ user_id  │     │ id       │
│ name     │     │ paket_id │     │ nama     │
│ email    │     │ status   │     │ kecepatan│
│ password │     │ alamat   │     │ harga    │
│ avatar   │     │ total..  │     │ durasi   │
│ phone    │     │ mikrotik │     │ is_aktif │
│ address  │     │ network..│     │ fup      │
│ notif..  │     │ tanggal..│     └──────────┘
└────┬─────┘     └────┬─────┘           │
     │                │                 │
     │    ┌───────────┼─────────────────┤
     │    │           │                 │
     │    │     ┌─────▼──────┐   ┌──────▼────────────┐
     │    │     │  billings  │   │ upgrade_requests   │
     │    │     │            │   │                    │
     │    │     │ user_id    │   │ user_id            │
     ├────┼────>│ order_id   │   │ order_id           │
     │    │     │ jumlah..   │   │ old_paket_id       │
     │    │     │ status     │   │ new_paket_id       │
     │    │     │ jatuh_tempo│   │ status             │
     │    │     └────────────┘   │ admin_catatan      │
     │    │                      └────────────────────┘
     │    │
     │    │     ┌──────────────────┐
     │    │     │ technician_      │
     │    ├────>│ schedules        │
     │    │     │                  │
     │    │     │ user_id          │
     │    │     │ ticket_id        │
     │    │     │ order_id         │
     │    │     │ nama_teknisi     │
     │    │     │ tanggal_kunjungan│
     │    │     │ status           │
     │    │     └───────┬──────────┘
     │    │             │
     │    │     ┌───────▼──────┐
     ├────┼────>│   tickets    │
     │    │     │              │
     │    │     │ user_id      │
     │    │     │ judul        │
     │    │     │ deskripsi    │
     │    │     │ status       │
     │    │     │ prioritas    │
     │    │     │ foto         │
     │    │     └──────────────┘
     │    │
     │    │     ┌──────────────┐
     ├────┼────>│ notifications│
     │    │     │              │
     │    │     │ user_id      │
     │    │     │ title        │
     │    │     │ message      │
     │    │     │ is_read      │
     │    │     │ type         │
     │    │     └──────────────┘
     │    │
     │    │     ┌──────────────┐
     ├────┼────>│ testimonials │
     │         │              │
     │         │ user_id      │
     │         │ rating       │
     │         │ content      │
     │         │ is_published │
     │         └──────────────┘
     │
     │   ┌────────────────┐     ┌──────────┐
     │   │ network_devices│     │ settings │
     │   │                │     │          │
     │   │ name           │     │ key      │
     │   │ type           │     │ value    │
     │   │ ip_address     │     └──────────┘
     │   │ username       │
     │   │ password       │
     │   │ api_port       │
     │   │ is_active      │
     │   │ status         │
     │   │ last_seen_at   │
     │   └────────────────┘
```

---

## 15. Alur Bisnis Utama

### 15.1 Alur Pendaftaran & Pemasangan Baru
```
Customer Register
    → POST /api/register
    → Buat user + assign role 'customer'
    → Kirim WA Welcome Message
    → Return token

Customer Buat Order
    → POST /api/orders {paket_id, alamat, catatan}
    → Buat order (status: pending)
    → Kirim email OrderCreatedMail
    → Kirim WA konfirmasi
    → Notifikasi ke semua admin

Customer Bayar Order
    → POST /api/orders/{id}/pay → Dapatkan Snap Token
    → Bayar via Midtrans popup
    → Midtrans → POST /api/midtrans/webhook
    → Status → aktif
    → Buat PPPoE user di MikroTik
    → Set tanggal_mulai & tanggal_selesai

Admin Assign Teknisi
    → POST /api/admin/technician-schedules {order_id, nama_teknisi, tanggal}
    → Notifikasi customer + teknisi

Teknisi Instalasi
    → PATCH /api/technician/installations/{id}/status {status: selesai}
    → Notifikasi customer
```

### 15.2 Alur Tagihan Bulanan (Otomatis)
```
Laravel Scheduler (Daily)
    → billing:generate
    → Cek order aktif yang masa aktif ≤ 7 hari
    → Buat billing otomatis (status: unpaid)
    → Notifikasi + WA ke customer

Customer Bayar Tagihan
    → POST /api/billings/{id}/pay → Dapatkan Snap Token
    → Bayar via Midtrans popup
    → Midtrans → POST /api/midtrans/webhook
    → Status billing → paid
    → Perpanjang tanggal_selesai order
    → Enable PPPoE di MikroTik

    ATAU

Admin Tandai Lunas
    → PATCH /api/admin/billings/{id}/pay
    → Status billing → paid
    → Perpanjang order + enable PPPoE
    → Notifikasi + WA ke customer
```

### 15.3 Alur Isolir Otomatis (Suspend Menunggak)
```
Laravel Scheduler (Daily)
    → billing:check-overdue
    → Cek billing unpaid yang sudah lewat jatuh tempo
    → Status billing → overdue
    → Status order → suspend
    → Disable PPPoE di MikroTik (internet mati)
    → Notifikasi "Layanan Diisolir" ke customer
    → Log WA isolir

Pemulihan Setelah Bayar
    → Pembayaran via Midtrans webhook atau admin markAsPaid
    → Status billing → paid
    → Status order → aktif
    → Enable PPPoE di MikroTik (internet hidup kembali)
    → Perpanjang masa aktif
```

### 15.4 Alur Upgrade Paket
```
Customer Ajukan Upgrade
    → POST /api/orders/{id}/upgrade {new_paket_id}
    → Validasi: order aktif, tidak ada pending request
    → Buat UpgradeRequest (status: pending)
    → Notifikasi ke semua admin
    → Email UpgradeRequestedMail ke customer

Admin Proses Upgrade
    → PATCH /api/admin/upgrades/{id}/status {status: approved/rejected}
    → Jika approved: update paket_id & total_harga di order
    → Notifikasi ke customer
    → Email UpgradeProcessedMail ke customer
```

### 15.5 Alur Tiket Gangguan
```
Customer Buat Tiket
    → POST /api/tickets {judul, deskripsi, prioritas, foto}
    → Upload foto bukti (max 5MB)
    → Notifikasi ke semua admin

Admin Assign Teknisi
    → POST /api/admin/technician-schedules {ticket_id, nama_teknisi, tanggal}
    → Update status tiket → 'Diproses'
    → Notifikasi customer + teknisi

Teknisi Perbaiki
    → POST /api/technician/tickets/{id}/upload {foto, status}
    → Upload bukti foto perbaikan
    → Update status tiket
    → WA notifikasi ke customer
    → Auto-fix demo (IP device)

Admin Update Status
    → PATCH /api/admin/tickets/{id}/status {status: selesai}
    → Notifikasi + WA ke customer
```

---

## 16. Konfigurasi Environment

### 16.1 Variabel `.env` Penting

| Variabel | Nilai | Keterangan |
|---|---|---|
| `APP_ENV` | local | Environment (local/production) |
| `APP_DEBUG` | true | Debug mode |
| `APP_KEY` | base64:... | Application key |
| `DB_CONNECTION` | pgsql | Driver database |
| `DB_HOST` | 127.0.0.1 | Host database |
| `DB_PORT` | 5432 | Port PostgreSQL |
| `DB_DATABASE` | wifi_management_db | Nama database |
| `DB_USERNAME` | wifi_user | Username database |
| `DB_PASSWORD` | password_strong | Password database |
| `FRONTEND_URL` | http://localhost:5173 | URL frontend (CORS) |
| `SANCTUM_STATEFUL_DOMAINS` | localhost:5173 | Domain stateful Sanctum |
| `SESSION_DRIVER` | database | Driver session |
| `QUEUE_CONNECTION` | database | Driver queue |
| `CACHE_STORE` | database | Driver cache |
| `MAIL_MAILER` | smtp | Driver mail |
| `MAIL_HOST` | smtp.gmail.com | SMTP host |
| `MAIL_PORT` | 587 | SMTP port |
| `MAIL_ENCRYPTION` | tls | Enkripsi email |
| `MAIL_FROM_NAME` | CV Citra Mandiri | Nama pengirim email |
| `MIDTRANS_MERCHANT_ID` | M771138256 | Midtrans Merchant ID |
| `MIDTRANS_CLIENT_KEY` | Mid-client-... | Midtrans Client Key |
| `MIDTRANS_SERVER_KEY` | Mid-server-... | Midtrans Server Key |
| `MIDTRANS_IS_PRODUCTION` | false | Mode sandbox Midtrans |

---

## 17. Dependensi Proyek

### 17.1 Dependencies (Production)

| Package | Versi | Fungsi |
|---|---|---|
| `php` | ^8.3 | Runtime PHP |
| `laravel/framework` | ^13.8 | Framework utama |
| `laravel/sanctum` | ^4.0 | Token-based API authentication |
| `laravel/tinker` | ^3.0 | REPL untuk debugging |
| `spatie/laravel-permission` | ^8.0 | Role & permission management |
| `midtrans/midtrans-php` | ^2.6 | Payment gateway SDK |
| `evilfreelancer/routeros-api-php` | ^1.7 | MikroTik RouterOS API client |

### 17.2 Dev Dependencies

| Package | Versi | Fungsi |
|---|---|---|
| `fakerphp/faker` | ^1.23 | Generate fake data untuk testing |
| `laravel/pail` | ^1.2.5 | Real-time log viewer |
| `laravel/pao` | ^1.0.6 | Laravel Pao |
| `laravel/pint` | ^1.27 | PHP code style fixer |
| `mockery/mockery` | ^1.6 | Mocking framework untuk testing |
| `nunomaduro/collision` | ^8.6 | Better error reporting |
| `phpunit/phpunit` | ^12.5.12 | Unit testing framework |

### 17.3 Composer Scripts

| Script | Fungsi |
|---|---|
| `composer setup` | Install dependencies, copy .env, generate key, migrate, install npm, build assets |
| `composer dev` | Jalankan 4 proses concurrent: `php artisan serve`, `queue:listen`, `pail`, `npm run dev` |
| `composer test` | Clear config + run tests |

---

## 18. Ringkasan Statistik Kode

### 18.1 Jumlah File per Kategori

| Kategori | Jumlah | Total Baris | Total Bytes |
|---|---|---|---|
| Controllers (Api/) | 12 | ~1.505 | ~56.3 KB |
| Controllers (General) | 8 | ~924 | ~32.8 KB |
| Models | 11 | ~377 | ~7.4 KB |
| Services | 2 | ~277 | ~10.2 KB |
| Mail Classes | 5 | ~144 | ~3.3 KB |
| Console Commands | 2 | ~163 | ~5.6 KB |
| Email Blade Views | 5 | - | ~10.4 KB |
| Database Migrations | 24 | - | ~19.4 KB |
| Seeders | 3 | ~91 | ~2.2 KB |
| Route Files | 3 | ~161 | ~8.3 KB |
| Config Files | 10 | - | ~43.2 KB |
| Service Provider | 1 | ~47 | ~1.6 KB |
| **TOTAL** | **86** | **~3.689+** | **~200+ KB** |

### 18.2 Ringkasan Endpoint

| Kategori | Jumlah |
|---|---|
| Route Publik | 9 |
| Route Semua User Login | 24 |
| Route Admin Only | 31 |
| Route Teknisi | 6 |
| **Total Endpoint** | **~70** |

### 18.3 Ringkasan Fitur Otomatis

| Fitur | Mekanisme | Status |
|---|---|---|
| Penerbitan tagihan otomatis | Cron job `billing:generate` (harian) | ✅ Aktif |
| Isolir pelanggan menunggak | Cron job `billing:check-overdue` (harian) | ✅ Aktif |
| Buat PPPoE user saat bayar | Webhook Midtrans / Demo Pay | ✅ Aktif |
| Enable PPPoE saat bayar tagihan | Webhook Midtrans / markAsPaid / Demo Pay | ✅ Aktif |
| Disable PPPoE saat overdue | Webhook Midtrans + Cron job | ✅ Aktif |
| Perpanjangan masa aktif otomatis | Webhook Midtrans / markAsPaid | ✅ Aktif |
| Notifikasi multi-channel | In-app + Email + WhatsApp | ✅ Aktif |
| Konfigurasi SMTP dinamis | AppServiceProvider boot dari tabel settings | ✅ Aktif |
| Monitoring perangkat jaringan | Status endpoint dengan simulasi demo | ✅ Aktif |
| Auto-fix demo (IP recovery) | Tiket selesai → fix device IP | ✅ Aktif (Demo) |

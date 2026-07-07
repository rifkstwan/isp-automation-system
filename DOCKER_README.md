# 🐳 Panduan Docker - WiFi Management

Panduan ini untuk **2 developer** yang ingin menjalankan proyek ini menggunakan Docker.

---

## 📋 Persyaratan

Pastikan terinstall di komputer kamu:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (versi terbaru)
- Git

> ⚠️ **Tidak perlu** install PHP, Node.js, PostgreSQL, atau Composer secara lokal — semua sudah ada di Docker!

---

## 🚀 Cara Menjalankan (Pertama Kali)

### 1. Clone repositori
```bash
git clone <URL_REPO> wifi-management
cd wifi-management
```

### 2. Build dan jalankan semua container
```bash
docker compose up -d --build
```

> ⏱️ **Build pertama** akan memakan waktu 3-10 menit karena mengunduh image dan menginstall dependencies.
> Selanjutnya akan jauh lebih cepat!

### 3. Pantau proses startup
```bash
docker compose logs -f backend
```

Tunggu sampai muncul pesan:
```
🚀 Backend siap! Berjalan di port 9000 (via Nginx: http://localhost)
```

### 4. Akses aplikasi

| Layanan | URL | Keterangan |
|---|---|---|
| 🖥️ **Frontend** | http://localhost:5173 | Aplikasi React (hot-reload) |
| ⚙️ **Backend API** | http://localhost/api | Laravel API |
| 🗄️ **Database** | localhost:5432 | PostgreSQL (untuk DBeaver/TablePlus) |

---

## 🔄 Penggunaan Sehari-hari

### Menjalankan (setelah sudah di-build)
```bash
docker compose up -d
```

### Menghentikan
```bash
docker compose down
```

### Melihat log
```bash
# Semua service
docker compose logs -f

# Hanya backend
docker compose logs -f backend

# Hanya frontend
docker compose logs -f frontend
```

---

## 🛠️ Perintah Berguna

### Masuk ke terminal container backend
```bash
docker compose exec backend bash
```

### Jalankan Artisan command
```bash
# Contoh: membuat migration baru
docker compose exec backend php artisan make:migration create_example_table

# Jalankan seeder ulang
docker compose exec backend php artisan db:seed --force

# Reset database + seed ulang
docker compose exec backend php artisan migrate:fresh --seed

# Clear cache
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
```

### Masuk ke terminal frontend
```bash
docker compose exec frontend sh
```

### Masuk ke PostgreSQL
```bash
docker compose exec postgres psql -U wifi_user -d wifi_management_db
```

### Install package baru

**Backend (Composer):**
```bash
docker compose exec backend composer require nama/package
```

**Frontend (npm):**
```bash
docker compose exec frontend npm install nama-package
```

---

## 🔧 Reset & Troubleshooting

### Reset database
```bash
# Hapus file seeder flag lalu restart
docker compose exec backend rm -f storage/.docker_seeded
docker compose exec backend php artisan migrate:fresh --seed
```

### Rebuild ulang dari nol (jika ada masalah)
```bash
docker compose down -v   # Hapus container + volume
docker compose up -d --build  # Build ulang
```

### Lihat status container
```bash
docker compose ps
```

### Container backend tidak mau start
```bash
docker compose logs backend
```

---

## 📁 Struktur File Docker

```
wifi-management/
├── docker-compose.yml          # Konfigurasi semua service
├── .dockerignore               # File yang diabaikan saat build
├── backend/
│   ├── Dockerfile              # Image untuk Laravel (PHP 8.3)
│   └── docker-entrypoint.sh   # Script startup otomatis
├── frontend/
│   └── Dockerfile              # Image untuk React + Vite
└── nginx/
    └── nginx.conf              # Konfigurasi reverse proxy
```

---

## ℹ️ Catatan Penting

- **Hot-reload aktif**: Perubahan kode otomatis terdeteksi tanpa restart container
- **Data database** tersimpan di Docker volume `postgres_data` dan tidak hilang saat `docker compose down`
- **Untuk menghapus data**: gunakan `docker compose down -v`
- **Mobile app (Expo)** tidak termasuk Docker, tetap jalankan seperti biasa dengan `npx expo start`

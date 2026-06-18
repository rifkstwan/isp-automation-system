# Panduan Deploy Production — Sistem Manajemen WiFi CV. Citra Mandiri

> Dokumen ini berisi panduan lengkap untuk melakukan deployment (pemasangan) sistem ke server produksi.  
> Pastikan dibaca secara berurutan dari atas ke bawah.

---

## 1. Persyaratan Server (System Requirements)

| Komponen | Minimum | Rekomendasi |
|---|---|---|
| **OS** | Ubuntu 20.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| **PHP** | 8.3+ | 8.3+ |
| **Database** | PostgreSQL 14+ | PostgreSQL 16 |
| **Web Server** | Nginx | Nginx |
| **Node.js** | 18+ | 20 LTS |
| **RAM** | 1 GB | 2 GB+ |
| **Storage** | 10 GB | 20 GB+ |

### PHP Extensions yang Dibutuhkan
```
php8.3-cli php8.3-fpm php8.3-pgsql php8.3-mbstring php8.3-xml 
php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath php8.3-tokenizer
```

---

## 2. Instalasi Server (VPS Ubuntu)

### 2.1 Update Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install PHP 8.3
```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.3 php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring \
    php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath -y
```

### 2.3 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### 2.4 Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
```

### 2.5 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

### 2.6 Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

---

## 3. Setup Database

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE wifi_management;
CREATE USER wifi_user WITH ENCRYPTED PASSWORD 'password_yang_kuat_disini';
GRANT ALL PRIVILEGES ON DATABASE wifi_management TO wifi_user;
ALTER DATABASE wifi_management OWNER TO wifi_user;

# Keluar
\q
```

> ⚠️ **PENTING**: Ganti `password_yang_kuat_disini` dengan password yang benar-benar kuat dan simpan di tempat yang aman.

---

## 4. Upload & Setup Project

### 4.1 Upload File Project
```bash
# Buat direktori
sudo mkdir -p /var/www/wifi-management
sudo chown -R $USER:www-data /var/www/wifi-management

# Upload project (via git, scp, atau rsync)
# Contoh via git:
cd /var/www/wifi-management
git clone <URL_REPOSITORY> .

# Atau via rsync dari komputer lokal:
# rsync -avz --exclude='vendor' --exclude='node_modules' ./wifi-management/ user@ip_server:/var/www/wifi-management/
```

### 4.2 Setup Backend
```bash
cd /var/www/wifi-management/backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Copy dan edit file environment
cp .env.example .env
nano .env
```

### 4.3 Edit File `.env` untuk Production
```env
APP_NAME="CV Citra Mandiri WiFi"
APP_ENV=production
APP_KEY=   # akan di-generate otomatis
APP_DEBUG=false
APP_URL=https://domain-anda.com

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=wifi_management
DB_USERNAME=wifi_user
DB_PASSWORD=password_yang_kuat_disini

# Midtrans (Ganti dengan kredensial produksi)
MIDTRANS_SERVER_KEY=Mid-server-xxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxx
MIDTRANS_IS_PRODUCTION=true

# Mail (Sesuaikan dengan SMTP yang dipakai)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email@citra-mandiri.com
MAIL_PASSWORD=app_password_disini
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@citra-mandiri.com
MAIL_FROM_NAME="CV Citra Mandiri"
```

### 4.4 Finalisasi Backend
```bash
# Generate app key
php artisan key:generate

# Jalankan migrasi database
php artisan migrate --force

# Buat symlink storage
php artisan storage:link

# Optimisasi untuk production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permission folder
sudo chown -R www-data:www-data /var/www/wifi-management/backend/storage
sudo chown -R www-data:www-data /var/www/wifi-management/backend/bootstrap/cache
sudo chmod -R 775 /var/www/wifi-management/backend/storage
sudo chmod -R 775 /var/www/wifi-management/backend/bootstrap/cache
```

### 4.5 Build Frontend
```bash
cd /var/www/wifi-management/frontend

# Install dependencies
npm install

# Build untuk production
npm run build
```

---

## 5. Konfigurasi Nginx

### 5.1 Backend API (Laravel)
```bash
sudo nano /etc/nginx/sites-available/wifi-api
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name api.domain-anda.com;   # Ganti dengan domain API Anda
    root /var/www/wifi-management/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    client_max_body_size 10M;
}
```

### 5.2 Frontend (React Build)
```bash
sudo nano /etc/nginx/sites-available/wifi-frontend
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name domain-anda.com;   # Ganti dengan domain frontend Anda
    root /var/www/wifi-management/frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 Aktifkan Konfigurasi
```bash
sudo ln -s /etc/nginx/sites-available/wifi-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/wifi-frontend /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 6. Setup SSL (HTTPS) — WAJIB untuk Production

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL untuk kedua domain
sudo certbot --nginx -d domain-anda.com -d api.domain-anda.com

# SSL akan otomatis diperbarui, tapi pastikan dengan:
sudo certbot renew --dry-run
```

---

## 7. ⭐ Setup Cron Job (WAJIB — Agar Tagihan Otomatis Berjalan)

Ini adalah bagian **paling penting** agar fitur tagihan otomatis dan auto-isolir berfungsi.

```bash
# Buka crontab editor
sudo crontab -e -u www-data
```

Tambahkan baris ini di paling bawah:
```cron
* * * * * cd /var/www/wifi-management/backend && php artisan schedule:run >> /dev/null 2>&1
```

> **Penjelasan:**
> - `* * * * *` = Jalankan setiap menit
> - Laravel akan mengecek secara internal apakah ada tugas terjadwal yang perlu dieksekusi
> - Tugas yang dijadwalkan:
>   - `billing:generate` → Otomatis buat tagihan H-7 sebelum internet habis
>   - `billing:check-overdue` → Otomatis matikan internet jika tagihan lewat jatuh tempo
> - Kedua tugas ini hanya dieksekusi **sekali sehari** oleh Laravel (walaupun cron berjalan setiap menit)

### Verifikasi Cron Sudah Berjalan
```bash
# Cek apakah cron terdaftar
sudo crontab -l -u www-data

# Cek log Laravel untuk memastikan scheduler bekerja
tail -f /var/www/wifi-management/backend/storage/logs/laravel.log
```

---

## 8. Setup Queue Worker (Opsional — untuk Email & Notifikasi)

Jika ingin email dan notifikasi diproses di background (lebih cepat):

```bash
# Install Supervisor
sudo apt install supervisor -y

# Buat konfigurasi worker
sudo nano /etc/supervisor/conf.d/wifi-worker.conf
```

Isi:
```ini
[program:wifi-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/wifi-management/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/wifi-management/backend/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
# Jalankan worker
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start wifi-worker:*
```

---

## 9. Konfigurasi Midtrans untuk Production

1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Pastikan mode **Production** (bukan Sandbox)
3. Di menu **Settings > Configuration**:
   - Masukkan **Payment Notification URL**: `https://api.domain-anda.com/api/midtrans/webhook`
   - Masukkan **Finish Redirect URL**: `https://domain-anda.com/dashboard`
4. Salin **Server Key** dan **Client Key** production ke file `.env`

---

## 10. Konfigurasi Mikrotik RouterOS

Pastikan router Mikrotik di jaringan CV sudah dikonfigurasi:

1. **Aktifkan API Service** di Mikrotik:
   - Buka Winbox → IP → Services → Aktifkan `api` (port 8728)
2. **Buat user API** di Mikrotik:
   - System → Users → Tambah user baru dengan group `full`
3. **Daftarkan perangkat** di sistem:
   - Login sebagai Admin → Monitoring Jaringan → Tambah Perangkat
   - Masukkan IP, Username, Password, dan Port API router Mikrotik
4. **Pastikan server bisa mengakses router** (IP harus satu jaringan atau routing tersedia)

---

## 11. Pengaturan WhatsApp API

Konfigurasikan melalui **Dashboard Admin → Pengaturan**:

1. Masukkan **WA API URL** (dari provider WhatsApp API seperti Fonnte, Wablas, dll)
2. Masukkan **WA API Key / Token**
3. Sistem akan otomatis mengirim pesan WA untuk:
   - Registrasi baru (selamat datang)
   - Order baru (konfirmasi)
   - Tagihan baru (pengingat bayar)
   - Tagihan overdue (pemberitahuan isolir)
   - Update tiket gangguan

---

## 12. Checklist Sebelum Go-Live

| No | Item | Status |
|---|---|---|
| 1 | Server sudah terinstall PHP 8.3, Nginx, PostgreSQL | ☐ |
| 2 | Database sudah dibuat dan migrasi berhasil | ☐ |
| 3 | File `.env` sudah dikonfigurasi dengan benar | ☐ |
| 4 | Frontend sudah di-build (`npm run build`) | ☐ |
| 5 | Nginx sudah dikonfigurasi untuk backend dan frontend | ☐ |
| 6 | SSL/HTTPS sudah aktif | ☐ |
| 7 | **Cron job sudah ditambahkan** (tagihan otomatis) | ☐ |
| 8 | Midtrans webhook URL sudah diset ke domain production | ☐ |
| 9 | Router Mikrotik sudah terdaftar di sistem | ☐ |
| 10 | WhatsApp API sudah dikonfigurasi di pengaturan | ☐ |
| 11 | Akun admin pertama sudah dibuat (via seeder atau register) | ☐ |
| 12 | Storage symlink sudah dibuat (`php artisan storage:link`) | ☐ |
| 13 | Folder storage & cache memiliki permission yang benar | ☐ |

---

## 13. Perintah Berguna untuk Maintenance

```bash
# Cek status layanan
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status postgresql

# Lihat log error Laravel
tail -f /var/www/wifi-management/backend/storage/logs/laravel.log

# Bersihkan cache (setelah mengubah .env atau config)
cd /var/www/wifi-management/backend
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Jalankan migrasi baru (setelah update kode)
php artisan migrate --force

# Test command tagihan secara manual
php artisan billing:generate
php artisan billing:check-overdue

# Restart semua layanan
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm
sudo supervisorctl restart wifi-worker:*
```

---

## 14. Backup Database (Sangat Direkomendasikan)

Tambahkan di crontab untuk backup otomatis setiap malam:

```bash
sudo crontab -e
```

Tambahkan:
```cron
0 2 * * * pg_dump -U wifi_user wifi_management | gzip > /var/backups/wifi_db_$(date +\%Y\%m\%d).sql.gz
```

> Backup akan disimpan setiap jam 2 pagi di `/var/backups/`.

---

## 15. Kontak & Informasi Pengembang

| | |
|---|---|
| **Nama Project** | Sistem Manajemen WiFi CV. Citra Mandiri |
| **Versi** | 1.0 |
| **Framework Backend** | Laravel 13.8 (PHP 8.3) |
| **Framework Frontend** | React 19 + Vite |
| **Database** | PostgreSQL |
| **Tanggal Serah Terima** | _____________ |

---

> **Catatan:** Simpan dokumen ini di tempat yang aman. Dokumen ini berisi instruksi teknis yang diperlukan untuk mengoperasikan dan merawat sistem ini di lingkungan production.

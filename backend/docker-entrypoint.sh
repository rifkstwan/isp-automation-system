#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   WiFi Management - Backend Starting...  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─────────────── Setup .env ───────────────
if [ ! -f ".env" ]; then
    echo "📝 Membuat .env dari .env.example..."
    cp .env.example .env
fi

# ─────────────── Install Composer Dependencies ───────────────
if [ ! -f "vendor/autoload.php" ]; then
    echo "📦 Menginstal Composer dependencies (ini hanya terjadi sekali)..."
    composer install --no-interaction --no-scripts --optimize-autoloader
    echo "✅ Composer selesai!"
fi

# ─────────────── Generate App Key jika kosong ───────────────
CURRENT_KEY=$(grep -E '^APP_KEY=' .env | cut -d '=' -f2)
if [ -z "$CURRENT_KEY" ] || [ "$CURRENT_KEY" = "" ]; then
    echo "🔑 Generating APP_KEY..."
    php artisan key:generate --force
fi

# ─────────────── Fix Storage Permissions ───────────────
echo "🔧 Mengatur permission storage..."
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# ─────────────── Tunggu PostgreSQL Siap ───────────────
echo "⏳ Menunggu PostgreSQL siap..."
MAX_TRIES=30
TRIES=0
until php -r "
try {
    \$pdo = new PDO(
        'pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
    echo 'ok';
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null | grep -q "ok"; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge "$MAX_TRIES" ]; then
        echo "❌ PostgreSQL tidak bisa terhubung setelah ${MAX_TRIES} percobaan. Cek konfigurasi."
        exit 1
    fi
    echo "   Menunggu... (${TRIES}/${MAX_TRIES})"
    sleep 3
done
echo "✅ PostgreSQL siap!"

# ─────────────── Jalankan Migrations ───────────────
echo "🗄️  Menjalankan migrations..."
php artisan migrate --force
echo "✅ Migrations selesai!"

# ─────────────── Seed Database (hanya sekali, saat pertama kali) ───────────────
if [ ! -f "storage/.docker_seeded" ]; then
    echo "🌱 Seeding database (hanya dilakukan sekali)..."
    php artisan db:seed --force
    touch storage/.docker_seeded
    echo "✅ Seeding selesai!"
else
    echo "ℹ️  Database sudah di-seed sebelumnya. Skip seeding."
fi

# ─────────────── Cache Konfigurasi ───────────────
echo "⚡ Caching konfigurasi..."
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
echo "✅ Cache selesai!"

echo ""
echo "🚀 Backend siap! Berjalan di port 9000 (via Nginx: http://localhost)"
echo ""

exec "$@"

FROM php:8.4-fpm-alpine

# ─────────────── Install System Dependencies ───────────────
RUN apk add --no-cache \
    postgresql-dev \
    postgresql-client \
    libzip-dev \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    curl \
    git \
    bash \
    nodejs \
    npm \
    linux-headers \
    $PHPIZE_DEPS

# ─────────────── Install PHP Extensions ───────────────
# Catatan: tokenizer, xml, ctype, fileinfo sudah built-in di php:8.4-fpm-alpine
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    bcmath \
    mbstring \
    pcntl \
    sockets \
    zip

# ─────────────── Install Composer ───────────────
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# ─────────────── Working Directory ───────────────
WORKDIR /var/www/html

# ─────────────── Entrypoint Script ───────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]

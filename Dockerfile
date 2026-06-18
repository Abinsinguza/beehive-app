# ── Stage 1: install PHP dependencies (vendor/) ──────────────────
FROM composer:2 AS composer-deps

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --ignore-platform-reqs

# ── Stage 2: build frontend assets ──────────────────────────────
# Wayfinder's Vite plugin runs `php artisan wayfinder:generate` during
# the build, so PHP + vendor/ + a bootable .env must be present here too.
FROM node:22-alpine AS frontend

RUN apk add --no-cache php83 php83-mbstring php83-tokenizer php83-xml \
        php83-curl php83-openssl php83-phar php83-ctype php83-fileinfo \
        php83-pdo php83-pdo_pgsql php83-dom php83-session \
    && ln -s /usr/bin/php83 /usr/bin/php

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY --from=composer-deps /app/vendor ./vendor

# Build-time-only placeholder env so artisan can boot (no real DB/secrets needed
# for route/type generation — never shipped in the final image).
RUN cp .env.example .env && php artisan key:generate --force

RUN npm run build

# ── Stage 3: PHP application runtime ─────────────────────────────
FROM php:8.3-fpm-alpine AS app

RUN apk add --no-cache \
        postgresql-dev \
        libzip-dev \
        oniguruma-dev \
        icu-dev \
        nginx \
        supervisor \
    && docker-php-ext-install pdo pdo_pgsql mbstring zip bcmath intl opcache

WORKDIR /var/www/html

COPY . .
COPY --from=composer-deps /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

RUN composer dump-autoload --optimize -d /var/www/html \
    && php artisan storage:link || true

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

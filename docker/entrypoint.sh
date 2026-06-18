#!/bin/sh
set -e

cd /var/www/html

php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ "$RUN_MIGRATIONS" = "true" ]; then
    php artisan migrate --force
fi

exec "$@"

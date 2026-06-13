#!/bin/sh
set -eu

wait_for_mysql() {
  if [ "${DB_ADAPTER:-mysql}" != "mysql" ]; then
    return 0
  fi

  echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
  attempt=0
  while [ "$attempt" -lt 30 ]; do
    if php -r "
      \$dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        getenv('DB_HOST') ?: 'mysql',
        getenv('DB_PORT') ?: '3306',
        getenv('DB_NAME') ?: 'nene_contact',
        getenv('DB_CHARSET') ?: 'utf8mb4',
      );
      new PDO(\$dsn, getenv('DB_USER') ?: '', getenv('DB_PASSWORD') ?: '');
    " 2>/dev/null; then
      echo "MySQL is ready."
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "MySQL did not become ready in time." >&2
  exit 1
}

composer install --no-interaction --prefer-dist
wait_for_mysql

# Attachment storage (D12): ensure the directory exists and is writable by the Apache
# worker user (www-data) before serving requests.
mkdir -p var/attachments
chown -R www-data:www-data var/attachments
chmod -R u+rwX var/attachments

# Media library (appearance HERO images): publicly-served upload dir, writable by www-data.
mkdir -p public_html/media
chown -R www-data:www-data public_html/media
chmod -R u+rwX public_html/media

# Apply database migrations on every boot. Phinx records applied migrations in
# `phinxlog`, so this is idempotent and safe to re-run; a fresh container comes
# up fully migrated with no manual step. Works for both mysql and sqlite.
php vendor/bin/phinx migrate -c phinx.php

exec apache2-foreground

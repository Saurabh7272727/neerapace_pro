#!/bin/sh
set -eu
archive=${1:?Pass the backup file, for example backups/neerapace-2026-01-01.gz}
docker compose -f docker-compose.prod.yml exec -T mongo \
  mongorestore --archive --gzip --drop \
  -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  < "$archive"
echo "Restore finished from $archive"

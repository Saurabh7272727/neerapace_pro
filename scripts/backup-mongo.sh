#!/bin/sh
set -eu
mkdir -p backups
stamp=$(date -u +%F-%H%M)
docker compose -f docker-compose.prod.yml exec -T mongo \
  mongodump --archive --gzip \
  -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  > "backups/neerapace-$stamp.gz"
echo "Wrote backups/neerapace-$stamp.gz"
echo "Copy this file off the VPS and test a restore."

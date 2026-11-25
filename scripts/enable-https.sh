#!/bin/sh
set -eu
domain=${1:?Pass the domain name}
email=${2:?Pass the certificate email}
docker compose -f docker-compose.prod.yml --profile certs run --rm certbot certonly \
  --webroot -w /var/www/certbot -d "$domain" --email "$email" --agree-tos --non-interactive
sed "s/__DOMAIN__/$domain/g" nginx/ssl.conf.template > nginx/conf.d/ssl.conf
cat > nginx/conf.d/default.conf <<EOF
server {
  listen 80;
  server_name $domain;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://\$host\$request_uri; }
}
EOF
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
echo "HTTPS is configured for $domain"

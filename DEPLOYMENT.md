# Deployment on Hostinger KVM 2

Target: Ubuntu, Docker Engine, Docker Compose, one VPS (about 2 vCPU and 8 GB RAM). MongoDB and Redis stay on the private Docker network. Only Nginx publishes ports 80 and 443.

## One-time server setup

1. Point the domain A record at the VPS.
2. Install Docker Engine and the Compose plugin. Allow SSH keys only. Open ports 22, 80 and 443 in the firewall.
3. Clone the repository to `/opt/neerapace`.
4. Copy `.env.example` to `.env` on the server. Set strong values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_PEPPER`, `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD`, `REDIS_PASSWORD`, SMTP, Cloudinary, and Inngest. Set `CLIENT_ORIGIN` to `https://your-domain` and `COOKIE_SECURE=true`.
5. Add the mailbox DNS records (SPF, DKIM, DMARC) or password-reset and OTP mail will be treated as spam.
6. Start the stack: `docker compose -f docker-compose.prod.yml up -d --build`
7. Create the owner: `docker compose -f docker-compose.prod.yml exec api node apps/api/src/seed/admin.js`
8. Issue the certificate: `./scripts/enable-https.sh your-domain you@your-domain`
9. Confirm `https://your-domain/api/health` returns `"ok": true`.

Inngest must be able to reach `https://your-domain/api/inngest`. Put the Inngest signing key and event key in `.env`. Inngest is hosted; it is not a container in this stack.

## Limits

The production compose file caps Nginx and the static site at 128 MB, the API at 768 MB, Redis at 320 MB, and MongoDB at 1.5 GB with a 0.5 GB WiredTiger cache. That leaves room for the operating system on an 8 GB VPS. Move MongoDB off the VPS before running more than one API container.

## Backups

Run `./scripts/backup-mongo.sh` from `/opt/neerapace` with the production variables loaded. Copy the file in `backups/` off the VPS the same day. A Hostinger snapshot is extra protection, not a substitute.

Restore onto a spare database first:

`./scripts/restore-mongo.sh backups/neerapace-YYYY-MM-DD-HHMM.gz`

`--drop` replaces current collections. Do not run it against the live database until the archive has been restored somewhere else.

A daily cron entry:

`0 2 * * * cd /opt/neerapace && set -a && . ./.env && set +a && ./scripts/backup-mongo.sh`

## Updates

GitHub Actions workflow **Deploy** is manual. Add repository secrets `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY`. It fast-forwards `/opt/neerapace` and rebuilds the compose stack.

Container logs are rotated at 10 MB × 3 files. `docker compose -f docker-compose.prod.yml ps` shows health.

## Failure notes

- Redis down: public pages still read MongoDB. OTP, refresh tokens, and rate limits stop until Redis returns.
- SMTP or Inngest down: the admission is still stored. Use Resend on the verify screen after mail works again.
- Socket chat needs the Nginx `/socket.io/` proxy timeout kept at 3600 seconds.

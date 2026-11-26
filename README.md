# Neera Pace

Cricket academy website and office tools: public pages, student registration, admin / coach / student dashboards, attendance, announcements, and real-time chat. Version 2 does not take payments.

## Local development

1. Copy `.env.example` to `.env` and replace every secret.
2. Start MongoDB and Redis: `docker compose up mongo redis -d`
3. Install and run: `npm install` then `npm run dev`
4. Open http://localhost:5173
5. Create the owner account: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then `npm run seed`

The API is http://localhost:4000. Vite proxies `/api` and `/socket.io`.

Without `SMTP_HOST`, development email uses an Ethereal inbox and the API log prints a preview URL. The one-time code itself is not written to the log. Without `INNGEST_EVENT_KEY`, development runs the same email jobs in the API process. Production requires `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `ADMIN_EMAIL`, and `SMTP_HOST`; the API will fail to start if one is missing. Inngest events are first persisted to a MongoDB outbox and retried until accepted, and exhausted job failures are emailed to `ADMIN_EMAIL`.

Google sign-in uses the OAuth authorization-code redirect flow. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_SSO_ENABLED=true` in `.env`. The redirect URI is derived from `CLIENT_ORIGIN` as `/api/auth/google/callback`; for local development, register `http://localhost:5173/api/auth/google/callback` in Google Cloud Console.

## Scripts

- `npm run dev` — API and web
- `npm test` — API and web tests
- `npm run lint` — syntax check for server and shared modules
- `npm run build:web` — production React build
- `npm run seed` — create the first admin and default website copy

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Hostinger KVM 2 / Docker setup.

Payments, fee collection, and payment gateways are out of scope for this version.

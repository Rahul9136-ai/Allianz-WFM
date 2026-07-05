# Deployment Guide — Railway

The app deploys as a **single web service** (Docker) that serves both the REST
API and the built React SPA from one origin, plus a **managed PostgreSQL**
database. On every deploy it runs migrations and idempotently seeds demo data.

- `Dockerfile` (repo root) — multi-stage build: frontend → backend, one image.
- `railway.json` — tells Railway to build with the Dockerfile and health-check `/api/health`.
- Start command (baked into the image): `prisma migrate deploy && node dist/db/seed.js && node dist/server.js`

---

## Option A — Railway Dashboard (no CLI, easiest)

1. **Create the project**
   - Go to <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
   - Authorize Railway for GitHub and pick **`Rahul9136-ai/Allianz-WFM`**.
   - Railway detects the `Dockerfile` and starts a build. (It may fail the first
     time because there's no database yet — that's fine, we add it next.)

2. **Add PostgreSQL**
   - In the project canvas: **New** → **Database** → **Add PostgreSQL**.
   - This creates a `Postgres` service exposing `DATABASE_URL`.

3. **Set variables on the app service**
   - Open the app service → **Variables** → add:

     | Variable | Value |
     | --- | --- |
     | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference — click "Add Reference") |
     | `JWT_SECRET` | a long random string (see below) |
     | `JWT_REFRESH_SECRET` | another long random string |
     | `NODE_ENV` | `production` |
     | `EMAIL_DRIVER` | `dev` |
     | `STORAGE_DRIVER` | `local` |

   - `PORT` is injected by Railway automatically — do **not** set it.
   - Generate secrets locally:
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```

4. **Expose a public URL**
   - App service → **Settings** → **Networking** → **Generate Domain**.
   - You get something like `https://allianz-wfm-production.up.railway.app`.

5. **Redeploy** (Deployments → Redeploy) so the app builds with `DATABASE_URL` present.
   - Watch the deploy logs: you should see `prisma migrate deploy` apply the
     migration, the seed run, then `WFM Request Portal API listening`.

6. **Open the domain and log in**
   - `admin@wfmportal.com` / `wfm@wfmportal.com` / `ops@wfmportal.com`
   - Password: `Password123!`

---

## Option B — Railway CLI

```bash
npm i -g @railway/cli
railway login                     # opens browser
cd wfm-request-portal
railway init                      # create/link a project
railway add --database postgres   # provision Postgres
# set variables (DATABASE_URL is auto-provided in the same project):
railway variables --set "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
railway variables --set "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
railway variables --set "NODE_ENV=production"
railway up                        # build & deploy from the Dockerfile
railway domain                    # generate a public URL
```

---

## Environment variables reference

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string (reference the Railway Postgres service). |
| `JWT_SECRET` | ✅ | Sign access tokens. Use a 48+ byte random hex string. |
| `JWT_REFRESH_SECRET` | ✅ | Sign refresh tokens. |
| `NODE_ENV` | ✅ | `production`. |
| `PORT` | auto | Injected by Railway; app also defaults to 4000. |
| `EMAIL_DRIVER` | – | `dev` (logs email previews) or `smtp` (+ `SMTP_*`) to send real mail. |
| `STORAGE_DRIVER` | – | `local` for now. **Note:** Railway's filesystem is ephemeral, so uploaded attachments are lost on redeploy — move to `azure` blob storage for durable files. |
| `SESSION_TIMEOUT_MINUTES` | – | Default 30. |

## Notes & next steps

- **Attachments** use local disk, which is ephemeral on Railway. For production
  durability, implement the Azure Blob driver in `backend/src/utils/storage.ts`
  and set `STORAGE_DRIVER=azure`.
- **Email** is on the dev transport (previews only). Set `EMAIL_DRIVER=smtp` and
  `SMTP_*` vars to send real notifications.
- **CORS** needs no configuration in production because the SPA is served from
  the same origin as the API.
- To deploy on a plain VM instead of Railway, the same `Dockerfile` works:
  `docker build -t wfm-portal . && docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 4000:4000 wfm-portal`.

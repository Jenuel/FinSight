# FinSight API

Django REST backend for FinSight, deployed as a Docker Web Service on **Render** (free tier).

## Deployment Options on Render

### Option A: Render Blueprint (Recommended)
1. In the Render Dashboard, click **New +** → **Blueprint**.
2. Connect this GitHub repository.
3. Render detects `render.yaml` in the repo root and sets up `finsight-api`.
4. Fill in the prompted environment variables (see below).

### Option B: Manual Web Service
1. In Render, click **New +** → **Web Service** → Connect your repository.
2. Select **Docker** runtime.
3. Set **Dockerfile Path** to `./backend/Dockerfile` and **Docker Context** to `./backend`.
4. Choose the **Free** instance type.
5. Set Health Check Path to `/api/health/`.
6. Add the environment variables below.

---

## Required Environment Variables

The container refuses to boot when `DEBUG=False` if required security variables are missing (see `config/settings.py`).

| Variable | Secret? | Description / Example |
|---|---|---|
| `SECRET_KEY` | Yes | Secure random key (Render generates this automatically with Blueprint). Or generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DATABASE_URL` | Yes | Postgres connection string (e.g. Supabase pooler URI). Required — container filesystem is ephemeral. |
| `DEBUG` | No | `False` |
| `ALLOWED_HOSTS` | No | Your Render hostname, e.g. `finsight-api.onrender.com` |
| `CORS_ALLOW_ALL_ORIGINS` | No | `False` |
| `CORS_ALLOWED_ORIGINS` | No | Your Vercel frontend URL, e.g. `https://finsight.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | No | Your Render backend URL, e.g. `https://finsight-api.onrender.com` (needed for `/admin/`) |
| `CLERK_JWKS_URL` | Yes | `https://<your-clerk-frontend-api>/.well-known/jwks.json` |
| `CLERK_ISSUER` | Yes | `https://<your-clerk-frontend-api>` |
| `CLERK_AUTHORIZED_PARTIES` | No | Same as Vercel frontend URL, e.g. `https://finsight.vercel.app` |
| `LOG_LEVEL` | No | `INFO` |
| `PORT` | No | `8000` (or leave default `$PORT` provided by Render) |

---

## Health Check

* Endpoint: `GET /api/health/` (public, touches the database to verify service health).
* Note on Render free-tier: Web services spin down after 15 minutes of inactivity; cold starts take ~50 seconds when a new request arrives.

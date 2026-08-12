---
title: FinSight API
emoji: 💰
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# FinSight API

Django REST backend for FinSight, deployed as a Hugging Face **Docker Space**.
This directory is pushed verbatim to the Space by
`.github/workflows/deploy-hf.yml`, so the YAML block above is the Space's
configuration: `sdk: docker` makes HF build the `Dockerfile`, and `app_port`
tells its proxy which port gunicorn listens on.

## Space configuration (Settings → Variables and secrets)

The container refuses to boot until these are set — that is deliberate
(see `config/settings.py`): a missing value breaks the deploy instead of
silently running unconfigured.

**Secrets** (never as plain variables):

| Name | Value |
|---|---|
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DATABASE_URL` | Postgres connection string (e.g. Supabase). REQUIRED — the Space's own filesystem is ephemeral, so the SQLite fallback would be wiped on every restart. |
| `CLERK_JWKS_URL` | `https://<your-app>.clerk.accounts.dev/.well-known/jwks.json` |
| `CLERK_ISSUER` | `https://<your-app>.clerk.accounts.dev` |

**Variables** (non-secret config):

| Name | Value |
|---|---|
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `<owner>-<space-name>.hf.space` (the Space's direct URL host) |
| `CORS_ALLOW_ALL_ORIGINS` | `False` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel origin(s), e.g. `https://finsight.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://<owner>-<space-name>.hf.space` (needed for `/admin/` only) |
| `CLERK_AUTHORIZED_PARTIES` | Your Vercel origin(s) — tokens minted for any other frontend are rejected |
| `LOG_LEVEL` | `INFO` |

## Health / keep-alive

`GET /api/health/` is public and touches the database. The GitHub Actions
workflow `keep-alive.yml` pings it once a day so the free-tier Space never
crosses HF's 48-hour inactivity threshold and gets put to sleep.

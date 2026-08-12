FROM python:3.12-slim

# Pinned rather than :latest so image builds are reproducible.
COPY --from=ghcr.io/astral-sh/uv:0.9.18 /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Put the venv's binaries on PATH so gunicorn is callable directly.
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Dependencies first: this layer is cached until pyproject/uv.lock change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

# Collect static assets (Django admin CSS) for WhiteNoise to serve.
# SECRET_KEY is required for settings to load, but collectstatic never uses it -
# this placeholder exists only for the build and is not the runtime key.
RUN SECRET_KEY=build-only-placeholder DEBUG=True uv run python manage.py collectstatic --noinput

# Run as an unprivileged user: a container process should not be root.
# UID 1000 specifically because Hugging Face Spaces documents it as the
# expected UID for Docker Spaces.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Hugging Face routes traffic to the port declared as `app_port` in README.md,
# which is set to 8000 to match this.
EXPOSE 8000

# Gunicorn, not runserver: runserver is single-threaded, unsupported for
# production, and explicitly documented by Django as not security-audited.
# Migrations run at container start because HF Spaces has no release-phase
# hook; the free tier runs exactly one replica, so there is no concurrent
# instance to race against.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 60 --access-logfile - --error-logfile -"]

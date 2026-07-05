FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies using uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy project files
COPY . .

EXPOSE 8000

# Run the Django development server
# Note: For production, you should use a WSGI server like gunicorn
CMD ["uv", "run", "manage.py", "runserver", "0.0.0.0:8000"]

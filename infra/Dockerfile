# infra/Dockerfile

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencias del SO mínimas (psycopg2 requiere libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

# Instala requirements
COPY ./backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --disable-pip-version-check --progress-bar off -r /app/requirements.txt

# Copia el código
COPY ./backend /app

# Asegura permisos de ejecución
RUN chmod +x /app/start.sh

EXPOSE 8000

# Comando por defecto (lo overridea docker-compose con "command" si quisieras)
CMD ["bash", "start.sh"]

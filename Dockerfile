# ==========================
# AUTOAI Backend - Toolbox Safe Build
# ==========================
FROM python:3.11-slim

# Evitar buffering y chequeos de versión
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY ./requirements.txt /app/requirements.txt

# 💡 Solución clave: desactivar threading completamente y usar --use-deprecated=legacy-resolver
RUN python -m ensurepip && \
    PIP_PROGRESS_BAR=off pip install --no-cache-dir --no-input --progress-bar off --use-deprecated=legacy-resolver \
        fastapi==0.121.0 \
        uvicorn==0.38.0 \
        psycopg2-binary==2.9.11 \
        redis==7.0.1 \
        pydantic==2.12.3 \
        python-dotenv==1.2.1 \
        requests==2.32.5 \
        sqlalchemy==2.0.44

# Copiar el código fuente
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de ejecución
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

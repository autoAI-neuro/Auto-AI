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

# Copiar dependencias del backend
COPY ./backend/requirements.txt /app/requirements.txt

# Instalar TODAS las dependencias
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copiar el código fuente
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de ejecución
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


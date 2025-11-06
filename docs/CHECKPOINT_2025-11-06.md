# AUTOAI — Checkpoint 2025-11-06

## Estado estable
- **Docker Desktop** operativo.
- `infra/docker-compose.yml` levanta 4 servicios:
  - `autoai-backend`: FastAPI + Uvicorn en `:8000`.
  - `autoai-frontend`: Nginx sirviendo build de Vite en `:3000`.
  - `autoai-db`: Postgres 15.
  - `autoai-redis`: Redis alpine.
- `backend/start.sh` sin BOM/CRLF (UTF-8 LF).  
- Health: `http://localhost:8000/health` → `{ "status": "ok", "version": "2.0.0" }`.
- Frontend: build Vite copiado a `/usr/share/nginx/html`.

## Árbol relevante
- `/infra/docker-compose.yml`
- `/backend/Dockerfile`, `/backend/requirements.txt`, `/backend/app/main.py`, `/backend/start.sh`
- `/frontend/Dockerfile`, `/frontend/package.json`, `/frontend/src/*`, `/frontend/index.html`

## Comandos fiables
```bash
# Desde el root del repo
docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml logs backend
docker ps


AUTOAI — Checkpoint 2025-11-07
✅ Infra OK (FastAPI + React + Docker)
✅ API Base operativa (/health / ping / version)
✅ Frontend interactivo conectado
🎯 Siguiente Fase: Persistencia (ORM, SQLAlchemy, Alembic)


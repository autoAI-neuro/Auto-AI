#!/bin/sh
echo "🚀 Iniciando AUTOAI Backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

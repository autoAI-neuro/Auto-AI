\# AUTOAI – Plataforma IA de Ventas Multicanal





Proyecto basado en \*\*Master Plan Final v2.0\*\*: agente IA multicanal (WhatsApp/IG/FB/Email), voz del vendedor, seguimiento postventa, calendario, almacenamiento en la nube, analítica y auto-aprendizaje.





\## Módulos

\- Backend: FastAPI + PostgreSQL

\- Orchestrator IA: SalesFlow YAML + LLM

\- Integraciones: Meta Cloud API, Google Drive/Calendar

\- Voice Calls: voz clonada del vendedor





\## Arranque rápido

1\. Copia `.env.example` a `.env` y completa credenciales.

2\. `docker compose up -d` (db + api)

3\. Visita `http://localhost:8000/health` para verificar.

4\. Importa `docs/data\_model.sql` a la base si usas SQL directo (o usa ORM/migraciones después).





\## Continuidad del proyecto

Lee `CONTINUITY.md` y usa `prompts/bootstrap\_context.txt` cuando abras un chat nuevo.


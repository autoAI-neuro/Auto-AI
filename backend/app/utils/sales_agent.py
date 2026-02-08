"""
RAY CLON V2.0 - Sales Agent State Machine
Unified Brain: Uses same Logic & Tools as ai_service.py
"""
import os
import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from openai import OpenAI

from app.services.calculator import CalculatorService
from app.services.calendar_integration import CalendarService
from app.utils.agent_tools import update_conversation_state, get_conversation_state

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ============================================
# MASTER PROMPT (COPIED FROM AI_SERVICE.PY)
# ============================================
RAY_SYSTEM_PROMPT = """Eres RAY, vendedor senior de Toyota.
TU PROPÓSITO ÚNICO ES CERRAR VENTAS ASISTIDAS POR DATOS.

🔥 PROTOCOLO DE EJECUCIÓN SECUENCIAL (OBLIGATORIO) 🔥

NO ASUMAS NADA. SIGUE ESTE ORDEN:
1. ¿Usuario dijo Modelo? -> Si NO dijo Plan (Compra/Lease), PREGUNTA: "¿Lo buscas financiado o en lease?".
2. ¿Usuario dijo Modelo + Plan? -> Si NO dijo Score, PREGUNTA: "¿Tienes un estimado de tu crédito? (Ej. 600, 700+)".
3. SOLO SI TIENES (Modelo + Plan + Score) -> EJECUTA `calculate_payment`.

CASO EXCEPCIONAL (PRECIO EXPLÍCITO):
Si el cliente pregunta DIRECTAMENTE "¿Cuánto sale?" o "¿Dame precio?" SIN dar datos:
- DALE UN ESTIMADO GENÉRICO INMEDIATAMENTE (Asume 650/2k) pero advierte: "Como referencia inicial (basado en crédito estándar)...".
- LUEGO pide el Score para afinar.

PERO SI ESTAMOS EN DÍALOGO NORMAL:
1. Modelo? -> Chequeado.
2. Lease/Compra? -> Chequeado.
3. Score? -> Chequeado.
4. Documento? -> FALTANTE -> ¡PÍDELO INMEDIATAMENTE DESPUÉS DE LOS NÚMEROS!

🚫 PROHIBIDO INVITAR AL DEALER SIN SABER EL DOCUMENTO 🚫
Si ya diste el número, TU SIGUIENTE PREGUNTA DEBE SER:
"Para confirmar si calificas con estos números, ¿tienes Social, ITIN o Pasaporte?"
(SOLO cuando respondan esto, entonces invitas).

🧠 MANEJO DE AMBIGÜEDAD
- ¿No dijo Down Payment? -> Asume $2,000 (Estándar).
- ¿No dijo Documento? -> PREGUNTA OBLIGATORIA.

EJEMPLO CORRECTO:
Cliente: "Quiero un Corolla, tengo 650 score"
Ray (Internamente llama a tool): *Calcula*
Ray (Respuesta): "Con tu score de 650 y $2,000 de inicial (estándar), el Corolla LE te queda en $X/mes. ¿Te cuadra para venir?"

EJEMPLO INCORRECTO (PROHIBIDO 🚫):
Ray: "Perfecto, un Corolla es gran auto. Déjame hacerte los números..." (ESTO ES FALLO CRÍTICO)

🔧 USO DE HERRAMIENTAS
1. `calculate_payment`: Úsala sin miedo. Si te faltan datos, usa los Defaults.
2. `check_calendar`: Solo para agendar APPOINTMENT real.

⚠️ SI NO DAS UN NÚMERO, ESTÁS FALLANDO EN TU MISIÓN.

🕵️ REGLA DE DOCUMENTACIÓN (OBLIGATORIA)
Si el cliente acepta los números, ANTES DE AGENDAR LA CITA, debes validar su estatus legal si no lo mencionó:
"Por cierto, para buscar la mejor aprobación, ¿tienes Social, ITIN o Pasaporte?"

📅 PROTOCOLO DE CITA CONFIRMADA
Cuando el cliente diga "Sí" a la hora de la cita, DEBES confirmar y LISTAR REQUISITOS:
"¡Listo! Agendado para mañana a las 10:00 AM.
Por favor recuerda traer:
1. Licencia de conducir / Pasaporte
2. Prueba de Ingresos (Uber app / Talones)
3. Prueba de residencia (Bill de luz/agua)
4. Seguro vigente (si tienes)
5. El Down Payment pactado"

INSTRUCCIONES EXTRA DE CONTEXTO:
A continuación verás el estado actual del cliente. ÚSALO para no preguntar lo que ya sabes.
"""

RAY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_payment",
            "description": "FORCE EXECUTION when model matches. Assume defaults if needed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model_name": {"type": "string", "description": "Model name. If generic (e.g. 'Corolla'), assume Base Trim (e.g. 'Corolla LE')."},
                    "plan_type": {"type": "string", "enum": ["lease", "finance"], "description": "Type of deal. If unsure, pick sensible default."},
                    "credit_score": {"type": "integer", "description": "Score. Default 650 if missing."},
                    "down_payment": {"type": "number", "description": "Down payment. Default 2000.0 if missing."}
                },
                "required": ["model_name", "plan_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_calendar",
            "description": "Checks available appointment slots.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_appointment",
            "description": "Schedule a confirmed appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "datetime_iso": {"type": "string", "description": "ISO 8601 datetime (e.g. 2026-02-08T10:00:00)"},
                    "notes": {"type": "string", "description": "Any special notes or requirements (documents to bring)"}
                },
                "required": ["datetime_iso"]
            }
        }
    }
]

# ============================================
# MAIN AGENT FUNCTION
# ============================================

def process_message_with_agent(
    db: Session,
    clone,  # SalesClone model
    client_id: str,
    buyer_message: str,
    conversation_history: Optional[List[dict]] = None
) -> Dict[str, Any]:
    """
    Main entry point for the RAY agent (V2 Unified Brain).
    Connects to OpenAI, uses tools, and manages state.
    NOW WITH MEMORY SYSTEM: Ray remembers everything about each client.
    """
    from app.services.memory_service import MemoryService
    
    # === STEP 1: Get or create memory for this client ===
    memory = MemoryService.get_or_create_memory(db, client_id, clone.user_id)
    
    # Increment interaction count
    MemoryService.increment_interaction(db, client_id, clone.user_id)
    
    # === STEP 2: Get conversation state (for stage tracking) ===
    state = get_conversation_state(db, client_id)
    if not state:
        state = {
            "mode": "DISCOVERY",
            "status_color": "yellow",
            "vehicle_interest": None,
            "usage_type": None
        }
        update_conversation_state(db, client_id, clone.user_id, **state)
    
    # === STEP 3: Generate rich context from memory ===
    memory_context = MemoryService.generate_context_for_ray(memory)
    
    context_str = f"""
{memory_context}

ESTADO DE LA CONVERSACIÓN ACTUAL:
- Stage: {state.get('stage', 'INTAKE')}
- Vehículo discutido: {state.get('vehicle_interest', 'No definido')}
- Score mencionado: {state.get('credit_score', 'No definido')}
- Documento: {state.get('doc_type', 'No definido')}

PERSONALIDAD PERSONALIZADA DEL USUARIO:
{clone.personality or 'Usa el tono de Ray por defecto.'}

INSTRUCCIÓN ESPECIAL DE MEMORIA:
Si el cliente ya te dio información antes (ves arriba en MEMORIA DEL CLIENTE), 
NO la pidas de nuevo. Usa lo que ya sabes para personalizar tu respuesta.
Si hay objeciones previas, tenlas en cuenta al responder.
"""
    
    # === STEP 4: Call OpenAI with full context ===
    response_text = _call_openai_with_tools(
        system_prompt=RAY_SYSTEM_PROMPT + "\n" + context_str,
        user_message=buyer_message,
        history=conversation_history
    )
    
    # === STEP 5: Extract insights from buyer's message and update memory ===
    try:
        # Get existing memory as dict for context
        existing_memory = {
            "vehicles_interested": memory.vehicles_interested,
            "preferred_budget_monthly": memory.preferred_budget_monthly,
            "objections": memory.objections
        }
        
        # Extract new insights from the buyer's message
        insights = MemoryService.extract_insights_from_message(
            buyer_message, 
            existing_memory
        )
        
        # Apply insights to memory
        if insights:
            MemoryService.update_memory_from_insights(db, client_id, insights)
    except Exception as e:
        print(f"[SalesAgent] Error updating memory: {e}")
    
    # === STEP 6: Calculate relationship score ===
    try:
        new_score = MemoryService.calculate_relationship_score(memory)
        if memory.relationship_score != new_score:
            memory.relationship_score = new_score
            db.commit()
    except Exception as e:
        print(f"[SalesAgent] Error calculating relationship score: {e}")
    
    return {
        "response": response_text,
        "confidence": 0.95,
        "stage": "RAY_V2_AUTO",
        "status_color": "green",
        "state_update": state,
        "memory_updated": True
    }

def _call_openai_with_tools(system_prompt: str, user_message: str, history: Optional[List[dict]]) -> str:
    """Call OpenAI API with Tools."""
    
    if not OPENAI_API_KEY:
        return "Error: OPENAI_API_KEY missing."
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "buyer" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        # First call force tool use auto
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=RAY_TOOLS,
            tool_choice="auto",
            temperature=0.3
        )
        
        response_msg = response.choices[0].message
        
        # Tool execution loop
        if response_msg.tool_calls:
            messages.append(response_msg)
            
            for tool_call in response_msg.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)
                tool_output = "Error"
                
                if func_name == "calculate_payment":
                    # Default down payment logic
                    dp = func_args.get("down_payment")
                    if dp is None: dp = 2000.0
                    
                    if func_args.get("plan_type") == "lease":
                        res = CalculatorService.calculate_lease(
                            func_args.get("model_name"),
                            func_args.get("credit_score", 650),
                            dp
                        )
                    else:
                        res = CalculatorService.calculate_finance(
                            func_args.get("model_name"),
                            func_args.get("credit_score", 650),
                            dp
                        )
                    tool_output = json.dumps(res)
                    
                elif func_name == "check_calendar":
                    tool_output = CalendarService.check_calendar()
                    
                elif func_name == "schedule_appointment":
                    # Call Calendar Service to create appointment
                    dt_iso = func_args.get("datetime_iso")
                    notes = func_args.get("notes", "")
                    
                    try:
                        # Correct import from the new service location
                        from app.utils.calendar_service import CalendarService as CalSvc
                        
                        appt = CalSvc.create_appointment(
                            db=db,
                            client_id=client_id,
                            user_id=clone.user_id,
                            start_time=dt_iso,
                            notes=notes
                        )
                        # Format success output
                        tool_output = json.dumps({
                            "status": "success", 
                            "appointment_id": appt.id, 
                            "time": dt_iso,
                            "message": "Cita agendada correctamente en base de datos."
                        })
                    except Exception as e:
                        print(f"[SalesAgent] Error scheduling appointment: {e}")
                        tool_output = json.dumps({"status": "error", "message": str(e)})
                
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": func_name,
                    "content": tool_output
                })
            
            # Second call for final answer
            final_res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7
            )
            return final_res.choices[0].message.content.strip()
            
        return response_msg.content.strip()

    except Exception as e:
        print(f"[SalesAgent] Error: {e}")
        return "Hubo un error procesando tu solicitud. Intenta de nuevo."

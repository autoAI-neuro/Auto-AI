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

🔥 PROTOCOLO DE EJECUCIÓN (CONDICIONAL) 🔥
1. SI el usuario menciona Modelo + Plan (Compra/Lease) -> EJECUTA `calculate_payment` YA. (Usa defaults para Score/Down si faltan).
2. SI el usuario SOLO menciona Modelo -> PREGUNTA: "¿Lo buscas financiado o en lease?". NO ASUMAS EL PLAN TODAVÍA.
3. SI el usuario pide precio explícitamente ("¿Cuánto sale mensualmente?") -> ASUME la opción más lógica (Lease para sedanes, Compra para trucks) y CALCULA.

🧠 MANEJO DE AMBIGÜEDAD
- ¿Dijo "Corolla"? -> Asume "Corolla LE".
- ¿No dijo Down Payment? -> Asume $2,000.
- ¿No dijo Score? -> Asume 650.
- ¿No dijo Lease/Compra? -> ¡PREGUNTA! (A menos que pida precio directo).

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
    """
    
    # Get or create conversation state
    state = get_conversation_state(db, client_id)
    if not state:
        state = {
            "mode": "DISCOVERY",
            "status_color": "yellow",
            "vehicle_interest": None,
            "usage_type": None
        }
        update_conversation_state(db, client_id, clone.user_id, **state)

    # Build Context
    context_str = f"""
    ESTADO ACTUAL DEL CLIENTE:
    - Vehículo Interés: {state.get('vehicle_interest', 'No definido')}
    - Uso: {state.get('usage_type', 'No definido')}
    - Score: {state.get('credit_score', 'No definido')}
    - Documento: {state.get('doc_type', 'No definido')}
    
    PERSONALIDAD PERSONALIZADA DEL USUARIO:
    {clone.personality or 'Usa el tono de Ray por defecto.'}
    """
    
    # Call OpenAI with Tools
    response_text = _call_openai_with_tools(
        system_prompt=RAY_SYSTEM_PROMPT + "\n" + context_str,
        user_message=buyer_message,
        history=conversation_history
    )
    
    # Simple state extraction update based on the AI's response logic is hard without structured output,
    # so for V2 we rely on the Tool Calls to be the "Actions". 
    # We can add a lightweight extraction later if needed.
    # For now, we update Last Message time.
    
    return {
        "response": response_text,
        "confidence": 0.95,
        "stage": "RAY_V2_AUTO",
        "status_color": "green",
        "state_update": state
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

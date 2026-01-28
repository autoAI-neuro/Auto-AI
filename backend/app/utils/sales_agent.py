"""
RAY CLON V2.0 - Sales Agent State Machine
The core engine that processes messages and manages conversation flow
"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime

from app.utils.agent_tools import (
    calc_payment_purchase,
    calc_payment_lease,
    get_credit_tier,
    inventory_search,
    update_conversation_state,
    get_conversation_state,
    generate_payment_scenarios
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


# ============================================
# STAGE-SPECIFIC PROMPTS
# ============================================

# ============================================
# MASTER PROMPT V2.0 - RAY CLON
# ============================================

# ============================================
# MASTER PROMPT V2.1 - RAY CLON (AUTHORITY HARDENED)
# ============================================

RAY_BASE_PROMPT = """Eres **Ray**, vendedor de Toyota. Hablas en español, tono humano, directo, con seguridad y claridad. 

🔒 **AUTORIDAD ABSOLUTA — RAY**

Actúas como vendedor senior dentro del sistema Toyota.
Siempre tienes acceso a:
- Calculadora oficial
- PDFs internos
- Escenarios de aprobación

**PROHIBIDO:**
- Decir que “no tienes acceso”
- Explicar qué es una herramienta
- Pedir permiso para usarla ("¿Te gustaría que corra los números?")
- Decir “si quieres lo reviso”
- Decir “cuando vengas lo vemos” (como excusa para no dar datos)

Tú ya estás revisando.
Tú ya estás calculando.
Tú solo comunicas resultados.

### Reglas de oro (NO NEGOCIABLES)

1. **PROHIBIDO agendar cita** hasta completar el **MINI-PERFIL** (ver abajo).
2. **PROHIBIDO inventar números**. Si aún no tienes los datos para la calculadora, consíguelos.
3. **Nunca preguntes “¿prefieres con o sin inicial?”**
4. **Nunca presiones con cita repetitiva** si el cliente aún pregunta “¿califico?”.
5. **Nunca contradigas una decisión del cliente.** Si el cliente dijo “compra”, tú sigues compra.
6. **Nunca cierres la conversación vacío** (“estamos en contacto”).
7. Máximo **1 pregunta por mensaje**.
8. **PROHIBIDO preguntar “cuánto tiempo llevas trabajando” o "ingresos"** en la fase de calificación.
9. **PROHIBIDO** frases de bot: "avancemos con el proceso", "te indicaré cómo hacerlo".

### Respuestas clave Ray (cuando el cliente reta)

- “¿Cómo me agendas si no sabes mi score?” → “Exacto, por eso primero lo cuadramos aquí. Dame tu score aproximado y si tienes SSN o pasaporte.”
- “¿Califico o no?” → “Con lo que me digas de score + documento, te puedo decir si estás en rango. No te voy a hacer perder el tiempo.”
"""


# ============================================
# INJECTION PROMPTS (V3 LOGIC MODES)
# ============================================

LOGIC_MODES = {
    "DISCOVERY": """🟨 MODO DISCOVERY ACTIVADO

⚠️ ESTADO: FALTA CONTEXTO COMERCIAL.

Tu única misión es entender QUÉ quiere el cliente y POR QUÉ lo quiere.
No asumas intenciones.
No hables de precios, cuotas, calculadoras ni citas.

Debes obtener obligatoriamente:
- Qué vehículo está buscando (modelo o tipo)
- Si es su primer carro o ya ha financiado antes
- Para qué lo va a usar (uso real, no emocional)

Prohibido:
- Ofrecer lease o compra como decisión
- Mencionar inicial
- Agendar citas

Habla como Ray: directo, claro, humano.""",

    "QUALIFICATION": """🟧 MODO QUALIFICATION ACTIVADO — REGLA DURA

Solo puedes recolectar:
- Score aproximado
- Documento (SSN / ITIN / Pasaporte)
- Confirmar si es primer carro (si no lo tienes)

PROHIBIDO ABSOLUTO:
- Preguntar ingresos
- Preguntar empleo
- Preguntar tiempo trabajado
- Mencionar calculadoras
- Mencionar citas
- Explicar procesos

Si ya tienes score + documento:
NO HAGAS PREGUNTAS. Asume que pasas directo a Estrategia/Oferta.""",

    "STRATEGY": """🟥 MODO STRATEGY ACTIVADO

⚠️ ESTADO: DECISIÓN FINANCIERA CRÍTICA.

El perfil ya está completo, pero el cliente puede estar
tomando una decisión que NO le conviene.

Tu misión es:
- Analizar si la intención del cliente tiene sentido financiero
- Detectar riesgo (primer comprador, SUV grande, posible upside down)
- Recomendar lo que conviene, no lo que el cliente cree que quiere

Debes hablar como Ray:
- Explica consecuencias reales
- Usa lógica, no presión
- Frases tipo: "Si yo fuera tú…" / "Para no perder dinero…"

Prohibido:
- Usar calculadora
- Dar cuotas
- Agendar citas
- Contradecirte

No avances hasta que el cliente ACEPTE la estrategia.""",

    "OFFER": """🟩 MODO OFFER ACTIVADO

✅ ESTADO: ESTRATEGIA ACEPTADA.

Nunca menciones herramientas.
Nunca pidas permiso.
Nunca expliques el proceso.
Habla como alguien que ya hizo los números.

Tu misión es:
- Mostrar escenarios claros y coherentes
- Mantener el modelo exacto solicitado
- Aclarar que los montos son aproximados y sujetos a aprobación final

Prohibido:
- Cambiar de modelo
- Dar ejemplos genéricos
- Forzar cierre""",

    "APPOINTMENT": """🟦 MODO APPOINTMENT ACTIVADO

✅ ESTADO: CLIENTE ALINEADO Y CONFORME.

Ya hubo números.
El cliente expresó que el escenario le hace sentido.

Tu misión es:
- Proponer el siguiente paso de forma natural
- Agendar solo si el cliente está listo

Prohibido:
- Imponer horarios
- Repetir citas
- Insistir si el cliente duda

La cita es consecuencia del criterio, no una presión."""
}

TRADE_IN_ALERT = """🔴 ALERTA TRADE-IN ACTIVADA

⚠️ El cliente indicó que ya tiene un vehículo financiado.

Asume posible upside down hasta que se demuestre lo contrario.

Tu misión es:
- Frenar ofertas agresivas
- Explicar que primero hay que evaluar el vehículo actual
- NO dar cuotas finales sin evaluar trade-in

Prohibido:
- Ignorar el trade
- Agendar citas sin aclarar este punto"""


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
    Main entry point for the RAY agent.
    Processes message through V3 LOGIC MODES.
    """
    
    # Get or create conversation state
    state = get_conversation_state(db, client_id)
    if not state:
        state = {
            "mode": "DISCOVERY",
            "status_color": "yellow",
            # Profile Data
            "vehicle_interest": None,
            "usage_type": None,
            "first_time_buyer": None,
            "credit_score": None,
            "doc_type": None,
            "deal_intent": "unknown",
            "strategy_accepted": False,
            "has_trade_in": False,
            "downpayment_available": 0
        }
        update_conversation_state(db, client_id, clone.user_id, **state)
    
    # Extract information from message
    extracted = _extract_info_from_message(buyer_message, state)
    
    # Update state with extracted info
    if extracted:
        state.update(extracted)
        update_conversation_state(db, client_id, clone.user_id, **extracted)
    
    # DETERMINE ACTIVE MODE (Cognitive Gating)
    active_mode = _determine_active_mode(state)
    state["mode"] = active_mode
    update_conversation_state(db, client_id, clone.user_id, stage=active_mode)
    
    # Generate tool context IF in OFFER mode
    tool_context = ""
    if active_mode == "OFFER":
        tool_context = _generate_offer_context(state)
    
    # Build the full prompt
    system_prompt = _build_agent_prompt(clone, state, active_mode, tool_context)
    
    # Generate response
    response = _call_openai(system_prompt, buyer_message, conversation_history)
    
    # Update status color based on mode
    status_color = _get_status_color(state)
    if status_color != state.get("status_color"):
        update_conversation_state(db, client_id, clone.user_id, status_color=status_color)
    
    return {
        "response": response,
        "confidence": 0.90,
        "stage": active_mode,
        "status_color": status_color,
        "state_update": state
    }


# ============================================
# HELPER FUNCTIONS
# ============================================

def _determine_active_mode(state: dict) -> str:
    """
    Cognitive Gating Logic to determine the active mode.
    Flow: DISCOVERY -> QUALIFICATION -> STRATEGY -> OFFER -> APPOINTMENT
    """
    
    # 1. DISCOVERY GATE
    # Needs: Vehicle AND Usage AND info about financing history
    # Relaxed slightly: If we know vehicle + usage, we can move to Qual
    # and ask for financing history there if needed, but strict Discovery is better.
    if not state.get("vehicle_interest") or \
       not state.get("usage_type"):
        return "DISCOVERY"

    # 2. QUALIFICATION GATE
    # Needs: Credit Score AND Doc Type
    if not state.get("credit_score") or not state.get("doc_type"):
        return "QUALIFICATION"

    # 3. STRATEGY GATE
    # Needs: Strategy Accepted flag.
    # CRITICAL FIX: If profile is solid (e.g. good score + purchase), 
    # we can imply strategy acceptance to skip unnecessary friction.
    # But for now, let's keep it safe.
    
    # Auto-accept strategy if user explicitly said "Purchase" and has good profile?
    # No, adhere to user request: "No advances hasta que cliente ACEPTE".
    # BUT, if we just got the Qual info, we MUST enter STRATEGY.
    
    if not state.get("strategy_accepted"):
        return "STRATEGY"

    # 4. OFFER/APPOINTMENT LOGIC
    # If appointment set -> Appointment
    if state.get("appointment_datetime"):
        return "APPOINTMENT"
    
    # Default to OFFER (Tools Enabled)
    return "OFFER"


def _generate_offer_context(state: dict) -> str:
    """Generate tool-based context for offer building."""
    
    vehicle = state.get("vehicle_interest", {})
    price = vehicle.get("price_est", 30000)
    downpayment = state.get("downpayment_available", 1000)
    credit_score = state.get("credit_score")
    is_first_buyer = state.get("first_time_buyer", False)
    
    scenarios = generate_payment_scenarios(
        vehicle_price=price,
        credit_score=credit_score,
        is_first_buyer=is_first_buyer,
        downpayment=downpayment
    )
    
    # Safe format helper
    def fmt_usd(val):
        return f"${val:,}" if val is not None else "N/A"

    context = f"""
DATOS DE CALCULADORA (USAR ESTOS NÚMEROS):
- Vehículo: {vehicle.get('model', 'N/A')} {vehicle.get('year', '')}
- Precio base: {fmt_usd(price)}
- Inicial disponible: {fmt_usd(downpayment)}
- Tier crediticio: {scenarios['credit_tier'].get('tier', 'Unknown')} ({scenarios['credit_tier'].get('description', '')})

ESCENARIO COMPRA:
- Pago mensual: ${scenarios['purchase']['monthly_payment']}/mes x {scenarios['purchase']['term_months']} meses
- APR estimado: {scenarios['purchase']['apr']*100:.1f}%
- Cash due at signing: ${scenarios['purchase']['cash_due_at_signing']}

"""
    
    if scenarios.get("lease"):
        context += f"""ESCENARIO LEASE:
- Pago mensual: ${scenarios['lease']['monthly_payment']}/mes x {scenarios['lease']['term_months']} meses
- Due at signing: ${scenarios['lease']['due_at_signing']}
- 12,000 millas/año

"""
    
    context += f"""RECOMENDACIÓN RAY: {scenarios['recommendation']}

USA ESTOS NÚMEROS EXACTOS. No inventes otros."""
    
    return context


def _extract_info_from_message(message: str, current_state: dict) -> dict:
    """Extract relevant info from buyer message."""
    
    extracted = {}
    msg_lower = message.lower()
    
    # Vehicle interest
    car_models = {
        "corolla": {"model": "Corolla", "body_type": "sedan", "price_est": 28000},
        "camry": {"model": "Camry", "body_type": "sedan", "price_est": 32000},
        "rav4": {"model": "RAV4", "body_type": "suv", "price_est": 35000},
        "tacoma": {"model": "Tacoma", "body_type": "pickup", "price_est": 38000},
        "highlander": {"model": "Highlander", "body_type": "suv", "price_est": 45000},
        "civic": {"model": "Civic", "body_type": "sedan", "price_est": 27000},
        "accord": {"model": "Accord", "body_type": "sedan", "price_est": 32000},
        "crv": {"model": "CR-V", "body_type": "suv", "price_est": 34000},
        "cr-v": {"model": "CR-V", "body_type": "suv", "price_est": 34000}
    }
    
    for key, info in car_models.items():
        if key in msg_lower:
            extracted["vehicle_interest"] = info
            break
            
    # Usage Type (New V3 field)
    if any(w in msg_lower for w in ["uber", "lyft", "rideshare", "taxi"]):
        extracted["usage_type"] = "Rideshare/Uber"
    elif any(w in msg_lower for w in ["trabajo", "work", "construcion", "chamba"]):
        extracted["usage_type"] = "Trabajo"
    elif any(w in msg_lower for w in ["familia", "hijos", "esposa", "personal", "diario"]):
        extracted["usage_type"] = "Personal/Familia"
    # Basic fallback if explicit usage mentioned but not categorized
    elif "para " in msg_lower:
        # Simple heuristic, assumes user might be saying "para mi hija" etc.
        # Can be refined.
        pass

    # Doc Type (New V3 field)
    if "ssn" in msg_lower or "social" in msg_lower or "seguro social" in msg_lower:
        extracted["doc_type"] = "SSN"
    elif "itin" in msg_lower or "tax id" in msg_lower:
        extracted["doc_type"] = "ITIN"
    elif "pasaporte" in msg_lower or "passport" in msg_lower:
        extracted["doc_type"] = "Passport"

    # Trade-in detection
    if any(w in msg_lower for w in ["tengo carro", "doy mi carro", "trade", "cambiar mi"]):
        extracted["has_trade_in"] = True

    # Strategy Acceptance
    # Phrases indicating agreement to proposal
    if current_state.get("mode") == "STRATEGY":
        agreement_phrases = ["esta bien", "me parece", "dale", "ok", "vamos con", "hagamos", "esta bien"]
        if any(w in msg_lower for w in agreement_phrases) and not "no" in msg_lower[:3]: # weak check
             extracted["strategy_accepted"] = True
        if "compra" in msg_lower:
             extracted["deal_intent"] = "purchase"
             extracted["strategy_accepted"] = True
        if "lease" in msg_lower:
             extracted["deal_intent"] = "lease"
             extracted["strategy_accepted"] = True

    # Year extraction
    import re
    year_match = re.search(r'20(2[4-9]|[3-9]\d)', message)
    if year_match and "vehicle_interest" in extracted:
        extracted["vehicle_interest"]["year"] = int(year_match.group())
    
    # First time buyer
    first_buyer_phrases = ["primer carro", "primera vez", "primer financ", "nunca he", "first time", "first car"]
    if any(phrase in msg_lower for phrase in first_buyer_phrases):
        extracted["first_time_buyer"] = True
    
    has_credit_phrases = ["ya tengo credito", "ya he tenido", "tengo tarjetas", "have credit"]
    if any(phrase in msg_lower for phrase in has_credit_phrases):
        extracted["first_time_buyer"] = False
    
    # Credit score extraction
    score_match = re.search(r'\b(5[5-9]\d|6\d{2}|7\d{2}|8\d{2})\b', message)
    if score_match:
        extracted["credit_score"] = int(score_match.group())
    
    # Score range mentions
    if "750" in message or "excelente" in msg_lower:
        extracted["credit_score"] = 750
    elif "720" in message:
        extracted["credit_score"] = 720
    elif "680" in message or "bueno" in msg_lower:
        extracted["credit_score"] = 680
    elif "620" in message or "bajo" in msg_lower or "mal credito" in msg_lower:
        extracted["credit_score"] = 620
    
    # Simple deal intent (if mentioned early)
    if "compra" in msg_lower:
        extracted["deal_intent"] = "purchase"
    elif "lease" in msg_lower:
        extracted["deal_intent"] = "lease"
    
    # Downpayment mentions
    down_match = re.search(r'\$?([\d,]+)\s*(dolares|dollars|de inicial|down|entrada)', msg_lower)
    if down_match:
        amount = int(down_match.group(1).replace(",", ""))
        extracted["downpayment_available"] = amount
    
    # Timeline
    if any(w in msg_lower for w in ["hoy", "ahora", "ya", "today", "now"]):
        extracted["buying_timeline"] = "now"
    elif any(w in msg_lower for w in ["semana", "week", "pronto"]):
        extracted["buying_timeline"] = "this_week"
    elif any(w in msg_lower for w in ["explor", "viendo", "looking"]):
        extracted["buying_timeline"] = "exploring"
    
    return extracted


def _build_agent_prompt(clone, state: dict, mode: str, tool_context: str) -> str:
    """Build full system prompt using V3 LOGIC MODES."""
    
    parts = [RAY_BASE_PROMPT]
    
    # Inject Active Mode Prompt
    if mode in LOGIC_MODES:
        parts.append(LOGIC_MODES[mode])
        
    # Inject Trade-In Alert if applicable
    if state.get("has_trade_in"):
        parts.append(TRADE_IN_ALERT)
    
    # State Context
    def fmt_down(s):
        val = s.get('downpayment_available')
        return f"${val:,}" if val is not None else "$0"

    state_context = f"""
DATOS DEL CLIENTE (SISTEMA):
- Vehículo: {state.get('vehicle_interest', {}).get('model', 'N/A')}
- Uso: {state.get('usage_type', 'N/A')}
- Primer Comprador: {state.get('first_time_buyer', 'N/A')}
- Score: {state.get('credit_score', 'N/A')}
- Documento: {state.get('doc_type', 'N/A')}
- Estrategia Aceptada: {state.get('strategy_accepted', False)}
- Trade-In: {state.get('has_trade_in', False)}
- Inicial: {fmt_down(state)}
"""
    parts.append(state_context)
    
    # Tool Context (Only in OFFER mode)
    if tool_context and mode == "OFFER":
        parts.append(tool_context)
    
    # User Personality
    if clone.personality:
        parts.append(f"\nPERSONALIZACIÓN ADICIONAL:\n{clone.personality}")
    
    return "\n\n---\n\n".join(parts)


def _call_openai(system_prompt: str, user_message: str, history: Optional[List[dict]]) -> str:
    """Call OpenAI API with the constructed prompt."""
    
    if not OPENAI_API_KEY:
        return "Hermano, hay un problema técnico. Déjame revisarlo y te escribo."
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "buyer" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
        
        messages.append({"role": "user", "content": user_message})
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=250,
            temperature=0.6
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"[Sales Agent] OpenAI error: {e}")
        return "Dale hermano, un momento que reviso esto y te confirmo."


def _get_status_color(state: dict) -> str:
    """Determine lead status color based on state."""
    mode = state.get("mode", "DISCOVERY")
    if mode == "APPOINTMENT" or state.get("appointment_datetime"):
        return "green"
    return "yellow"

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

STAGE_PROMPTS = {
    "INTAKE": """FASE ACTUAL: INTAKE (Apertura)

OBJETIVO: Identificar qué carro quiere + si es primer comprador.
MÁXIMO 2 preguntas en esta fase.

SI NO SABES QUÉ CARRO QUIERE:
→ "Perfecto hermano. ¿Qué estás buscando: sedán, SUV o pickup? Y dime si sería tu primer carro financiado o ya tienes crédito."

SI YA SABES EL CARRO PERO NO SI ES PRIMER COMPRADOR:
→ "Buen carro. ¿Sería tu primer financiamiento o ya has tenido crédito antes?"

CUANDO TENGAS AMBOS DATOS → avanza a CREDIT_PROFILE""",

    "CREDIT_PROFILE": """FASE ACTUAL: CREDIT_PROFILE

OBJETIVO: Obtener score aproximado y antigüedad de crédito.
NO preguntar documentos todavía.

PREGUNTA CLAVE:
→ "Para darte números reales, dime tu score aproximado: ¿más cerca de 620, 680 o 720+? Y ¿cuánto tiempo tienes con tarjetas?"

SI ES PRIMER COMPRADOR SIN SCORE:
→ "Dale, como es tu primer carro, los bancos te evalúan diferente. Lo importante es que tengas trabajo estable. ¿Cuánto tiempo llevas en tu trabajo actual?"

CUANDO TENGAS CREDIT INFO → avanza a DEAL_TYPE""",

    "DEAL_TYPE": """FASE ACTUAL: DEAL_TYPE

OBJETIVO: Determinar si quiere compra o lease.

SI NO HA MENCIONADO PREFERENCIA:
→ "¿Lo estás pensando en compra o en lease? Te explico rápido: compra es tuyo al final, lease es pago más bajo pero lo devuelves. Para tu perfil te puedo decir cuál te conviene mejor."

SI PREGUNTA LA DIFERENCIA:
→ Explica en 2-3 oraciones máximo, luego recomienda según su perfil crediticio.

CUANDO TENGAS DEAL INTENT → avanza a OFFER_BUILD""",

    "OFFER_BUILD": """FASE ACTUAL: OFFER_BUILD

OBJETIVO: Usar calculadoras para dar números REALES.

INFORMACIÓN QUE NECESITAS:
- Precio del vehículo (de inventario o MSRP conocido)
- Downpayment disponible
- Credit tier (ya debes tenerlo)

RESPUESTA DEBE INCLUIR:
1. Pago mensual estimado
2. Cash due at signing
3. Disclaimer corto: "sujeto a aprobación"

FORMATO RAY:
→ "Con tu perfil y $X de inicial, el Corolla te quedaría en aproximadamente $XXX/mes por 60 meses. Esto es con la calculadora oficial, el número final lo cuadramos cuando te revisen el crédito."

CUANDO DES NÚMEROS → avanza a RECOMMENDATION""",

    "RECOMMENDATION": """FASE ACTUAL: RECOMMENDATION (Consejo Ray)

OBJETIVO: Dar consejo estratégico basado en TODO lo que sabes del cliente.

PARA PRIMER COMPRADOR:
→ "Mi recomendación: con el lease construyes crédito sin ahorcarte. En 3 años subes tu score y el siguiente carro sale más fácil."

PARA CLIENTE CON BUEN SCORE QUERIENDO SUV:
→ "Con tu crédito no hay problema. El SUV te queda bien, el pago está manejable."

PARA CLIENTE CON SCORE BAJO:
→ "Te soy honesto: con el score actual el pago sube. Si metes un poco más de inicial lo mejoramos. ¿Con cuánto más podrías arrancar?"

SIEMPRE TERMINAR CON TIMELINE:
→ "¿Lo quieres para ya, esta semana, o estás explorando?"

CUANDO TENGAS TIMELINE → avanza a APPOINTMENT""",

    "APPOINTMENT": """FASE ACTUAL: APPOINTMENT

OBJETIVO: Cerrar cita.

PROPUESTA DIRECTA (2-3 opciones máximo):
→ "Dale, para cuadrar esto bien sin perder tiempo, tengo hueco mañana a las 6pm o el viernes a las 5pm. ¿Cuál te queda mejor?"

SI NO PUEDE ESOS DÍAS:
→ "Dime qué día te funciona y lo bloqueo. ¿Mañana, pasado, o prefieres el fin de semana?"

SI ACEPTA:
→ "Perfecto, quedamos para [DÍA HORA]. Te mando la ubicación y lo dejamos cuadrado. ¿Vienes solo o con alguien?"

CUANDO AGENDE → avanza a WRAP""",

    "WRAP": """FASE ACTUAL: WRAP

OBJETIVO: Confirmar y dejar todo listo.

CONFIRMACIÓN:
→ "Listo hermano, quedamos para [FECHA]. Antes de que vengas, ¿tienes trade-in o empezamos desde cero?"

SI TIENE TRADE-IN:
→ "Dale, tráelo y lo evaluamos. ¿Sabes más o menos cuánto debes todavía o ya está pagado?"

CIERRE RAY (concreto, no vacío):
→ "Perfecto. Yo me encargo de tener todo listo para cuando llegues. Si surge algo antes, me escribes."

NUNCA digas "estamos en contacto" o "cualquier cosa aquí estoy"."""
}


# ============================================
# RAY BASE PROMPT (Always included)
# ============================================

RAY_BASE_PROMPT = """Eres Ray, vendedor de carros REAL en Miami.

ESTILO ÚNICO:
- Directo, natural, hablas como en la calle pero profesional
- Usas "hermano" de forma natural
- Seguro, calmado, NUNCA necesitado
- LIDERAS la conversación, no la acompañas

🚫 PROHIBIDO ABSOLUTO:
- "estamos en contacto"
- "cualquier cosa aquí estoy"
- "avancemos con el proceso"
- "te indicaré cómo hacerlo"
- "¿Te parece si...?"
- "¿Prefieres con o sin inicial?"
- Preguntas vacías sin propósito

REGLAS DE ORO:
1. NUNCA inventes números - usa solo lo que te da el sistema
2. NUNCA repitas preguntas ya respondidas
3. SIEMPRE deja siguiente paso concreto con tiempo
4. Respuestas CORTAS (2-4 oraciones) - esto es WhatsApp
5. Si el cliente ya dijo qué carro quiere, YA LO SABES"""


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
    Processes message through state machine.
    
    Returns:
        {
            "response": str,
            "confidence": float,
            "stage": str,
            "status_color": str,
            "state_update": dict
        }
    """
    
    # Get or create conversation state
    state = get_conversation_state(db, client_id)
    if not state:
        state = {
            "stage": "INTAKE",
            "status_color": "yellow",
            "vehicle_interest": None,
            "deal_intent": "unknown",
            "credit_score": None,
            "first_time_buyer": None
        }
        update_conversation_state(db, client_id, clone.user_id, **state)
    
    current_stage = state.get("stage", "INTAKE")
    
    # Extract information from message
    extracted = _extract_info_from_message(buyer_message, state)
    
    # Update state with extracted info
    if extracted:
        state.update(extracted)
        update_conversation_state(db, client_id, clone.user_id, **extracted)
    
    # Determine if we should advance stage
    new_stage = _determine_next_stage(state, buyer_message)
    if new_stage != current_stage:
        state["stage"] = new_stage
        update_conversation_state(db, client_id, clone.user_id, stage=new_stage)
    
    # Generate tool context if in OFFER_BUILD stage
    tool_context = ""
    if state["stage"] == "OFFER_BUILD" and state.get("vehicle_interest"):
        tool_context = _generate_offer_context(state)
    
    # Build the full prompt
    system_prompt = _build_agent_prompt(clone, state, tool_context)
    
    # Generate response
    response = _call_openai(system_prompt, buyer_message, conversation_history)
    
    # Update status color based on stage
    status_color = _get_status_color(state)
    if status_color != state.get("status_color"):
        update_conversation_state(db, client_id, clone.user_id, status_color=status_color)
    
    return {
        "response": response,
        "confidence": 0.90,
        "stage": state["stage"],
        "status_color": status_color,
        "state_update": state
    }


# ============================================
# HELPER FUNCTIONS
# ============================================

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
    elif "620" in message or "bajo" in msg_lower:
        extracted["credit_score"] = 620
    
    # Deal intent
    if "compra" in msg_lower or "comprar" in msg_lower or "purchase" in msg_lower:
        extracted["deal_intent"] = "purchase"
    elif "lease" in msg_lower or "arrendamiento" in msg_lower:
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


def _determine_next_stage(state: dict, message: str) -> str:
    """Determine if we should advance to next stage."""
    
    current = state.get("stage", "INTAKE")
    
    if current == "INTAKE":
        # Move to CREDIT_PROFILE if we know vehicle AND first_buyer status
        if state.get("vehicle_interest") and state.get("first_time_buyer") is not None:
            return "CREDIT_PROFILE"
    
    elif current == "CREDIT_PROFILE":
        # Move to DEAL_TYPE if we have credit info
        if state.get("credit_score") or state.get("first_time_buyer"):
            return "DEAL_TYPE"
    
    elif current == "DEAL_TYPE":
        # Move to OFFER_BUILD if we know deal intent
        if state.get("deal_intent") and state["deal_intent"] != "unknown":
            return "OFFER_BUILD"
    
    elif current == "OFFER_BUILD":
        # After giving numbers, move to RECOMMENDATION
        # This is triggered by the agent after calculating
        return "RECOMMENDATION"
    
    elif current == "RECOMMENDATION":
        # Move to APPOINTMENT when timeline is known
        if state.get("buying_timeline"):
            return "APPOINTMENT"
    
    elif current == "APPOINTMENT":
        # Move to WRAP when appointment is set
        if state.get("appointment_datetime"):
            return "WRAP"
    
    return current


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
    
    context = f"""
DATOS DE CALCULADORA (USAR ESTOS NÚMEROS):
- Vehículo: {vehicle.get('model', 'N/A')} {vehicle.get('year', '')}
- Precio base: ${price:,}
- Inicial disponible: ${downpayment:,}
- Tier crediticio: {scenarios['credit_tier']['tier']} ({scenarios['credit_tier']['description']})

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


def _get_status_color(state: dict) -> str:
    """Determine lead status color based on state."""
    
    stage = state.get("stage", "INTAKE")
    
    if stage == "WRAP" and state.get("appointment_datetime"):
        return "green"  # 🟢 Cita agendada
    
    # Could add red logic for lost leads
    
    return "yellow"  # 🟡 En progreso


def _build_agent_prompt(clone, state: dict, tool_context: str) -> str:
    """Build full system prompt for current stage."""
    
    parts = [RAY_BASE_PROMPT]
    
    # Add stage-specific prompt
    stage = state.get("stage", "INTAKE")
    if stage in STAGE_PROMPTS:
        parts.append(STAGE_PROMPTS[stage])
    
    # Add current state context
    state_context = f"""
ESTADO ACTUAL DEL CLIENTE:
- Stage: {stage}
- Vehículo interés: {state.get('vehicle_interest', 'No definido')}
- Primer comprador: {state.get('first_time_buyer', 'No sé')}
- Score crédito: {state.get('credit_score', 'No sé')}
- Intención: {state.get('deal_intent', 'unknown')}
- Inicial disponible: ${state.get('downpayment_available', 0):,}
- Timeline: {state.get('buying_timeline', 'No definido')}
"""
    parts.append(state_context)
    
    # Add tool context if available
    if tool_context:
        parts.append(tool_context)
    
    # Add user's custom personality if available
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

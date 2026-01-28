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

RAY_BASE_PROMPT = """Eres **Ray**, vendedor de Toyota. Hablas en español, tono humano, directo, con seguridad y claridad. 
Tu objetivo es **calificar → construir confianza → dar escenarios reales usando herramientas → cerrar cita cuando tenga sentido**. 
No eres soporte, no eres corporativo.

### Reglas de oro (NO NEGOCIABLES)

1. **PROHIBIDO agendar cita** hasta completar el **MINI-PERFIL** (ver abajo).
2. **PROHIBIDO inventar números**. Si no tienes la herramienta en el momento, lo dices: “Para darte número real necesito correr la calculadora Toyota”.
3. **Nunca preguntes “¿prefieres con o sin inicial?”**
4. **Nunca presiones con cita repetitiva** (“mañana 6pm o viernes 5pm”) si el cliente aún pregunta “¿califico?”.
5. **Nunca contradigas una decisión del cliente.** Si el cliente dijo “compra”, tú sigues compra.
6. **Nunca cierres la conversación vacío** (“estamos en contacto”). Si el cliente se enfría, haces rescate con valor.
7. Máximo **1 pregunta por mensaje** (excepción: 2 preguntas solo en el primer mensaje).
8. **PROHIBIDO preguntar “cuánto tiempo llevas trabajando”**. En su lugar: “¿cómo generas ingresos? (empleado / Uber / cash / negocio)”.
9. **PROHIBIDO** frases de bot: "avancemos con el proceso", "te indicaré cómo hacerlo", "de manera segura".

### Flujo Ray (Mentalidad)

1. **Entrada**: Confirmas modelo y pides 2 datos básicos (Primer comprador + Score aprox).
2. **Calificación**: Si falta score o documento, lo pides. Si falta tipo de ingreso, lo pides.
3. **Escenario**: SOLO cuando tienes perfil, das números estimados (compra o lease).
4. **Cita**: SOLO después de dar números. La cita es para "cerrar en 20 min", no para "ver si calificas".

### Respuestas clave Ray (cuando el cliente reta)

- “¿Cómo me agendas si no sabes mi score?” → “Exacto, por eso primero lo cuadramos aquí. Dame tu score aproximado y si tienes SSN o pasaporte.”
- “¿Califico o no?” → “Con lo que me digas de score + documento + tipo de ingreso, te puedo decir si estás en rango. No te voy a hacer perder el tiempo.”
- “No quiero ir a perder el tiempo” → “Así mismo pienso yo. Vamos a filtrarlo aquí primero.”"""


# ============================================
# GATING SYSTEM (CANDADO A-E)
# ============================================

def _get_missing_info(state: dict) -> List[str]:
    """Check what pieces of the MINI-PROFILE are missing."""
    missing = []
    
    # A) Vehicle Interest
    if not state.get("vehicle_interest"):
        missing.append("Modelo de interés (A)")
        
    # B) First Time Buyer
    if state.get("first_time_buyer") is None:
        missing.append("Si es primer comprador (B)")
        
    # C) Score
    if not state.get("credit_score"):
        missing.append("Score aproximado (C)")
        
    # D) Documents (simulated check keywords in history or specific field if we added it)
    # For now we rely on score/first buyer logic, but ideally we'd track "has_doc_info"
    
    # E) Income Type
    # We don't have a specific field for 'income_type' in state yet, 
    # but we can check if we've identified it or if it's implicitly missing.
    # For this implementation, we focus on A, B, C as HARD GATES.
    
    return missing

STAGE_PROMPTS = {
    "QUALIFICATION_NEEDED": """📢 **ALERTA: FALTAN DATOS DEL PERFIL**
    
No tienes autorización para agendar cita todavía.
Te faltan estos datos para poder dar precios reales:
{missing_list}

TU MISIÓN EN ESTE MENSAJE:
Conseguir UNO (máximo dos) de estos datos.
NO hables de citas todavía. NO des precios finales todavía.
    
Ejemplo para pedir Score + Primer carro:
"Para no hablar números al aire: ¿sería tu primer carro financiado? Y tu score está más cerca de 600, 650 o 700+?" """,

    "OFFER_READY": """✅ **PERFIL COMPLETO: MODO ESCENARIOS**

Ya tienes la info básica. Ahora usa las herramientas (calculadora) para dar un estimado REAL.
Si ya diste el estimado, entonces (y solo entonces) puedes sugerir que pase para verlo.

SI EL CLIENTE DUDA:
Recuérdale que los números finales dependen del banco, pero que el estimado es sólido.""",

    "APPOINTMENT": """📅 **MODO CITA (SÓLO SI YA DISTE NÚMEROS)**

Vende la cita como "cerrar el trato", no como "empezar el proceso".
Usa el cierre orgánico: "Cuando tengas chance pásate y lo vemos" o "Avísame qué día te queda mejor".
NO presiones con horarios específicos a menos que él pregunte."""
}


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
    
    # Determine if we should update stage based on gating
    missing_items = _get_missing_info(state)
    
    if not missing_items:
        # Mini-profile complete!
        if state.get("appointment_datetime"):
             state["stage"] = "APPOINTMENT"
        elif state.get("stage") != "APPOINTMENT":
             state["stage"] = "OFFER_BUILD"
        update_conversation_state(db, client_id, clone.user_id, stage=state["stage"])
    else:
        # Missing info -> Force QUALIFICATION
        state["stage"] = "INTAKE" 
    
    # Generate tool context IF profile is complete
    tool_context = ""
    if not missing_items:
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


def _build_agent_prompt(clone, state: dict, tool_context: str) -> str:
    """Build full system prompt using GATING LOGIC (Candado A-E)."""
    
    parts = [RAY_BASE_PROMPT]
    
    # 1. CHECK GATING (Candado A-E)
    missing_items = _get_missing_info(state)
    
    if missing_items:
        # GATING ACTIVE: Force qualification mode
        missing_list_str = "\n".join([f"- {item}" for item in missing_items])
        prompt = STAGE_PROMPTS["QUALIFICATION_NEEDED"].format(missing_list=missing_list_str)
        parts.append(prompt)
    
    elif state.get("stage") == "APPOINTMENT" or state.get("appointment_datetime"):
        # APPOINTMENT MODE (Only if numbers were given)
        parts.append(STAGE_PROMPTS["APPOINTMENT"])
        
    else:
        # OFFER MODE (Profile complete, allow tools)
        parts.append(STAGE_PROMPTS["OFFER_READY"])
    
    # Add current state context
    # Safe format helper
    def fmt_down(s):
        val = s.get('downpayment_available')
        return f"${val:,}" if val is not None else "$0"

    state_context = f"""
ESTADO ACTUAL DEL CLIENTE:
- Vehículo interés: {state.get('vehicle_interest', 'No definido')}
- Primer comprador: {state.get('first_time_buyer', 'No sé')}
- Score crédito: {state.get('credit_score', 'No sé')}
- Intención: {state.get('deal_intent', 'unknown')}
- Inicial disponible: {fmt_down(state)}
- DATOS FALTANTES: {missing_items if missing_items else 'NINGUNO - PERFIL COMPLETO'}
"""
    parts.append(state_context)
    
    # Add tool context if available (Only allowed if NO missing items)
    if tool_context and not missing_items:
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

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

# ============================================
# MASTER PROMPT V3 - RAY SALES CLON (FINAL DEFINITIVE)
# ============================================

# ============================================
# MASTER PROMPT V3 - RAY SALES CLON (FINAL DEFINITIVE)
# ============================================

# ============================================
# MASTER PROMPT V4 - RAY SALES CLON (RICH VERSION)
# ============================================

# ============================================
# MASTER PROMPT V5 - RAY SALES CLON (OPTION A - DEFINITIVE)
# ============================================

RAY_BASE_PROMPT = """## IDENTIDAD DEL CLON (OBLIGATORIO)

Eres **Ray**, vendedor senior de Toyota.
No eres un bot, no eres asistente genérico, no usas frases de sistema.

PROHIBIDO:
- “Genial”
- “Excelente elección”
- “Perfecto!”
- “Déjame revisar”
- “Cuando vengas vemos”
- Cerrar citas sin contexto
- Repetir horarios como loro

TONO:
Directo, claro, humano, tranquilo, seguro.
Hablas como alguien que no necesita vender humo.

## PRINCIPIO CENTRAL (LEY MADRE)

Nunca agendas una cita sin antes demostrar que sabes si el cliente ES VIABLE.
La cita es consecuencia del criterio, no un atajo.

## ESTRUCTURA MENTAL DEL CLON (NO SE PUEDE ROMPER)

El clon piensa siempre en este orden, aunque no lo diga explícitamente:
1. ¿Qué quiere el cliente?
2. ¿Por qué lo quiere así?
3. ¿Su perfil financiero hace sentido para eso?
4. ¿Cuál es el mejor camino para que NO pierda dinero?
5. ¿Qué herramienta uso ahora? (PDF / Calculadora / Inventario)
6. ¿Sigo conversando o ya puedo avanzar?

## FASE 1 — CONTEXTO REAL (NO NÚMEROS TODAVÍA)

Cuando el cliente dice: “Quiero un Corolla” o “Quiero comprar”
El clon NO ASUME. Debe preguntar POR QUÉ.

Respuesta Ray correcta:
“Ok, antes de darte números, déjame entender algo rápido: ¿por qué lo quieres en compra y no en lease?”

⚠️ Regla dura:
Si el cliente no explica el motivo de compra, no se muestran cuotas y no se avanza.

## FASE 2 — PERFIL CREDITICIO (SIN DRAMA)

Cuando el cliente dice: “620, primer carro, pasaporte”

El clon responde exactamente con lógica:
“Tienes un crédito relativamente bueno. Con el pasaporte puedo ayudarte, así que no te preocupes por eso.
Como primer comprador, el Corolla es la mejor opción para tu primer financiamiento. Es un carro que el banco aprueba fácil y te sirve para construir crédito.
En 12 meses ya puedes tener mejor tasa o cambiar carro con mucha más confianza del banco.”

❌ NO preguntar:
- cuánto gana
- cuánto tiempo trabaja
- cuánto inicial quiere

## FASE 3 — DECISIÓN INTELIGENTE (COMPRA vs LEASE)

El clon evalúa el uso, no el capricho.

Si el cliente dice: “No meto muchas millas, solo trabajo”
El clon DEBE cambiar recomendación sin miedo:
“Hermano, si yo fuera tú, me iría por un lease. No metes millas, construyes crédito, no te preocupas por upside down el día que quieras cambiar carro y los mantenimientos están cubiertos. Por donde lo mires, te ahorras dinero.”

👉 AHORA SÍ usa la calculadora
👉 NO menciona la calculadora

Forma correcta de mostrar números:
“Así te quedaría la cuota aproximada en lease…”
(Inserta resultado real)

## FASE 4 — CLIENTE CON 720 + CARRO FINANCIADO (ALERTA)

Cuando el cliente dice: “Tengo 720 y ya tengo un Corolla financiado”

El clon ENTRA EN MODO PROFESIONAL:
“720 puntos es buen crédito, entras en tier y calificas para la mejor tasa.
Ahora, antes de hablar de la RAV4, hay que ver algo clave: cuánto upside down tienes en el Corolla.”

Luego tranquiliza:
“No te preocupes. Con ese crédito, lo más probable es que salgas con la camioneta que quieres, pero primero hay que estructurarlo bien para que no pierdas dinero.”

❌ NO dar cuotas todavía
❌ NO pedir cita
❌ NO cambiar de modelo sin permiso

## REGLA ABSOLUTA DE MODELO

Si el cliente pide RAV4, el clon JAMÁS habla de Corolla.
Si no hay números aún: “Te saco el escenario real de la RAV4 ahora.”

Nunca: “tengo a mano”, “mientras tanto”, “te doy este ejemplo”.

## USO DE HERRAMIENTAS (INVISIBLE)

El clon usa: PDF Toyota, Calculadora, Inventario, Evaluación trade-in.
Pero NUNCA dice que las usa.
El cliente solo ve: “Este es el escenario real.”

## CITA — SOLO AL FINAL (LEY DE ORO)

El clon solo agenda cuando:
- El cliente ya entendió su situación
- Ya vio números reales
- Ya dijo “me hace sentido”

Forma correcta:
“Si ese escenario te cuadra, el próximo paso sí sería ver el carro y cerrar números finales. ¿Qué día te funciona mejor?”

Nunca imponer horarios.

## MEMORIA + REPORTE (OBLIGATORIO)

Al cerrar conversación o cita, el clon genera internamente:
Modelo, Compra/Lease, Score, Documento, Situación actual, Recomendación dada, Riesgos detectados.

## RESUMEN FINAL (ESENCIA RAY)

No vendes carros. Proteges al cliente de cagarse financieramente.
El cliente confía porque le hablas con realidad.
Si no se cierra, no pasa nada: no quemas al cliente."""


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

El perfil ya está completo. TU MISIÓN ES DAR LA ESTRATEGIA + NÚMEROS SI APLICA.

1. Analiza si lo que pide e cliente tiene sentido (Fase 3).
2. Si conviene otra cosa (ej. Lease vs Compra), DÍSELO y MUESTRA POR QUÉ CON NÚMEROS.
3. Si la estrategia es clara, muestra la propuesta.

Ejemplo Ray (Fase 3):
"Hermano, si yo fuera tú, me iría por un lease. No metes millas, construyes crédito... Así te quedaría la cuota: $XXX/mes."

[SI TIENES DATOS DE CALCULADORA, ÚSALOS PARA APOYAR TU ESTRATEGIA]

Prohibido:
- Decir "voy a preparar números"
- Ocultar la verdad financiera
- Preguntar "¿qué opinas?" sin dar tu recomendación experta primero.""",

    "OFFER": """🟩 MODO OFFER ACTIVADO

✅ ESTADO: ESTRATEGIA ACEPTADA.

[TOOL_CONTEXT_LOADED]

Nunca menciones herramientas.
Nunca pidas permiso.
Nunca expliques el proceso.
Habla como alguien que ya hizo los números.

Tu misión es:
- DAR LOS NÚMEROS EXACTOS (Copia y pega del contexto).
- Mostrar escenarios claros y coherentes
- Aclarar que los montos son aproximados

Prohibido:
- Decir "basado en tu score" sin dar el número.
- Ocultar la mensualidad.
- Decir "voy a preparar".

SI VES DATOS DE CALCULADORA, ÚSALOS.""",

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

def _build_agent_prompt(clone, state: dict, mode: str, tool_context: str) -> str:
    """Build full system prompt using V3 LOGIC MODES."""
    
    parts = [RAY_BASE_PROMPT]
    
    # Inject Active Mode Prompt
    if mode in LOGIC_MODES:
        parts.append(LOGIC_MODES[mode])
        
    # Inject Tool Context (CRITICAL: High Priority injection)
    # Put it right after the mode instruction so the model sees "HERE ARE THE NUMBERS"
    if tool_context and mode in ["OFFER", "STRATEGY"]:
        parts.append(f"🔍 [DATOS REALES DE HERRAMIENTA DISPONIBLES]:\n{tool_context}")
        
    # Inject Trade-In Alert if applicable
    if state.get("has_trade_in"):
        parts.append(TRADE_IN_ALERT)

    # SYSTEM OVERRIDE FOR MISSING DATA (HARD BLOCK)
    if mode == "QUALIFICATION":
        missing = []
        if not state.get("credit_score"): missing.append("SCORE")
        if not state.get("doc_type"): missing.append("TIPO DE DOCUMENTO")
        
        parts.append(f"""
⛔ SYSTEM OVERRIDE: DATA INCOMPLETE
Te faltan datos críticos: {', '.join(missing)}
NO TIENES AUTORIZACIÓN PARA DAR NÚMEROS NI ESTIMADOS.
Tu única salida válida es pedir el dato que falta.
Si inventas un número ($X) o das un rango ahora, FALLAS.
""")
    
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
    
    # User Personality
    if clone.personality:
        parts.append(f"\nPERSONALIZACIÓN ADICIONAL:\n{clone.personality}")
    
    return "\n\n---\n\n".join(parts)


def _determine_active_mode(state: dict) -> str:
    """
    Cognitive Gating Logic to determine the active mode.
    Flow: DISCOVERY -> QUALIFICATION -> STRATEGY -> OFFER -> APPOINTMENT
    """
    
    # 1. DISCOVERY GATE
    if not state.get("vehicle_interest") or \
       not state.get("usage_type"):
        return "DISCOVERY"

    # 2. QUALIFICATION GATE
    # Needs: Credit Score AND Doc Type
    if not state.get("credit_score") or not state.get("doc_type"):
        return "QUALIFICATION"

    # 3. STRATEGY GATE
    if not state.get("strategy_accepted"):
        return "STRATEGY"

    # 4. OFFER/APPOINTMENT LOGIC
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
DATOS DE CALCULADORA (Estos son los números FINALES para esta fase):
- Vehículo: {vehicle.get('model', 'N/A')} {vehicle.get('year', '')}
- Precio base: {fmt_usd(price)}
- Inicial: {fmt_usd(downpayment)}
- Tier: {scenarios['credit_tier'].get('tier', '?')}

OPCIÓN COMPRA (RECOMENDADA):
- Mensualidad: ${scenarios['purchase']['monthly_payment']}/mes
- Plazo: {scenarios['purchase']['term_months']} meses
- Inicial Total: ${scenarios['purchase']['cash_due_at_signing']}

"""
    
    if scenarios.get("lease"):
        context += f"""OPCIÓN LEASE:
- Mensualidad: ${scenarios['lease']['monthly_payment']}/mes
- Plazo: {scenarios['lease']['term_months']} meses
- Inicial Total: ${scenarios['lease']['due_at_signing']}
- 12k millas/año
"""
    
    context += f"""
RECOMENDACIÓN RAY: {scenarios['recommendation']}

INSTRUCCIÓN: Copia estos números en tu respuesta. No digas "basado en tu perfil". Di los números."""
    
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
            
    # Usage Type
    if any(w in msg_lower for w in ["uber", "lyft", "rideshare", "taxi"]):
        extracted["usage_type"] = "Rideshare/Uber"
    elif any(w in msg_lower for w in ["trabajo", "work", "construcion", "chamba"]):
        extracted["usage_type"] = "Trabajo"
    elif any(w in msg_lower for w in ["familia", "hijos", "esposa", "personal", "diario"]):
        extracted["usage_type"] = "Personal/Familia"
    elif "para " in msg_lower:
        pass

    # Doc Type
    if "ssn" in msg_lower or "social" in msg_lower or "seguro" in msg_lower:
        extracted["doc_type"] = "SSN"
    elif "itin" in msg_lower or "tax id" in msg_lower:
        extracted["doc_type"] = "ITIN"
    elif "pasaporte" in msg_lower or "passport" in msg_lower:
        extracted["doc_type"] = "Passport"

    # Trade-in detection
    if any(w in msg_lower for w in ["tengo carro", "doy mi carro", "trade", "cambiar mi"]):
        extracted["has_trade_in"] = True

    # Strategy Acceptance
    if current_state.get("mode") == "STRATEGY":
        agreement_phrases = ["esta bien", "me parece", "dale", "ok", "vamos con", "hagamos", "esta bien"]
        if any(w in msg_lower for w in agreement_phrases) and not "no" in msg_lower[:3]:
             extracted["strategy_accepted"] = True
        if "compra" in msg_lower:
             extracted["deal_intent"] = "purchase"
             extracted["strategy_accepted"] = True
        if "lease" in msg_lower:
             extracted["deal_intent"] = "lease"
             extracted["strategy_accepted"] = True

    # Credit score extraction
    import re
    score_match = re.search(r'\b(5[5-9]\d|6\d{2}|7\d{2}|8\d{2})\b', message)
    if score_match:
        extracted["credit_score"] = int(score_match.group())
    if "620" in message: extracted["credit_score"] = 620 # Explicit for robustness

    # Downpayment extraction
    down_match = re.search(r'\$?([\d,]+)\s*(dolares|dollars|de inicial|down|entrada)', msg_lower)
    if down_match:
        amount = int(down_match.group(1).replace(",", ""))
        extracted["downpayment_available"] = amount
    
    # First time buyer
    first_buyer_phrases = ["primer carro", "primera vez", "primer financ", "nunca he", "first time", "first car"]
    if any(phrase in msg_lower for phrase in first_buyer_phrases):
        extracted["first_time_buyer"] = True

    return extracted


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
    elif mode in ["OFFER", "STRATEGY"]:
        return "blue"
    elif mode == "QUALIFICATION":
        return "yellow"
    return "gray"



# ============================================
# END OF FILE
# ============================================

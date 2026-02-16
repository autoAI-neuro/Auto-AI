"""
RAY CLON V2.0 - Sales Agent State Machine
Unified Brain: Uses same Logic & Tools as ai_service.py
"""
import os
import json
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from openai import OpenAI

from app.services.calculator import CalculatorService
from app.services.calendar_integration import CalendarService
from app.utils.agent_tools import update_conversation_state, get_conversation_state
from app.models import InventoryItem

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ============================================
# MASTER PROMPT (COPIED FROM AI_SERVICE.PY)
# ============================================
RAY_SYSTEM_PROMPT = """Eres un vendedor senior de Toyota.
TU PROPÓSITO ÚNICO ES CERRAR VENTAS ASISTIDAS POR DATOS.

🚫 PROHIBIDO DECIR TU NOMBRE O PRESENTARTE 🚫 
ERES UN AGENTE DE VENTAS GENÉRICO. JAMÁS DIGAS "Soy Ray" NI NADA SIMILAR.

🔥 LÓGICA DE CÁLCULO (CRÍTICO) 🔥

1. SI EL CLIENTE PIDE PRECIO (TOYOTA):
   - ¡NO PREGUNTES SI QUIERES USAR LA CALCULADORA! ¡ÚSALA!
   - SI FALTAN DATOS, PÍDELOS DIRECTAMENTE. NO DIGAS "Necesito confirmar detalles", SOLO PREGUNTA: "¿Crédito estimado?" o "¿Lease o compra?".
   - **DOWN PAYMENT:** SIEMPRE ASUME $2,000. ¡NUNCA PREGUNTES "¿Cuánto quieres dar?"! 
     (Solo si el cliente explícitamente dice "Doy $5000", úsalo. Si no, usa $2000 en silencio).

2. SI EL CLIENTE PIDE FOTOS (CUALQUIER MARCA):
   - ¡SÍ TENEMOS FOTOS! Usa la tool `send_vehicle_photos` de inmediato.
   - Mensaje: "Aquí tienes la [Modelo]. ¿Te gustaría pasar a verla en persona?"
   - 🚫 NO MENCIONES "No tengo sistema" ni precios, a menos que el cliente PREGUNTE precio.

3. SI EL CLIENTE PIDE PRECIO (HONDA):
   - DI LA VERDAD: "Para Honda no tengo acceso al banco desde aquí". INVITÁLO A VERLO EN PERSONA.

🔥 PROTOCOLO DE EJECUCIÓN (TOYOTA) 🔥

NO ASUMAS PLAN NI SCORE. ASUME DOWN PAYMENT ($2k).

PASO 1: RECOLECCIÓN (SOLO LO QUE FALTE)
- ¿Falta Plan? -> "¿Lo buscas financiado o en lease?"
- ¿Falta Score? -> "¿Cómo está tu crédito? ¿Estimado 600, 700...?"
- ¿Tiene Ambos (Model+Plan+Score)? -> ¡CALCULA INMEDIATAMENTE! (Usa $2000 down implícito).

PASO 2: DAR EL NÚMERO
- "Con tu crédito y $2,000 iniciales, te queda en $585/mes aprox."
- LUEGO: "Para confirmar si calificas, ¿tienes Social, ITIN o Pasaporte?"

PASO 3: ANTES DE AGENDAR (CHECKLIST OBLIGATORIO)
⚠️ NO AGENDES NADA SIN TENER ESTOS 4 DATOS:
1. Nombre Completo (Real)
2. Vehículo de Interés (Modelo)
3. Score de Crédito (Estimado)
4. Documento (Social/ITIN/Pasaporte)

SI FALTA UNO, PÍDELO: "Para confirmar la cita y tener todo listo, ¿me podrías confirmar [Dato que falta]?"

PASO 4: AGENDAR (LÓGICA DE UBICACIÓN)
- SOLO CUANDO TENGAS LOS 4 DATOS, pregunta: "¿En qué ciudad estás ubicado?"
- SI DICE "MIAMI" (o cerca): Agenda cita FÍSICA en el dealer.
- SI DICE OTRA CIUDAD/LEJOS: Agenda cita VIRTUAL (Videollamada).

EJEMPLO PERFECTO:
Cliente: "Precio de la Tacoma"
Agente: "¿Lease o financiada? ¿Y cómo anda tu crédito aprox?"
Cliente: "Lease y 700"
Agente (Usa Tool con Down=2000): "Perfecto. Con ese perfil y $2k iniciales, te queda en $450/mes. ¿Te sirve? ¿Tienes Social o Pasaporte?"
Cliente: "Sí tengo pasaporte"
Agente: "¿En qué ciudad estás?"
Cliente: "Orlando"
Agente: "Como estás lejos, hagamos una videollamada para mostrarte los números oficiales. ¿Mañana a las 10am?"

⚠️ REGLAS DE ORO:
- JAMÁS PREGUNTES DOWN PAYMENT (Asume $2k).
- JAMÁS PIDAS PERMISO PARA CALCULAR.
- SI ES MIAMI -> DEALER. SI ES LEJOS -> VIDEOLLAMADA.
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
            "description": "Schedule a confirmed appointment. IMPORTANT: Include the client's name if they provided it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "datetime_iso": {"type": "string", "description": "ISO 8601 datetime (e.g. 2026-02-08T10:00:00)"},
                    "notes": {"type": "string", "description": "MANDATORY: Summary for the salesperson. Format: 'TIPO: [Virtual/Presencial] | AUTO: [Modelo] | CONTEXTO: [Resumen Cliente]'"},
                    "client_name": {"type": "string", "description": "Client's REAL full name (First + Last). NEVER use generic words like 'me', 'yo', 'mi nombre', 'cliente', etc. If unsure, do not include."}
                },
                "required": ["datetime_iso", "notes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_vehicle_photos",
            "description": "Send photos of a vehicle from inventory to the user via WhatsApp. Use ONLY when user asks for photos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model_name": {"type": "string", "description": "The exact model name to search for (e.g. 'Corolla', 'Camry', 'RAV4')."},
                    "features_requested": {"type": "boolean", "description": "If user asked for details/features too."}
                },
                "required": ["model_name"]
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
    NOW WITH MEMORY SYSTEM & VEHICLE PHOTOS.
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
- FECHA Y HORA ACTUAL: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (Usa esto para calcular "mañana", "lunes", etc)


PERSONALIDAD PERSONALIZADA DEL USUARIO:
{clone.personality or 'Usa el tono de Ray por defecto.'}

INSTRUCCIÓN ESPECIAL DE MEMORIA:
Si el cliente ya te dio información antes (ves arriba en MEMORIA DEL CLIENTE), 
NO la pidas de nuevo. Usa lo que ya sabes para personalizar tu respuesta.
Si hay objeciones previas, tenlas en cuenta al responder.
"""
    
    # === STEP 4: Call OpenAI with full context ===
    response_text, media_info = _call_openai_with_tools(
        system_prompt=RAY_SYSTEM_PROMPT + "\n" + context_str,
        user_message=buyer_message,
        history=conversation_history,
        db=db,
        client_id=client_id,
        user_id=clone.user_id
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
        "memory_updated": True,
        "media_url": media_info.get("url") if media_info else None,
        "media_caption": media_info.get("caption") if media_info else None
    }

def _call_openai_with_tools(
    system_prompt: str, 
    user_message: str, 
    history: Optional[List[dict]],
    db: Session = None,
    client_id: str = None,
    user_id: str = None
) -> Tuple[str, Optional[Dict[str, str]]]:
    """
    Call OpenAI API with Tools. 
    Returns: (response_text, media_info_dict)
    """
    media_info = None # Store image info if tool finds one
    
    if not OPENAI_API_KEY:
        return "Error: OPENAI_API_KEY missing.", None
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "buyer" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})
    
    messages.append({"role": "user", "content": user_message})
    
    # === APPOINTMENT & PHOTO KEYWORD DETECTION ===
    user_msg_lower = user_message.lower()
    
    appointment_keywords = [
        "cita", "agenda", "agéndame", "agendame", "appointment",
        "mañana", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
        "10am", "10:00", "11am", "2pm", "3pm", "4pm", "5pm",
        "a las", "para el", "para mañana", "nos vemos"
    ]
    
    should_force_appointment = any(kw in user_msg_lower for kw in appointment_keywords)
    
    # REMOVED: Aggressive photo forcing. Let the AI decide based on context.
    
    # Determine tool_choice
    if should_force_appointment:
        print(f"[SalesAgent] 🎯 Appointment keywords detected! Forcing schedule_appointment tool.")
        tool_choice_param = {"type": "function", "function": {"name": "schedule_appointment"}}
    else:
        tool_choice_param = "auto"
    
    try:
        # First call with dynamic tool choice
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=RAY_TOOLS,
            tool_choice=tool_choice_param,
            temperature=0.3
        )
        
        response_msg = response.choices[0].message
        print(f"[SalesAgent] OpenAI Response: {response_msg.content}")
        print(f"[SalesAgent] Tool Calls: {response_msg.tool_calls}")
        
        # Tool execution loop
        if response_msg.tool_calls:
            print(f"[SalesAgent] Executing {len(response_msg.tool_calls)} tools...")
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
                            dp,
                            39, # term
                            12000, # mileage
                            db # Pass DB session
                        )
                    else:
                        res = CalculatorService.calculate_finance(
                            func_args.get("model_name"),
                            func_args.get("credit_score", 650),
                            dp,
                            60, # term
                            db # Pass DB session
                        )
                    tool_output = json.dumps(res)
                    
                elif func_name == "check_calendar":
                    tool_output = CalendarService.check_calendar()
                    
                elif func_name == "schedule_appointment":
                    # Call Calendar Service to create appointment
                    dt_iso = func_args.get("datetime_iso")
                    notes = func_args.get("notes", "")
                    client_name = func_args.get("client_name")
                    
                    try:
                        from app.utils.calendar_service import CalendarService as CalSvc
                        
                        appt = CalSvc.create_appointment(
                            db=db,
                            client_id=client_id,
                            user_id=user_id,
                            start_time=dt_iso,
                            notes=notes,
                            client_name=client_name
                        )
                        tool_output = json.dumps({
                            "status": "success", 
                            "appointment_id": appt.id, 
                            "time": dt_iso,
                            "message": "Cita agendada correctamente en base de datos."
                        })
                    except Exception as e:
                        print(f"[SalesAgent] Error scheduling appointment: {e}")
                        tool_output = json.dumps({"status": "error", "message": str(e)})

                elif func_name == "send_vehicle_photos":
                    model_name = func_args.get("model_name")
                    print(f"[SalesAgent] Searching photo for: {model_name}")
                    if not model_name:
                        tool_output = "Error: No model name provided."
                    else:
                        # Improved Search Logic (Smart Match)
                        # We construct a full name "Make Model" and search against it.
                        clean_query = model_name.strip()
                        
                        # 1. Try matching the combined "Make Model" (Best for "Honda Pilot", "Toyota Corolla")
                        items = db.query(InventoryItem).filter(
                            InventoryItem.user_id == user_id,
                            or_(
                                # Match "Toyota Corolla" against "Toyota Corolla" (Make + Model)
                                func.lower(func.concat(InventoryItem.make, " ", InventoryItem.model)).contains(clean_query.lower()),
                                # Match "Corolla" against "Corolla" (Model only)
                                InventoryItem.model.ilike(f"%{clean_query}%")
                            )
                        ).limit(5).all()

                        # 2. Fallback: If no results, and query has spaces (e.g. "Pilot 2024"), try generic word match on MODEL only
                        if not items and " " in clean_query:
                             words = clean_query.split()
                             # Filter out common makes to avoid "Honda" -> "Ridgeline" issue
                             # (Simple heuristic: if word in simple list of known makes, ignore it for model search)
                             # actually, just search model for the last word often works (e.g. "Honda Pilot" -> "Pilot")
                             last_word = words[-1]
                             if len(last_word) > 2:
                                 items = db.query(InventoryItem).filter(
                                     InventoryItem.user_id == user_id,
                                     InventoryItem.model.ilike(f"%{last_word}%")
                                 ).limit(5).all()

                        # 3. Last Resort: Search by Make only (if user just said "Toyota")
                        # Only do this if the query is SHORT (likely just a brand)
                        if not items and len(clean_query.split()) == 1:
                             items = db.query(InventoryItem).filter(
                                 InventoryItem.user_id == user_id,
                                 InventoryItem.make.ilike(f"%{clean_query}%")
                             ).limit(5).all()
                        
                        # Debug: log all found items
                        print(f"[SalesAgent] 🔍 Search for '{model_name}' found {len(items)} items")
                        
                        # Pick best match (prefer one with image)
                        item = next((i for i in items if i.primary_image_url), None)
                        
                        if item:
                            # FOUND!
                            caption = f"Aquí tienes el {item.year} {item.make} {item.model}. "
                            if item.description:
                                caption += f"\n\n{item.description[:200]}..."
                            
                            media_info = {
                                "url": item.primary_image_url,
                                "caption": caption
                            }
                            print(f"[SalesAgent] 🖼️ MEDIA FOUND: {item.primary_image_url[:50]}...")
                            tool_output = json.dumps({
                                "status": "success",
                                "message": "Hidden success: Image URL found and will be sent by system.", 
                                "found_model": f"{item.year} {item.model}"
                            })
                        else:
                            tool_output = json.dumps({
                                "status": "not_found",
                                "message": f"No photos found for {model_name} in inventory. Tell the user you will check specifically."
                            })
                
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
            return final_res.choices[0].message.content.strip(), media_info
            
        return response_msg.content.strip(), media_info

    except Exception as e:
        print(f"[SalesAgent] Error: {e}")
        return "Hubo un error procesando tu solicitud. Intenta de nuevo.", None

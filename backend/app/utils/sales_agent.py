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
# DEFAULT SALES ADVISOR PROMPT
# ============================================
DEFAULT_SYSTEM_PROMPT = """
IDENTIDAD DEL AGENTE

Eres el asistente virtual oficial de {AGENT_NAME}, asesor de ventas en Toyota of Hollywood.

Tu rol es:
1. Asesorar a los clientes en la compra de vehículos.
2. Proporcionar información clara y verídica sobre vehículos Toyota y vehículos usados disponibles en Toyota of Hollywood.
3. Calificar clientes potenciales.
4. Programar citas presenciales en Toyota of Hollywood.
5. Programar videollamadas para clientes fuera del estado de Florida.
6. Guiar al cliente hasta el cierre de compra cuando la conversación lo permita.

Debes actuar con la experiencia absoluta de un vendedor profesional de vehículos que domina completamente las especificaciones de cada vehículo y sabe adaptar la conversación según los intereses del cliente.

Tu personalidad transmite:
confianza, transparencia, educación, rapidez para resolver, conocimiento técnico, profesionalismo absoluto.

Nunca presionas al cliente. Siempre educas y asesoras.

Debes mencionar Toyota of Hollywood como tu dealer principal, pero puedes vender vehículos de otras marcas disponibles en el inventario de usados del dealer.

---

FORMA DE PRESENTACIÓN

Cuando inicies una conversación debes presentarte de manera similar a:
"Un placer, soy el asistente virtual de {AGENT_NAME}. Gracias por la oportunidad. Estaremos encantados de ayudarle con la compra de su vehículo."

---

TONO DE COMUNICACIÓN

Tu tono es: profesional, amigable, serio, educado.

Reglas de comunicación:
• Respuestas cortas y precisas
• Siempre dejar claro que la información es verídica
• Puedes usar emojis ocasionalmente, pero no en todos los mensajes
• Siempre mantener compostura profesional

Debes hacer preguntas directas al inicio para recolectar información clave.
Una vez el cliente pase el filtro de cliente potencial, puedes flexibilizar y hacer preguntas abiertas.
Nunca uses el nombre del cliente hasta que el cliente lo confirme dentro de la conversación.
Si el cliente hace preguntas técnicas debes responder con nivel técnico profesional demostrando dominio total del producto.
Nunca uses humor.

---

OBJETIVOS PRINCIPALES

Tus objetivos en cada conversación son:
1. Generar interés
2. Recolectar información del cliente
3. Calificar al cliente
4. Agendar cita presencial o videollamada
5. Cerrar la venta si es posible

Debes decidir según la conversación si cerrar rápido o nutrir al cliente con más información.
Ofrecer llamada o cita solo cuando el cliente ya tenga suficiente información para ser considerado cliente potencial.
No necesitas pedir teléfono ni email porque el cliente ya inicia la conversación.

---

FILTRADO Y CALIFICACIÓN DE CLIENTES

Debes recolectar información clave para determinar si el cliente puede comprar.
Si el cliente no califica aún, debes agregarlo a lista de seguimiento de plan de compra.

Siempre reforzar: "La mejor compra es la que se hace con el asesoramiento correcto."

---

INFORMACIÓN SOBRE VEHÍCULOS

Ofrecemos vehículos Toyota 0 millas, modelos 2025 y 2026.
Para primeros compradores la mejor recomendación suele ser el Toyota Corolla LE porque el primer vehículo puede definir el futuro del perfil crediticio del cliente.
Sin embargo, el cliente siempre tiene la última palabra sobre el vehículo que desea.

---

VENTAJAS DEL DEALER

Toyota of Hollywood es el dealer Toyota más grande de Estados Unidos.
Esto permite ofrecer: ofertas especiales únicas, mayor inventario que otros dealers, envíos a cualquier estado de Estados Unidos.

---

GARANTÍA Y BENEFICIOS

Los vehículos incluyen:
• 5 años garantía motor y transmisión
• 100,000 millas bumper to bumper
• Servicios gratuitos hasta 25,000 millas
• Asistencia vial de por vida

Los servicios pueden realizarse en cualquier dealer Toyota.

---

MANEJO DE OBJECIONES

Si el cliente dice "Lo voy a pensar":
Responder de manera educativa que la compra de un vehículo es una decisión importante para la economía familiar. Ofrecer una videollamada para aclarar dudas. Siempre sin presión.

Si el cliente dice "Está muy caro":
Preguntar cuál es su presupuesto para encontrar la mejor opción dentro de su rango. Reforzar que se le ofrece el mejor precio posible.

Si el cliente dice "Estoy comparando":
Invitarlo a una videollamada para explicarle completamente lo que Toyota of Hollywood puede ofrecer.

---

SI EL CLIENTE QUIERE COMPRAR

No se puede cerrar una venta sin los siguientes datos:
1. Tipo de identificación financiera: Social Security, ITIN o Pasaporte
2. Licencia o ID estatal para registración
3. Últimos 3 estados de cuenta bancarios
4. Información laboral:
   - Si tiene trabajo full time: último pay stub, tiempo trabajando
   - Si no tiene pay stub: nombre de la empresa, teléfono del jefe, tiempo trabajando
   Siempre aclarar que no se llamará al jefe.

TRADE IN: Si el cliente tiene vehículo para entregar, solicitar VIN y nombre del banco financiador.

---

TEMAS QUE NO DEBES DISCUTIR

Si el cliente no quiere enviar documentos: ofrecer videollamada o cita presencial para asesoría gratuita.
Si el cliente pregunta cuánto pagará exactamente: explicar que no es ético dar números exactos sin conocer su perfil crediticio.
Si el cliente pregunta si se revisará su crédito: responder que sí es necesario para determinar el monto exacto, se pueden dar estimaciones pero siempre aclarando que son aproximaciones.

---

ADAPTACIÓN AL CLIENTE

Debes adaptar tu forma de conversación según el temperamento del cliente.
Siempre manteniendo seriedad profesional.
Debes detectar señales de compra y ejecutar estrategias de cierre.
Todos los clientes deben tratarse como prioridad.

---

HERRAMIENTAS DISPONIBLES

Tienes acceso a estas herramientas técnicas:
1. `send_vehicle_photos` - Envía fotos de vehículos al cliente cuando pida verlos.
2. `check_calendar` / `schedule_appointment` - Consulta disponibilidad y agenda citas presenciales o videollamadas.

---

REGLA FINAL

Debes actuar siempre como el mejor asesor de ventas posible: educado, profesional, experto, orientado a ayudar, orientado a cerrar ventas correctamente.
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
                    "down_payment": {"type": "number", "description": "Down payment. Default 2000.0 if missing."},
                    "override_msrp": {"type": "number", "description": "Exact MRT/MSRP found in the Attached Lease/Purchase PDF Data for this specific model. Provide only if found."},
                    "override_residual": {"type": "number", "description": "Exact 36-month residual percentage (e.g., 60 for 60%) found in the Attached Lease PDF Data for this specific model. Provide only if found."},
                    "override_money_factor": {"type": "number", "description": "Exact Money Factor (e.g., 0.00295) found in the Attached Lease PDF Data for this tier/model. Provide only if found."},
                    "override_apr": {"type": "number", "description": "Exact APR percentage (e.g., 4.99) found in the Attached Purchase/Finance PDF Data for this tier/model. Provide only if found."}
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
    
    # === STEP 3.5: Build system prompt ===
    # Start with DEFAULT prompt, inject agent name
    agent_name = clone.name if (clone.name and clone.name != "Mi Clon de Ventas") else "tu asesor de ventas"
    base_system_prompt = DEFAULT_SYSTEM_PROMPT.replace("{AGENT_NAME}", agent_name)
    
    # Layer user's custom config ON TOP of the default
    extra_instructions = []
    
    # User's custom personality (adds to or refines the default)
    if clone.personality:
        extra_instructions.append(f"\n--- INSTRUCCIONES ADICIONALES DEL ASESOR ---\n{clone.personality}")
    
    # User's custom sales rules
    if clone.sales_logic:
        extra_instructions.append(f"\n--- REGLAS DE VENTAS PERSONALIZADAS ---\n{clone.sales_logic}")
    
    # Tone keywords
    if clone.tone_keywords and len(clone.tone_keywords) > 0:
        keywords = ", ".join(clone.tone_keywords)
        extra_instructions.append(f"\nPALABRAS/FRASES QUE DEBES USAR: {keywords}")
    
    # Avoid keywords
    if clone.avoid_keywords and len(clone.avoid_keywords) > 0:
        avoid = ", ".join(clone.avoid_keywords)
        extra_instructions.append(f"\nPALABRAS/FRASES QUE NUNCA DEBES USAR: {avoid}")
    
    # Dealer city
    if hasattr(clone, 'dealer_city') and clone.dealer_city:
        extra_instructions.append(f"\nUBICACIÓN DEL DEALER: {clone.dealer_city}")
    
    # Shipping info
    if hasattr(clone, 'shipping_info') and clone.shipping_info:
        extra_instructions.append(f"\nINFORMACIÓN DE ENVÍOS:\n{clone.shipping_info}")
    
    # Priority instruction for any custom config
    if extra_instructions:
        extra_instructions.append("\n⚠️ PRIORIDAD: Las instrucciones personalizadas anteriores tienen MÁXIMA PRIORIDAD sobre las instrucciones por defecto.")
        base_system_prompt += "\n".join(extra_instructions)
        
    # Append the March 2026 Lease & Purchase PDFs text data so the AI can extract exact prices
    try:
        with open("lease_content.txt", "r", encoding="utf-8") as f:
            pdf_data = f.read()
        with open("compra_content.txt", "r", encoding="utf-8") as f:
            pdf_data += "\n\n=== TABLAS DE COMPRA / FINANCIAMIENTO ===\n" + f.read()
            
        base_system_prompt += f"\n\n=== DATOS EXACTOS DE LEASE Y COMPRA (MARZO) ===\nBusca aquí los valores exactos (MRT, Residual, Money Factor o APR mensual) para el modelo solicitado y pásalos a la herramienta calculate_payment:\n{pdf_data}\n================================================\n"
    except Exception as e:
        print(f"[SalesAgent] Warning: Could not load lease/compra_content.txt: {e}")
    
    print(f"[SalesAgent] Agent: {agent_name} | Custom config: {bool(extra_instructions)}", flush=True)
    
    context_str = f"""
{memory_context}

ESTADO DE LA CONVERSACIÓN ACTUAL:
- Stage: {state.get('stage', 'INTAKE')}
- Vehículo discutido: {state.get('vehicle_interest', 'No definido')}
- Score mencionado: {state.get('credit_score', 'No definido')}
- Documento: {state.get('doc_type', 'No definido')}
- FECHA Y HORA ACTUAL: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (Usa esto para calcular "mañana", "lunes", etc)

INSTRUCCIÓN ESPECIAL DE MEMORIA:
Si el cliente ya te dio información antes (ves arriba en MEMORIA DEL CLIENTE), 
NO la pidas de nuevo. Usa lo que ya sabes para personalizar tu respuesta.
Si hay objeciones previas, tenlas en cuenta al responder.
"""
    
    # === STEP 4: Call OpenAI with full context ===
    response_text, media_info = _call_openai_with_tools(
        system_prompt=base_system_prompt + "\n" + context_str,
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
                            db, # Pass DB session
                            override_msrp=func_args.get("override_msrp"),
                            override_residual=func_args.get("override_residual"),
                            override_money_factor=func_args.get("override_money_factor")
                        )
                    else:
                        res = CalculatorService.calculate_finance(
                            func_args.get("model_name"),
                            func_args.get("credit_score", 650),
                            dp,
                            60, # term
                            db, # Pass DB session
                            override_msrp=func_args.get("override_msrp"),
                            override_apr=func_args.get("override_apr")
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

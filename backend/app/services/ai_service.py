"""
AI Service for extracting client data from messages using GPT.
Automatically identifies: name, email, phone, interest level, urgency, sentiment.
"""
import os
import json
from typing import Optional
from openai import OpenAI
from pydantic import BaseModel

class ExtractedClientData(BaseModel):
    """Data extracted from a message by AI"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    interest_level: Optional[str] = None  # high, medium, low
    urgency: Optional[str] = None  # urgent, normal, low
    sentiment: Optional[str] = None  # positive, neutral, negative
    intent: Optional[str] = None  # buy, inquiry, complaint, support
    product_interest: Optional[str] = None  # What product/service they're interested in
    summary: Optional[str] = None  # Brief summary of the message
    follow_up_suggested: bool = False
    suggested_response: Optional[str] = None


def analyze_message(message_content: str, client_context: dict = None) -> ExtractedClientData:
    """
    Use GPT to analyze a message and extract client data.
    
    Args:
        message_content: The text of the message to analyze
        client_context: Optional dict with existing client info for context
        
    Returns:
        ExtractedClientData with extracted information
    """
    if not os.getenv("OPENAI_API_KEY"):
        print("[AI] Warning: OPENAI_API_KEY not set, returning empty extraction")
        return ExtractedClientData()
    
    client = OpenAI()
    
    context_str = ""
    if client_context:
        context_str = f"""
Contexto del cliente existente:
- Nombre: {client_context.get('name', 'Desconocido')}
- Teléfono: {client_context.get('phone', 'N/A')}
- Historial: {client_context.get('notes', 'Sin notas previas')}
"""
    
    prompt = f"""Analiza el siguiente mensaje de un cliente potencial y extrae información relevante.

{context_str}

MENSAJE:
"{message_content}"

Extrae la siguiente información en formato JSON:
- name: Nombre del cliente si se menciona
- email: Email si se menciona
- phone: Número de teléfono si se menciona (diferente al remitente)
- interest_level: "high", "medium", o "low" basado en qué tan interesado parece
- urgency: "urgent", "normal", o "low" basado en la urgencia del mensaje
- sentiment: "positive", "neutral", o "negative" 
- intent: "buy" (quiere comprar), "inquiry" (pregunta), "complaint" (queja), "support" (necesita ayuda)
- product_interest: Qué producto o servicio le interesa (si se menciona)
- summary: Resumen breve del mensaje en 1 línea
- follow_up_suggested: true si debería hacerse seguimiento pronto
- suggested_response: Sugerencia breve de cómo responder

Si algo no está claro o no se menciona, usa null.
Responde SOLO con el JSON, sin explicaciones adicionales.
"""

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente CRM experto en análisis de mensajes de clientes. Respondes solo en JSON válido."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=500
        )
        
        response_text = completion.choices[0].message.content
        data = json.loads(response_text)
        
        return ExtractedClientData(**data)
        
    except Exception as e:
        print(f"[AI] Error analyzing message: {e}")
        return ExtractedClientData()


from app.services.calculator import CalculatorService
from app.services.calendar_integration import CalendarService
import json


def _build_user_prompt(clone):
    """Build a dynamic system prompt from user's SalesClone config, using the DEFAULT prompt as base."""
    from app.utils.sales_agent import DEFAULT_SYSTEM_PROMPT
    
    # Start with DEFAULT prompt, inject agent name
    agent_name = clone.name if (clone.name and clone.name != "Mi Clon de Ventas") else "tu asesor de ventas"
    prompt = DEFAULT_SYSTEM_PROMPT.replace("{AGENT_NAME}", agent_name)
    
    # Layer user's custom config ON TOP
    extras = []
    
    if clone.personality:
        extras.append(f"\n--- INSTRUCCIONES ADICIONALES ---\n{clone.personality}")
    
    if clone.sales_logic:
        extras.append(f"\n--- REGLAS DE VENTAS PERSONALIZADAS ---\n{clone.sales_logic}")
    
    if clone.tone_keywords and len(clone.tone_keywords) > 0:
        extras.append(f"\nPALABRAS/FRASES QUE DEBES USAR: {', '.join(clone.tone_keywords)}")
    
    if clone.avoid_keywords and len(clone.avoid_keywords) > 0:
        extras.append(f"\nPALABRAS/FRASES QUE NUNCA DEBES USAR: {', '.join(clone.avoid_keywords)}")
    
    if hasattr(clone, 'dealer_city') and clone.dealer_city:
        extras.append(f"\nUBICACIÓN DEL DEALER: {clone.dealer_city}")
    
    if hasattr(clone, 'shipping_info') and clone.shipping_info:
        extras.append(f"\nINFORMACIÓN DE ENVÍOS:\n{clone.shipping_info}")
    
    if clone.example_responses and len(clone.example_responses) > 0:
        examples = "\n".join([
            f"  Cliente: \"{ex.get('question', '')}\"\n  Tú: \"{ex.get('answer', '')}\""
            for ex in clone.example_responses[:5]
        ])
        extras.append(f"\nEJEMPLOS DE CÓMO RESPONDER:\n{examples}")
    
    if extras:
        extras.append("\n⚠️ PRIORIDAD: Las instrucciones personalizadas anteriores tienen MÁXIMA PRIORIDAD.")
        prompt += "\n".join(extras)
    
    return prompt


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

def generate_smart_reply(message_content: str, client_name: str = None, context: str = None, conversation_history: list = None, user_id: str = None, db=None) -> str:
    """
    Generate a suggested reply using Ray's persona and tools.
    """
    if not os.getenv("OPENAI_API_KEY"):
        return ""
    
    client = OpenAI()
    
    # Format history
    history_text = "\n".join(conversation_history) if conversation_history else "Sin historial reciente."
    
    # Context setup
    inputs = f"""
INFORMACIÓN DE CONTEXTO:
Cliente: {client_name or 'Desconocido'}
Notas del Cliente: {context or 'Sin notas'}

HISTORIAL RECIENTE (IMPORTANTE - USA ESTO PARA SABER DE QUÉ AUTO HABLAN):
{history_text}

ÚLTIMO MENSAJE DEL CLIENTE: 
"{message_content}"
"""
    
    # Load per-user bot config - ALWAYS uses DEFAULT_SYSTEM_PROMPT as base
    system_prompt = None
    if user_id and db:
        try:
            from app.models import SalesClone
            clone = db.query(SalesClone).filter(SalesClone.user_id == user_id).first()
            if clone:
                system_prompt = _build_user_prompt(clone)
                print(f"[AI] Using bot config for user {user_id}")
        except Exception as e:
            print(f"[AI] Error loading clone config: {e}")
    
    # Fallback if no clone found
    if not system_prompt:
        from app.utils.sales_agent import DEFAULT_SYSTEM_PROMPT
        system_prompt = DEFAULT_SYSTEM_PROMPT.replace("{AGENT_NAME}", "tu asesor de ventas")
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": inputs}
    ]
    
    try:
        # First call: Check if tools are needed
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=RAY_TOOLS,
            tool_choice="auto",
            temperature=0.3 # Low temp for strict adherence
        )
        
        response_message = response.choices[0].message
        
        # If tool requested
        if response_message.tool_calls:
            # Append method to history
            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                tool_output = "Error en herramienta"
                
                if function_name == "calculate_payment":
                    # Map args to service
                    # Default args if missing
                    d_pymt = function_args.get("down_payment")
                    if d_pymt is None: d_pymt = 2000.0
                    
                    if function_args.get("plan_type") == "lease":
                        res = CalculatorService.calculate_lease(
                            function_args.get("model_name"),
                            function_args.get("credit_score"),
                            d_pymt
                        )
                    else: # finance
                        res = CalculatorService.calculate_finance(
                            function_args.get("model_name"),
                            function_args.get("credit_score"),
                            d_pymt
                        )
                    tool_output = json.dumps(res)
                    
                elif function_name == "check_calendar":
                    tool_output = CalendarService.check_calendar()
                
                # Append tool result
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": tool_output,
                })
            
            # Second call: Get final answer with tool data
            final_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7 # Slight creativity for phrasing
            )
            return final_response.choices[0].message.content.strip()
            
        return response_message.content.strip()
        
    except Exception as e:
        print(f"[AI] Error generating reply: {e}")
        return ""


def categorize_client(messages_history: list, current_tags: list = None) -> dict:
    """
    Analyze conversation history and suggest tags/category for the client.
    
    Args:
        messages_history: List of message contents
        current_tags: Current tags assigned to client
        
    Returns:
        Dict with suggested_tag, confidence, and reason
    """
    if not os.getenv("OPENAI_API_KEY") or not messages_history:
        return {"suggested_tag": None, "confidence": 0, "reason": "No data"}
    
    client = OpenAI()
    
    messages_text = "\n".join([f"- {m}" for m in messages_history[-10:]])  # Last 10 messages
    current_tags_str = ", ".join(current_tags) if current_tags else "Ninguna"
    
    prompt = f"""Basándote en el historial de conversación, sugiere la mejor categoría para este cliente.

HISTORIAL DE MENSAJES:
{messages_text}

ETIQUETAS ACTUALES: {current_tags_str}

CATEGORÍAS DISPONIBLES:
- Nuevo: Cliente nuevo sin interacción significativa
- Interesado: Ha mostrado interés activo
- Seguimiento: Necesita seguimiento para cerrar
- Negociando: En proceso de negociación/precio
- Compró: Ya realizó una compra
- Perdido: No interesado o dejó de responder

Responde en JSON con:
- suggested_tag: La categoría más apropiada
- confidence: 0-100 qué tan seguro estás
- reason: Breve explicación de por qué
"""

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un CRM inteligente. Categorizas clientes basándote en su historial."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=200
        )
        
        return json.loads(completion.choices[0].message.content)
        
    except Exception as e:
        print(f"[AI] Error categorizing client: {e}")
        return {"suggested_tag": None, "confidence": 0, "reason": str(e)}

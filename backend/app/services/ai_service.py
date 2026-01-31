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

RAY_SYSTEM_PROMPT = """Eres RAY, vendedor senior de Toyota.
No eres un bot conversacional.
Eres un cierre asistido por herramientas reales.

Tu objetivo es cerrar ventas bien estructuradas, no vender por impulso.

🔒 IDENTIDAD Y TONO
Directo
Claro
Sin frases robóticas
Sin formalidades innecesarias
Sin empatía falsa
Lideras la conversación

PROHIBIDO decir:
"Gracias por compartir"
"Genial"
"Excelente elección"
"Déjame revisar"
"La calculadora de Toyota"
"Sistema / plataforma"
"Agenda una cita" sin números

🧠 REGLAS DE ORO
Nunca inventes datos.
Nunca asumas información no dicha.
Nunca des números sin usar la Calculadora AutoAI.
Nunca agendes sin:
Perfil completo
Números dados

Si falta información → preguntas claras y puntuales.
Si no es viable → dilo con respeto y firmeza.

🔧 USO DE HERRAMIENTAS (OBLIGATORIO)

Calculadora AutoAI (calculate_payment):
SOLO se usa cuando:
Ya sabes el modelo
Ya sabes si es compra o lease (o ambos para comparar)
Ya conoces el score aproximado
Down payment (si no dice, asume $2000 o pregunta)
Los números que das deben salir de esta herramienta.
Está prohibido estimar "a ojo".

Calendario AutoAI (check_calendar):
SOLO se consulta después de dar números y que el cliente valide interés.
SOLO se ofrecen horarios disponibles.
Máximo 2 opciones por mensaje.

🧠 FLUJO MENTAL OBLIGATORIO
FASE 1 – PERFIL
Preguntas necesarias:
¿Qué carro buscas?
¿Para qué lo vas a usar?
¿Es tu primer carro o ya has financiado?
¿Qué documento tienes?
¿Tu score está más cerca de 600, 650 o 700+?
⛔ No hables de precios ni citas aquí.

FASE 2 – ESTRATEGIA
Decides según perfil:
Uber → Compra
Pocas millas → Lease
Primer carro → Conservador
Carro financiado → Alerta payoff
Hablas claro:
"La idea no es venderte algo de lo que te arrepientas mañana."

FASE 3 – NÚMEROS
Llamas a Calculadora AutoAI
Usas el modelo exacto solicitado
Das:
Pago mensual estimado
Due at signing estimado
APR aproximado
Aclaras que es un aproximado realista

FASE 4 – CITA
Explicas que la cita es para:
Manejar el carro
Ver números finales
Tomar decisión
Consultas Calendario AutoAI
Ofreces 1–2 horarios reales

🧠 FILOSOFÍA RAY
Prefieres:
Perder una venta
Antes que meter a alguien en un mal negocio
Tu meta:
Que el cliente esté cómodo
Que vuelva en el futuro
Construir relación, no presión
"""

RAY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_payment",
            "description": "Calculates monthly payment for Lease or Finance. Use this BEFORE giving any price.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model_name": {"type": "string", "description": "Car model (e.g., 'Corolla', 'RAV4')"},
                    "plan_type": {"type": "string", "enum": ["lease", "finance"], "description": "Type of deal"},
                    "credit_score": {"type": "integer", "description": "Client's FICO score"},
                    "down_payment": {"type": "number", "description": "Down payment amount in USD"}
                },
                "required": ["model_name", "plan_type", "credit_score", "down_payment"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_calendar",
            "description": "Checks available appointment slots. Use this ONLY after giving numbers.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]

def generate_smart_reply(message_content: str, client_name: str = None, context: str = None) -> str:
    """
    Generate a suggested reply using Ray's persona and tools.
    """
    if not os.getenv("OPENAI_API_KEY"):
        return ""
    
    client = OpenAI()
    
    # Context setup
    inputs = f"Cliente: {client_name or 'Desconocido'}\nContexto: {context}\nÚltimo mensaje: {message_content}"
    
    messages = [
        {"role": "system", "content": RAY_SYSTEM_PROMPT},
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
                    if function_args.get("plan_type") == "lease":
                        res = CalculatorService.calculate_lease(
                            function_args.get("model_name"),
                            function_args.get("credit_score"),
                            function_args.get("down_payment")
                        )
                    else: # finance
                        res = CalculatorService.calculate_finance(
                            function_args.get("model_name"),
                            function_args.get("credit_score"),
                            function_args.get("down_payment")
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

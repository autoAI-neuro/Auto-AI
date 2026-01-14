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


def generate_smart_reply(message_content: str, client_name: str = None, context: str = None) -> str:
    """
    Generate a suggested reply to a client message.
    
    Args:
        message_content: The message to reply to
        client_name: Optional client name for personalization
        context: Optional additional context
        
    Returns:
        Suggested reply text
    """
    if not os.getenv("OPENAI_API_KEY"):
        return ""
    
    client = OpenAI()
    
    name_str = f"El cliente se llama {client_name}." if client_name else ""
    context_str = f"Contexto adicional: {context}" if context else ""
    
    prompt = f"""Genera una respuesta profesional pero amigable para el siguiente mensaje de un cliente.
{name_str}
{context_str}

MENSAJE DEL CLIENTE:
"{message_content}"

La respuesta debe ser:
- Corta (máximo 2-3 oraciones)
- Profesional pero cálida
- En español
- Lista para enviar por WhatsApp

Responde SOLO con el texto de la respuesta, sin comillas ni explicaciones.
"""

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente de ventas profesional. Generas respuestas amigables y efectivas."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        
        return completion.choices[0].message.content.strip()
        
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

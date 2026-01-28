"""
AI Response Generator for Sales Clone
Uses OpenAI API to generate personalized sales responses
"""
import os
from typing import Optional

# OpenAI API Key (set in Railway environment variables)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def generate_clone_response(
    clone,  # SalesClone object
    buyer_message: str,
    client_context: Optional[dict] = None,
    conversation_history: Optional[list] = None  # Previous messages in conversation
) -> dict:
    """
    Generate an AI response based on the sales clone's personality and training.
    
    Args:
        clone: SalesClone model with personality, sales_logic, etc.
        buyer_message: The message from the buyer/client
        client_context: Optional info about the client (name, car interest, etc.)
        conversation_history: List of previous messages [{role: "buyer"|"clone", text: str}]
    
    Returns:
        dict with 'response' (str) and 'confidence' (float)
    """
    
    # Build the system prompt from clone configuration
    system_prompt = _build_system_prompt(clone, client_context)
    
    # If no API key, use rule-based fallback
    if not OPENAI_API_KEY:
        print("[AI Response] No OPENAI_API_KEY found, using fallback")
        return _fallback_response(clone, buyer_message, client_context)
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Build messages array with conversation history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history:
                role = "user" if msg.get("role") == "buyer" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
        
        # Add current message
        messages.append({"role": "user", "content": buyer_message})
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast, cheap, excellent quality
            messages=messages,
            max_tokens=200,
            temperature=0.7  # Some creativity but not too random
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        print(f"[AI Response] OpenAI generated: {ai_response[:100]}...")
        
        return {
            "response": ai_response,
            "confidence": 0.90  # High confidence with real AI
        }
        
    except Exception as e:
        print(f"[AI Response] Error with OpenAI: {e}")
        import traceback
        traceback.print_exc()
        return _fallback_response(clone, buyer_message, client_context)


def _build_system_prompt(clone, client_context: Optional[dict]) -> str:
    """Build the system prompt for the AI based on clone configuration"""
    
    parts = []
    
    # Core identity
    parts.append("Eres un asistente de ventas de autos que responde por WhatsApp.")
    
    # Base personality
    if clone.personality:
        parts.append(f"Tu personalidad como vendedor:\n{clone.personality}")
    
    # Sales logic
    if clone.sales_logic:
        parts.append(f"Tu estrategia de ventas:\n{clone.sales_logic}")
    
    # Tone keywords
    if clone.tone_keywords:
        keywords = ", ".join(clone.tone_keywords) if isinstance(clone.tone_keywords, list) else clone.tone_keywords
        parts.append(f"Palabras y frases que usas frecuentemente: {keywords}")
    
    # Words to avoid
    if clone.avoid_keywords:
        avoid = ", ".join(clone.avoid_keywords) if isinstance(clone.avoid_keywords, list) else clone.avoid_keywords
        parts.append(f"Palabras que NUNCA debes usar: {avoid}")
    
    # Example responses for training
    if clone.example_responses:
        examples = "\n".join([
            f"Cliente: {ex.get('question', '')}\nTú: {ex.get('answer', '')}"
            for ex in clone.example_responses[:5]  # Limit to 5 examples
        ])
        parts.append(f"Ejemplos de cómo respondes (APRENDE de estos pero NO los copies exactamente):\n{examples}")
    
    # Client context if available
    if client_context:
        context_parts = []
        if client_context.get("name"):
            context_parts.append(f"Nombre del cliente: {client_context['name']}")
        if client_context.get("car_interest"):
            context_parts.append(f"Interesado en: {client_context['car_interest']}")
        if client_context.get("status"):
            context_parts.append(f"Estado del cliente: {client_context['status']}")
        
        if context_parts:
            parts.append(f"Contexto del cliente:\n" + "\n".join(context_parts))
    
    # Critical instructions
    parts.append("""
REGLAS IMPORTANTES:
- Responde de manera BREVE y NATURAL (máximo 2-3 oraciones)
- NO copies las respuestas de ejemplo textualmente, APRENDE el estilo
- Usa emojis con moderación si es apropiado para el contexto
- Si no sabes algo, ofrece averiguarlo
- Tu objetivo es ayudar al cliente y avanzar hacia la venta
- NUNCA digas "Un momento y te atiendo" - SIEMPRE da una respuesta útil
- Responde SOLO el mensaje, sin prefijos como "Vendedor:" o "Asistente:"
""")
    
    return "\n\n".join(parts)


def _fallback_response(clone, buyer_message: str, client_context: Optional[dict]) -> dict:
    """
    Rule-based fallback when AI is not available.
    Uses example_responses if available, otherwise generic responses.
    """
    
    message_lower = buyer_message.lower()
    
    # Check if any example matches
    if clone.example_responses:
        for example in clone.example_responses:
            question = example.get("question", "").lower()
            # Simple keyword matching
            if any(word in message_lower for word in question.split() if len(word) > 3):
                return {
                    "response": example.get("answer", ""),
                    "confidence": 0.6
                }
    
    # Generic responses based on keywords
    if any(word in message_lower for word in ["precio", "costo", "cuánto", "cuanto"]):
        return {
            "response": "¡Hola! El precio depende del modelo y año que te interese. ¿Cuál vehículo te llamó la atención? 🚗",
            "confidence": 0.5
        }
    
    if any(word in message_lower for word in ["hola", "buenas", "buenos días", "buenas tardes"]):
        client_name = client_context.get("name", "") if client_context else ""
        greeting = f"¡Hola{' ' + client_name if client_name else ''}!" 
        return {
            "response": f"{greeting} ¿En qué puedo ayudarte hoy? 😊",
            "confidence": 0.5
        }
    
    if any(word in message_lower for word in ["disponible", "tienen", "hay"]):
        return {
            "response": "Déjame verificar la disponibilidad y te confirmo enseguida. ¿Es un modelo específico el que buscas?",
            "confidence": 0.5
        }
    
    if any(word in message_lower for word in ["financiamiento", "credito", "crédito", "pagos"]):
        return {
            "response": "¡Claro que sí! Manejamos varias opciones de financiamiento. ¿Tienes algún presupuesto en mente?",
            "confidence": 0.5
        }
    
    # Default response - NEVER say "te atiendo"
    return {
        "response": "¡Gracias por tu mensaje! ¿En qué modelo estás interesado? 🚗",
        "confidence": 0.3
    }


def check_clone_status(db, user_id: str) -> dict:
    """
    Quick check if a user has an active sales clone.
    Used by webhook to determine if auto-reply should trigger.
    """
    from app.models import SalesClone
    
    clone = db.query(SalesClone).filter(
        SalesClone.user_id == user_id,
        SalesClone.is_active == True
    ).first()
    
    return {
        "has_active_clone": clone is not None,
        "clone": clone
    }

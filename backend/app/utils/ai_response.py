"""
AI Response Generator for Sales Clone
Uses Gemini API to generate personalized sales responses
"""
import os
import json
from typing import Optional

# Placeholder for Gemini API integration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def generate_clone_response(
    clone,  # SalesClone object
    buyer_message: str,
    client_context: Optional[dict] = None
) -> dict:
    """
    Generate an AI response based on the sales clone's personality and training.
    
    Args:
        clone: SalesClone model with personality, sales_logic, etc.
        buyer_message: The message from the buyer/client
        client_context: Optional info about the client (name, car interest, etc.)
    
    Returns:
        dict with 'response' (str) and 'confidence' (float)
    """
    
    # Build the system prompt from clone configuration
    system_prompt = _build_system_prompt(clone, client_context)
    
    # If no API key, use rule-based fallback
    if not GEMINI_API_KEY:
        return _fallback_response(clone, buyer_message, client_context)
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Build the conversation
        prompt = f"""{system_prompt}

Mensaje del cliente: {buyer_message}

Responde como el vendedor, siguiendo tu personalidad y estrategia de ventas. 
Sé natural y conversacional. No uses formatos como "Vendedor:" o similares.
Respuesta:"""

        response = model.generate_content(prompt)
        
        return {
            "response": response.text.strip(),
            "confidence": 0.85
        }
        
    except Exception as e:
        print(f"[AI Response] Error with Gemini: {e}")
        return _fallback_response(clone, buyer_message, client_context)


def _build_system_prompt(clone, client_context: Optional[dict]) -> str:
    """Build the system prompt for the AI based on clone configuration"""
    
    parts = []
    
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
        parts.append(f"Ejemplos de cómo respondes:\n{examples}")
    
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
    
    # Default instructions
    parts.append("""
Instrucciones:
- Eres un vendedor de autos profesional y amigable
- Responde de manera breve y natural (máximo 2-3 oraciones)
- Usa emojis con moderación si es apropiado
- Si no sabes algo, ofrece averiguarlo
- Tu objetivo es ayudar al cliente y cerrar la venta
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
    
    # Default response
    return {
        "response": "¡Gracias por escribirnos! Un momento y te atiendo. 😊",
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

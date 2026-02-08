"""
MemoryService - Manages persistent memory for each client.
Used by Ray to remember everything about each client.
"""
import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from openai import OpenAI

from app.models import ClientMemory


class MemoryService:
    """Service for managing client memory used by Ray."""
    
    @staticmethod
    def get_memory(db: Session, client_id: str) -> Optional[ClientMemory]:
        """Get memory for a client, or None if doesn't exist."""
        return db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
    
    @staticmethod
    def get_or_create_memory(db: Session, client_id: str, user_id: str) -> ClientMemory:
        """Get existing memory or create a new one for the client."""
        memory = MemoryService.get_memory(db, client_id)
        
        if not memory:
            from app.models import get_uuid
            memory = ClientMemory(
                id=get_uuid(),
                client_id=client_id,
                user_id=user_id,
                interaction_count=0,
                relationship_score=50
            )
            db.add(memory)
            db.commit()
            db.refresh(memory)
        
        return memory
    
    @staticmethod
    def update_memory(db: Session, client_id: str, updates: Dict[str, Any]) -> ClientMemory:
        """Update specific fields in client memory."""
        memory = db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
        
        if not memory:
            raise ValueError(f"No memory found for client {client_id}")
        
        for field, value in updates.items():
            if hasattr(memory, field):
                setattr(memory, field, value)
        
        memory.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(memory)
        
        return memory
    
    @staticmethod
    def increment_interaction(db: Session, client_id: str, user_id: str) -> ClientMemory:
        """Increment interaction count and update last interaction time."""
        memory = MemoryService.get_or_create_memory(db, client_id, user_id)
        memory.interaction_count = (memory.interaction_count or 0) + 1
        memory.last_interaction_at = datetime.utcnow()
        db.commit()
        return memory
    
    @staticmethod
    def add_objection(
        db: Session, 
        client_id: str, 
        objection: str, 
        response_given: str = None,
        resolved: bool = False
    ) -> ClientMemory:
        """Add an objection to the client's memory."""
        memory = db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
        
        if not memory:
            raise ValueError(f"No memory found for client {client_id}")
        
        objections = memory.objections or []
        objections.append({
            "objection": objection,
            "response_given": response_given,
            "resolved": resolved,
            "date": datetime.utcnow().isoformat()
        })
        
        memory.objections = objections
        db.commit()
        
        return memory
    
    @staticmethod
    def add_vehicle_interest(
        db: Session,
        client_id: str,
        model: str,
        trim: str = None,
        color: str = None,
        reason: str = None
    ) -> ClientMemory:
        """Add a vehicle of interest to the client's memory."""
        memory = db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
        
        if not memory:
            raise ValueError(f"No memory found for client {client_id}")
        
        vehicles = memory.vehicles_interested or []
        
        # Check if this vehicle is already in the list
        existing = next(
            (v for v in vehicles if v.get("model", "").lower() == model.lower()),
            None
        )
        
        if existing:
            # Update existing entry
            if trim: existing["trim"] = trim
            if color: existing["color"] = color
            if reason: existing["reason"] = reason
            existing["updated_at"] = datetime.utcnow().isoformat()
        else:
            # Add new entry
            vehicles.append({
                "model": model,
                "trim": trim,
                "color": color,
                "reason": reason,
                "date": datetime.utcnow().isoformat()
            })
        
        memory.vehicles_interested = vehicles
        db.commit()
        
        return memory
    
    @staticmethod
    def add_offer(
        db: Session,
        client_id: str,
        vehicle: str,
        payment: float,
        down_payment: float = None,
        term: int = None,
        plan_type: str = None,
        accepted: bool = None
    ) -> ClientMemory:
        """Record an offer given to the client."""
        memory = db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
        
        if not memory:
            raise ValueError(f"No memory found for client {client_id}")
        
        offers = memory.offers_given or []
        
        new_offer = {
            "vehicle": vehicle,
            "payment": payment,
            "down_payment": down_payment,
            "term": term,
            "plan_type": plan_type,
            "accepted": accepted,
            "date": datetime.utcnow().isoformat()
        }
        
        offers.append(new_offer)
        memory.offers_given = offers
        memory.last_offer = new_offer
        
        db.commit()
        
        return memory
    
    @staticmethod
    def generate_context_for_ray(memory: ClientMemory) -> str:
        """
        Generate a human-readable context string for Ray's prompt.
        This is what Ray will see about the client.
        """
        if not memory:
            return "No hay memoria previa de este cliente."
        
        lines = ["📋 MEMORIA DEL CLIENTE:"]
        
        # Vehicles of interest
        if memory.vehicles_interested:
            vehicles = memory.vehicles_interested
            if len(vehicles) == 1:
                v = vehicles[0]
                lines.append(f"🚗 Vehículo de interés: {v.get('model', 'N/A')} {v.get('trim', '')}".strip())
            else:
                lines.append(f"🚗 Vehículos de interés: {', '.join([v.get('model', '') for v in vehicles])}")
        
        # Budget
        if memory.preferred_budget_monthly:
            lines.append(f"💰 Presupuesto mensual: ~${memory.preferred_budget_monthly}/mes")
        if memory.preferred_budget_down:
            lines.append(f"💵 Down payment disponible: ${memory.preferred_budget_down}")
        if memory.preferred_plan:
            plan_text = "Lease" if memory.preferred_plan == "lease" else "Financiamiento"
            lines.append(f"📝 Preferencia: {plan_text}")
        
        # Credit
        if memory.credit_score_mentioned:
            lines.append(f"📊 Crédito mencionado: {memory.credit_score_mentioned}")
        if memory.credit_tier:
            lines.append(f"🏆 Tier de crédito: {memory.credit_tier}")
        if memory.document_type:
            doc_map = {"ssn": "Social", "itin": "ITIN", "passport": "Pasaporte"}
            lines.append(f"📄 Documento: {doc_map.get(memory.document_type, memory.document_type)}")
        
        # Objections (critical for Ray to know!)
        if memory.objections:
            recent_objections = memory.objections[-3:]  # Last 3
            obj_texts = [o.get("objection", "") for o in recent_objections if o.get("objection")]
            if obj_texts:
                lines.append(f"⚠️ Objeciones previas: {'; '.join(obj_texts)}")
        
        # Concerns
        if memory.concerns:
            lines.append(f"🤔 Preocupaciones: {', '.join(memory.concerns)}")
        
        # Communication style
        if memory.communication_style:
            style_map = {
                "formal": "Prefiere trato formal",
                "casual": "Tono casual/amigable",
                "direct": "Le gusta ir al grano",
                "friendly": "Disfruta la conversación"
            }
            lines.append(f"💬 Estilo: {style_map.get(memory.communication_style, memory.communication_style)}")
        
        # Personal context
        if memory.occupation:
            lines.append(f"👔 Ocupación: {memory.occupation}")
        if memory.family_info:
            family = memory.family_info
            if family.get("spouse_name"):
                lines.append(f"👨‍👩‍👧 Familia: Esposo/a {family.get('spouse_name')}")
            if family.get("kids_count"):
                lines.append(f"👶 Hijos: {family.get('kids_count')}")
        
        # Trade-in
        if memory.has_trade_in and memory.trade_in_details:
            trade = memory.trade_in_details
            lines.append(f"🔄 Trade-in: {trade.get('year', '')} {trade.get('make', '')} {trade.get('model', '')}".strip())
        
        # Timeline
        if memory.buying_timeline:
            timeline_map = {
                "now": "Quiere comprar YA",
                "this_week": "Esta semana",
                "this_month": "Este mes",
                "exploring": "Solo explorando"
            }
            lines.append(f"⏰ Timeline: {timeline_map.get(memory.buying_timeline, memory.buying_timeline)}")
        
        # Last offer
        if memory.last_offer:
            offer = memory.last_offer
            lines.append(f"📋 Última oferta: {offer.get('vehicle', '')} a ${offer.get('payment', 0)}/mes")
        
        # AI insights
        if memory.key_insights:
            lines.append(f"💡 Insights: {', '.join(memory.key_insights[:3])}")
        
        # Relationship
        if memory.relationship_score is not None:
            if memory.relationship_score >= 70:
                lines.append("🟢 Relación: Buena conexión establecida")
            elif memory.relationship_score >= 40:
                lines.append("🟡 Relación: En desarrollo")
            else:
                lines.append("🔴 Relación: Necesita más rapport")
        
        if len(lines) == 1:
            return "📋 MEMORIA DEL CLIENTE: Primera interacción, sin datos previos."
        
        return "\n".join(lines)
    
    @staticmethod
    def extract_insights_from_message(
        message: str, 
        existing_memory: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Use GPT to extract insights from a message and return updates for memory.
        """
        if not os.getenv("OPENAI_API_KEY"):
            return {}
        
        client = OpenAI()
        
        existing_context = ""
        if existing_memory:
            existing_context = f"""
Memoria existente:
- Vehículo interés: {existing_memory.get('vehicles_interested', 'N/A')}
- Presupuesto: ${existing_memory.get('preferred_budget_monthly', 'N/A')}/mes
- Objeciones: {existing_memory.get('objections', [])}
"""
        
        prompt = f"""Analiza el siguiente mensaje de un cliente y extrae información relevante para actualizar su perfil.

{existing_context}

MENSAJE DEL CLIENTE:
"{message}"

Extrae SOLO lo que esté claramente mencionado (no asumas). Responde en JSON con estas claves (null si no aplica):
{{
    "vehicle_mentioned": "modelo si menciona uno",
    "budget_monthly": número si menciona presupuesto mensual,
    "budget_down": número si menciona enganche/down,
    "plan_preference": "lease" o "finance" si lo dice,
    "credit_score": número si menciona score,
    "objection": "texto de objeción si hay alguna",
    "concern": "preocupación principal si la hay",
    "timeline": "now/this_week/this_month/exploring",
    "communication_style": "formal/casual/direct/friendly",
    "occupation": "trabajo si lo menciona",
    "family_mention": "info de familia si menciona",
    "document_type": "ssn/itin/passport si menciona",
    "buying_signal": "señal de compra si la hay",
    "sentiment": "positive/neutral/negative"
}}
"""
        
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Extraes información de mensajes de clientes. Solo reportas lo explícitamente mencionado."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=300,
                temperature=0
            )
            
            return json.loads(completion.choices[0].message.content)
            
        except Exception as e:
            print(f"[MemoryService] Error extracting insights: {e}")
            return {}
    
    @staticmethod
    def update_memory_from_insights(
        db: Session,
        client_id: str,
        insights: Dict[str, Any]
    ) -> ClientMemory:
        """Apply extracted insights to update client memory."""
        memory = db.query(ClientMemory).filter(
            ClientMemory.client_id == client_id
        ).first()
        
        if not memory:
            return None
        
        # Vehicle interest
        if insights.get("vehicle_mentioned"):
            MemoryService.add_vehicle_interest(
                db, client_id, insights["vehicle_mentioned"]
            )
        
        # Budget
        if insights.get("budget_monthly"):
            memory.preferred_budget_monthly = insights["budget_monthly"]
        if insights.get("budget_down"):
            memory.preferred_budget_down = insights["budget_down"]
        
        # Plan preference
        if insights.get("plan_preference"):
            memory.preferred_plan = insights["plan_preference"]
        
        # Credit
        if insights.get("credit_score"):
            memory.credit_score_mentioned = insights["credit_score"]
        if insights.get("document_type"):
            memory.document_type = insights["document_type"]
        
        # Objection
        if insights.get("objection"):
            MemoryService.add_objection(db, client_id, insights["objection"])
        
        # Concerns
        if insights.get("concern"):
            concerns = memory.concerns or []
            if insights["concern"] not in concerns:
                concerns.append(insights["concern"])
                memory.concerns = concerns
        
        # Communication style
        if insights.get("communication_style"):
            memory.communication_style = insights["communication_style"]
        
        # Timeline
        if insights.get("timeline"):
            memory.buying_timeline = insights["timeline"]
            memory.last_timeline_update = datetime.utcnow()
        
        # Occupation
        if insights.get("occupation"):
            memory.occupation = insights["occupation"]
        
        # Buying signals
        if insights.get("buying_signal"):
            signals = memory.buying_signals or []
            signals.append({
                "signal": insights["buying_signal"],
                "date": datetime.utcnow().isoformat()
            })
            memory.buying_signals = signals
        
        # Key insights
        if insights.get("sentiment"):
            key_insights = memory.key_insights or []
            if insights["sentiment"] == "positive" and "positive_sentiment" not in key_insights:
                key_insights.append("positive_sentiment")
            memory.key_insights = key_insights
        
        db.commit()
        db.refresh(memory)
        
        return memory
    
    @staticmethod
    def calculate_relationship_score(memory: ClientMemory) -> int:
        """
        Calculate a relationship score (0-100) based on interaction patterns.
        Higher score = warmer relationship.
        """
        if not memory:
            return 50
        
        score = 50  # Base score
        
        # Interaction count bonus
        interactions = memory.interaction_count or 0
        if interactions >= 10:
            score += 15
        elif interactions >= 5:
            score += 10
        elif interactions >= 2:
            score += 5
        
        # Objections resolved (trust building)
        if memory.objections:
            resolved = sum(1 for o in memory.objections if o.get("resolved"))
            score += resolved * 5
        
        # Buying signals (engagement)
        if memory.buying_signals:
            score += len(memory.buying_signals) * 3
        
        # Timeline urgency
        if memory.buying_timeline == "now":
            score += 10
        elif memory.buying_timeline == "this_week":
            score += 5
        
        # Accepted offers
        if memory.offers_given:
            accepted = sum(1 for o in memory.offers_given if o.get("accepted"))
            score += accepted * 10
        
        # Personal info shared (trust indicator)
        if memory.occupation:
            score += 3
        if memory.family_info:
            score += 5
        
        # Cap at 100
        return min(100, max(0, score))

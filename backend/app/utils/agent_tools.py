"""
RAY CLON V2.0 - Agent Tools
Tools for the state-machine based sales agent
"""
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
import os

# ============================================
# TOOL A: PAYMENT CALCULATOR - PURCHASE
# ============================================

def calc_payment_purchase(
    vehicle_price: float,
    downpayment: float = 0,
    term_months: int = 60,
    apr: float = 0.0699,  # 6.99% default
    tax_rate: float = 0.07,  # 7% FL sales tax
    fees: float = 799  # Doc/dealer fees
) -> Dict[str, Any]:
    """
    Calculate estimated monthly payment for a purchase.
    """
    # Safety check for None
    if downpayment is None:
        downpayment = 0
    if vehicle_price is None:
        vehicle_price = 0

    # Calculate tax on vehicle
    tax_amount = vehicle_price * tax_rate
    
    # Total before financing
    total_before_down = vehicle_price + tax_amount + fees
    
    # Amount to finance
    amount_financed = total_before_down - downpayment
    
    if amount_financed <= 0:
        return {
            "monthly_payment": 0,
            "total_loan_amount": 0,
            "total_interest": 0,
            "total_cost": total_before_down,
            "cash_due_at_signing": total_before_down,
            "disclaimer": "Pago de contado, no requiere financiamiento."
        }
    
    # Monthly interest rate
    monthly_rate = apr / 12
    
    # Monthly payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    if monthly_rate > 0:
        monthly_payment = amount_financed * (
            (monthly_rate * (1 + monthly_rate) ** term_months) /
            ((1 + monthly_rate) ** term_months - 1)
        )
    else:
        monthly_payment = amount_financed / term_months
    
    # Total cost calculations
    total_payments = monthly_payment * term_months
    total_interest = total_payments - amount_financed
    total_cost = downpayment + total_payments
    
    return {
        "monthly_payment": round(monthly_payment, 2),
        "total_loan_amount": round(amount_financed, 2),
        "total_interest": round(total_interest, 2),
        "total_cost": round(total_cost, 2),
        "cash_due_at_signing": round(downpayment + fees, 2),
        "apr": apr,
        "term_months": term_months,
        "disclaimer": "Estimado sujeto a aprobación de crédito. APR y términos pueden variar según perfil crediticio."
    }


# ============================================
# TOOL B: PAYMENT CALCULATOR - LEASE
# ============================================

def calc_payment_lease(
    msrp: float,
    residual_percent: float = 0.55,  # 55% residual default
    money_factor: float = 0.00125,  # Approx 3% APR
    term_months: int = 36,
    downpayment: float = 0,
    tax_rate: float = 0.07,
    acquisition_fee: float = 650
) -> Dict[str, Any]:
    """
    Calculate estimated monthly lease payment.
    """
    # Safety check for None
    if downpayment is None:
        downpayment = 0
    if msrp is None:
        msrp = 0

    # Residual value (what car is worth at lease end)
    residual_value = msrp * residual_percent
    
    # Capitalized cost (what you're financing)
    cap_cost = msrp - downpayment
    
    # Depreciation portion of payment
    depreciation = (cap_cost - residual_value) / term_months
    
    # Finance charge portion of payment
    finance_charge = (cap_cost + residual_value) * money_factor
    
    # Base monthly payment
    base_monthly = depreciation + finance_charge
    
    # Add tax (in some states tax is on payment, not full price)
    monthly_with_tax = base_monthly * (1 + tax_rate)
    
    # Due at signing
    first_month = monthly_with_tax
    due_at_signing = downpayment + first_month + acquisition_fee
    
    # Total lease cost
    total_lease_cost = (monthly_with_tax * term_months) + downpayment + acquisition_fee
    
    # Equivalent APR for reference
    equivalent_apr = money_factor * 2400
    
    return {
        "monthly_payment": round(monthly_with_tax, 2),
        "due_at_signing": round(due_at_signing, 2),
        "residual_value": round(residual_value, 2),
        "total_lease_cost": round(total_lease_cost, 2),
        "equivalent_apr": round(equivalent_apr, 2),
        "term_months": term_months,
        "miles_per_year": 12000,  # Standard
        "disclaimer": "Estimado sujeto a aprobación. Residual y money factor varían según programa y tier crediticio."
    }


# ============================================
# TOOL C: CREDIT TIER MAPPING
# ============================================

CREDIT_TIERS = {
    "tier1_plus": {"min_score": 750, "apr_purchase": 0.0499, "apr_lease_factor": 0.00100, "description": "Excelente crédito"},
    "tier1": {"min_score": 720, "apr_purchase": 0.0599, "apr_lease_factor": 0.00120, "description": "Muy buen crédito"},
    "tier2": {"min_score": 680, "apr_purchase": 0.0799, "apr_lease_factor": 0.00150, "description": "Buen crédito"},
    "tier3": {"min_score": 620, "apr_purchase": 0.1199, "apr_lease_factor": 0.00200, "description": "Crédito en construcción"},
    "tier4": {"min_score": 580, "apr_purchase": 0.1599, "apr_lease_factor": None, "description": "Crédito bajo"},
    "first_buyer": {"min_score": 0, "apr_purchase": 0.1299, "apr_lease_factor": 0.00180, "description": "Primer comprador"}
}

def get_credit_tier(score: int, is_first_buyer: bool = False) -> Dict[str, Any]:
    """
    Determine credit tier based on score.
    Returns tier info with APR ranges.
    """
    if is_first_buyer and (score is None or score < 680):
        return {"tier": "first_buyer", **CREDIT_TIERS["first_buyer"]}
    
    if score is None:
        return {"tier": "unknown", "apr_purchase": 0.0999, "description": "Sin información de crédito"}
    
    if score >= 750:
        return {"tier": "tier1_plus", **CREDIT_TIERS["tier1_plus"]}
    elif score >= 720:
        return {"tier": "tier1", **CREDIT_TIERS["tier1"]}
    elif score >= 680:
        return {"tier": "tier2", **CREDIT_TIERS["tier2"]}
    elif score >= 620:
        return {"tier": "tier3", **CREDIT_TIERS["tier3"]}
    else:
        return {"tier": "tier4", **CREDIT_TIERS["tier4"]}


# ============================================
# TOOL D: INVENTORY SEARCH
# ============================================

def inventory_search(
    db: Session,
    user_id: str,
    make: Optional[str] = None,
    model: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    price_max: Optional[float] = None,
    color: Optional[str] = None,
    limit: int = 5
) -> List[Dict]:
    """
    Search inventory with filters.
    Returns list of matching vehicles.
    """
    from app.models import InventoryItem
    
    query = db.query(InventoryItem).filter(
        InventoryItem.user_id == user_id,
        InventoryItem.status == "available"
    )
    
    if make:
        query = query.filter(InventoryItem.make.ilike(f"%{make}%"))
    if model:
        query = query.filter(InventoryItem.model.ilike(f"%{model}%"))
    if year_min:
        query = query.filter(InventoryItem.year >= year_min)
    if year_max:
        query = query.filter(InventoryItem.year <= year_max)
    if price_max:
        query = query.filter(InventoryItem.price <= price_max)
    if color:
        query = query.filter(InventoryItem.color.ilike(f"%{color}%"))
    
    items = query.limit(limit).all()
    
    return [
        {
            "id": item.id,
            "make": item.make,
            "model": item.model,
            "year": item.year,
            "price": item.price,
            "mileage": item.mileage,
            "color": item.color,
            "description": item.description
        }
        for item in items
    ]


# ============================================
# TOOL E: LEAD STATE UPDATE
# ============================================

def update_conversation_state(
    db: Session,
    client_id: str,
    user_id: str,
    **fields
) -> bool:
    """
    Update or create conversation state for a client.
    """
    from app.models import ConversationState
    
    state = db.query(ConversationState).filter(
        ConversationState.client_id == client_id
    ).first()
    
    if not state:
        state = ConversationState(
            client_id=client_id,
            user_id=user_id
        )
        db.add(state)
    
    for key, value in fields.items():
        if hasattr(state, key):
            setattr(state, key, value)
    
    db.commit()
    return True


def get_conversation_state(db: Session, client_id: str) -> Optional[Dict]:
    """
    Get current conversation state for a client.
    """
    from app.models import ConversationState
    
    state = db.query(ConversationState).filter(
        ConversationState.client_id == client_id
    ).first()
    
    if not state:
        return None
    
    return {
        "stage": state.stage,
        "status_color": state.status_color,
        "vehicle_interest": state.vehicle_interest,
        "deal_intent": state.deal_intent,
        "credit_score": state.credit_score,
        "credit_tier": state.credit_tier,
        "first_time_buyer": state.first_time_buyer,
        "has_trade_in": state.has_trade_in,
        "monthly_target": state.monthly_target,
        "downpayment_available": state.downpayment_available,
        "buying_timeline": state.buying_timeline,
        "appointment_datetime": state.appointment_datetime,
        "next_action": state.next_action,
        "conversation_summary": state.conversation_summary
    }


# ============================================
# TOOL F: GENERATE PAYMENT SCENARIOS
# ============================================

def generate_payment_scenarios(
    vehicle_price: float,
    credit_score: int = None,
    is_first_buyer: bool = False,
    downpayment: float = 1000
) -> Dict[str, Any]:
    """
    Generate both purchase and lease scenarios for comparison.
    """
    tier = get_credit_tier(credit_score, is_first_buyer)
    
    # Purchase scenario
    purchase = calc_payment_purchase(
        vehicle_price=vehicle_price,
        downpayment=downpayment,
        apr=tier["apr_purchase"],
        term_months=60
    )
    
    # Lease scenario (if eligible)
    lease = None
    if tier.get("apr_lease_factor"):
        lease = calc_payment_lease(
            msrp=vehicle_price,
            downpayment=downpayment,
            money_factor=tier["apr_lease_factor"],
            term_months=36
        )
    
    return {
        "credit_tier": tier,
        "purchase": purchase,
        "lease": lease,
        "recommendation": _get_recommendation(tier["tier"], purchase, lease)
    }


def _get_recommendation(tier: str, purchase: Dict, lease: Optional[Dict]) -> str:
    """Generate Ray-style recommendation based on scenarios."""
    
    if tier == "first_buyer":
        if lease and lease["monthly_payment"] < purchase["monthly_payment"]:
            return f"Para primer comprador, el lease a ${lease['monthly_payment']}/mes te conviene más. Construyes crédito y quedas cómodo."
        else:
            return f"Para primer comprador con buena inicial, la compra a ${purchase['monthly_payment']}/mes puede funcionar bien."
    
    if tier in ["tier1_plus", "tier1"]:
        if lease and lease["monthly_payment"] < purchase["monthly_payment"]:
            return f"Con tu crédito tienes buen rate. Lease a ${lease['monthly_payment']}/mes o compra a ${purchase['monthly_payment']}/mes, depende si quieres tenerlo tuyo."
        else:
            return f"Con tu crédito el rate está bueno. Compra a ${purchase['monthly_payment']}/mes es sólida opción."
    
    if tier in ["tier3", "tier4"]:
        return f"Con el score actual, el pago queda en ${purchase['monthly_payment']}/mes. Con más inicial lo bajamos."
    
    return f"Pago estimado: ${purchase['monthly_payment']}/mes con ${purchase['cash_due_at_signing']} de entrada."

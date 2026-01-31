"""
Toyota Finance & Lease Calculator Service
Ported from frontend/src/data/toyotaFinanceData.js
"""

# ===========================================
# CONSTANTS & DATA (Ported from JS)
# ===========================================

TOYOTA_FINANCE_DATA = {
    # Program info
    "programPeriod": "January 6, 2026 - February 2, 2026",
    "adminFee": 695,
    "maxDealerMarkup": 300,
    "dispositionFee": 350,

    # STANDARD LEASE RATES
    "standardLeaseRates": {
        "upTo51Months": {
            "tier1": {"ltv110": 0.00296, "ltv120": 0.00321, "ltv130": 0.00361},
            "tier2": {"ltv110": 0.00316, "ltv120": 0.00341, "ltv130": 0.00409},
            "tier3": {"ltv110": 0.00351, "ltv120": 0.00396, "ltv130": 0.00456},
            "tier4": {"ltv110": 0.00426, "ltv120": 0.00496, "ltv130": None}
        },
        "term52to60Adjustment": 0.00060,
        "encoreDiscount": 0.00010,
        "securityDepositWaiver": 0.00010,
        "maxRateParticipation": 0.00100
    },

    # CREDIT TIERS
    "creditTiers": {
        "tier1": {"min": 720, "max": 850, "label": "Tier 1", "description": "Excelente"},
        "tier2": {"min": 680, "max": 719, "label": "Tier 2", "description": "Muy Bueno"},
        "tier3": {"min": 650, "max": 679, "label": "Tier 3", "description": "Bueno"},
        "tier4": {"min": 600, "max": 649, "label": "Tier 4", "description": "Regular"}
    },

    # MILEAGE OPTIONS
    "mileageOptions": {
        "standard": 15000,
        "options": [12000, 15000, 18000],
        "residualAdjustment": {
            12000: 2,   # Add 2%
            15000: 0,   # Standard
            18000: -2   # Deduct 2%
        }
    },

    # SPECIAL 39-MONTH PROGRAMS
    "special39MonthPrograms": {
        "2026 bZ": {
            "models": ["2870", "2872", "2873", "2880", "2882"],
            "bonus": 3500,
            "moneyFactors": {
                "tier1": {"ltv110": 0.00007, "ltv120": 0.00032, "ltv130": 0.00072},
                "tier2": {"ltv110": 0.00027, "ltv120": 0.00052, "ltv130": 0.00120},
                "tier3": {"ltv110": 0.00062, "ltv120": 0.00107, "ltv130": 0.00167},
                "tier4": {"ltv110": 0.00137, "ltv120": 0.00207, "ltv130": None}
            },
            "residuals": {
                "2870": {12: 54, 15: 52, 18: 50},
                "2872": {12: 54, 15: 52, 18: 50},
                "2873": {12: 51, 15: 49, 18: 47},
                "2880": {12: 51, 15: 49, 18: 47},
                "2882": {12: 51, 15: 49, 18: 47}
            }
        },
        "2026 Camry Hybrid": {
             "models": ["2551", "2552", "2553", "2555", "2556", "2557", "2558", "2559", "2560", "2561"],
             "moneyFactors": {
                "tier1": {"ltv110": 0.00268, "ltv120": 0.00293, "ltv130": 0.00333},
                "tier2": {"ltv110": 0.00288, "ltv120": 0.00313, "ltv130": 0.00381},
                "tier3": {"ltv110": 0.00323, "ltv120": 0.00368, "ltv130": 0.00428},
                "tier4": {"ltv110": 0.00398, "ltv120": 0.00468, "ltv130": None}
             }
        },
        "2026 Corolla": {
            "models": ["1852", "1864", "1866"],
            "moneyFactors": {
                "tier1": {"ltv110": 0.00259, "ltv120": 0.00284, "ltv130": 0.00324},
                "tier2": {"ltv110": 0.00279, "ltv120": 0.00304, "ltv130": 0.00372},
                "tier3": {"ltv110": 0.00314, "ltv120": 0.00359, "ltv130": 0.00419},
                "tier4": {"ltv110": 0.00389, "ltv120": 0.00459, "ltv130": None}
            }
        },
        "2026 Corolla Hybrid": {
            "models": ["1882", "1883", "1886", "1887", "1892"],
            "moneyFactors": {
                "tier1": {"ltv110": 0.00278, "ltv120": 0.00303, "ltv130": 0.00343},
                "tier2": {"ltv110": 0.00298, "ltv120": 0.00323, "ltv130": 0.00391},
                "tier3": {"ltv110": 0.00333, "ltv120": 0.00378, "ltv130": 0.00438},
                "tier4": {"ltv110": 0.00408, "ltv120": 0.00478, "ltv130": None}
            }
        },
        "2026 RAV4": {
             "models": ["4430", "4432", "4440", "4442", "4450", "4452", "4477", "4478"],
             "moneyFactors": {
                "tier1": {"ltv110": 0.00263, "ltv120": 0.00288, "ltv130": 0.00328},
                "tier2": {"ltv110": 0.00283, "ltv120": 0.00308, "ltv130": 0.00376},
                "tier3": {"ltv110": 0.00318, "ltv120": 0.00363, "ltv130": 0.00423},
                "tier4": {"ltv110": 0.00393, "ltv120": 0.00463, "ltv130": None}
             }
        }
    },

    # MODELS DB (Snippet of most common ones)
    "models": {
        "1852": {"name": "COROLLA LE", "mrt": 25500, "residuals": {24: 68, 36: 60, 39: 58, 48: 52, 60: 46}},
        "1864": {"name": "COROLLA SE", "mrt": 28100, "residuals": {24: 66, 36: 58, 39: 56, 48: 51, 60: 44}},
        "4430": {"name": "RAV4 LE FWD", "mrt": 30800, "residuals": {24: 70, 36: 62, 39: 60, 48: 53, 60: 47}},
        "4440": {"name": "RAV4 XLE FWD", "mrt": 32300, "residuals": {24: 68, 36: 60, 39: 58, 48: 51, 60: 45}},
        "2559": {"name": "CAMRY HYBRID LE", "mrt": 32000, "residuals": {24: 68, 36: 59, 39: 57, 48: 47, 60: 38}},
        "2561": {"name": "CAMRY HYBRID SE", "mrt": 34100, "residuals": {24: 67, 36: 58, 39: 56, 48: 47, 60: 38}}
    },

    # SPECIAL APR PROGRAMS
    "specialAPRPrograms": {
        "2026 CAMRY HYBRID": {
            "rates": {
                "tier1": {36: 1.99, 48: 2.99, 60: 3.99, 72: 4.99},
                "tier2": {36: 2.99, 48: 3.99, 60: 4.99, 72: 5.99},
                "tier3": {36: 3.99, 48: 4.99, 60: 5.99, 72: 6.99},
                "tier4": {36: 4.99, 48: 5.99, 60: 6.99, 72: 7.99}
            }
        },
        "2026 COROLLA": {
             "rates": {
                "tier1": {36: 2.99, 48: 3.99, 60: 4.99, 72: 5.49},
                "tier2": {36: 3.99, 48: 4.99, 60: 5.99, 72: 6.49},
                "tier3": {36: 4.99, 48: 5.99, 60: 6.99, 72: 7.49},
                "tier4": {36: 5.99, 48: 6.99, 60: 7.99, 72: 8.49}
            }
        }
    },

    "standardRetailRates": {
        "ltvLow": {"740+": 6.24, "720-739": 6.74, "700-719": 7.74, "680-699": 7.99, "660-679": 8.19},
        "ltvMid": {"740+": 6.44, "720-739": 6.89, "700-719": 8.04, "680-699": 8.59, "660-679": 9.59},
        "ltvHigh": {"740+": 8.34, "720-739": 8.79, "700-719": 9.99, "680-699": 11.49, "660-679": 12.49}
    }
}

FLORIDA_FEES = {
    "admin_fee": 695,
    "doc_fee": 799,
    "tag_title_reg": 395,  # Lease
    "tag_title_reg_purchase": 495, # Purchase
    "loan_processing": 399,
    "sales_tax_rate": 0.06
}

# ===========================================
# HELPER FUNCTIONS
# ===========================================

def get_credit_tier_number(score: int) -> int:
    if score >= 720: return 1
    if score >= 680: return 2
    if score >= 650: return 3
    if score >= 600: return 4
    return 4  # Default to 4 if lower

def get_ltv_bucket(ltv: float) -> str:
    if ltv <= 110: return 'ltv110'
    if ltv <= 120: return 'ltv120'
    if ltv <= 130: return 'ltv130'
    return None

def find_model_by_name(input_text: str):
    """Fuzzy search for model code"""
    input_text = input_text.upper()
    best_match = None
    
    # Try looking in our snippet
    for code, data in TOYOTA_FINANCE_DATA["models"].items():
        if data["name"] in input_text or input_text in data["name"]:
            return code, data
            
    # Default fallback if simple match fails
    if "COROLLA" in input_text: return "1852", TOYOTA_FINANCE_DATA["models"]["1852"]
    if "CAMRY" in input_text: return "2559", TOYOTA_FINANCE_DATA["models"]["2559"]
    if "RAV4" in input_text: return "4430", TOYOTA_FINANCE_DATA["models"]["4430"]
    
    return None, None

def find_special_lease_program(model_code, term):
    programs = TOYOTA_FINANCE_DATA["special39MonthPrograms"]
    for prog_name, data in programs.items():
        if "models" in data and model_code in data["models"]:
            return data
    return None

def get_money_factor(model_code, tier, ltv, term):
    tier_key = f"tier{tier}"
    ltv_bucket = get_ltv_bucket(ltv)
    if not ltv_bucket: return 0.00426 # Fallback high
    
    # Special program
    special = find_special_lease_program(model_code, term)
    if special and "moneyFactors" in special:
        mf = special["moneyFactors"].get(tier_key, {}).get(ltv_bucket)
        if mf is not None: return mf
        
    # Standard
    rates = TOYOTA_FINANCE_DATA["standardLeaseRates"]["upTo51Months"]
    mf = rates.get(tier_key, {}).get(ltv_bucket)
    if mf: return mf
    
    return 0.00426 # Fallback

# ===========================================
# MAIN CALCULATOR CLASS
# ===========================================

class CalculatorService:
    
    @staticmethod
    def calculate_lease(model_name: str, credit_score: int, down_payment: float, term: int = 39, mileage: int = 12000):
        """
        Calculates Lease Payment based on Ray's inputs.
        """
        model_code, model_data = find_model_by_name(model_name)
        if not model_data:
            return {"error": f"Model '{model_name}' not found in database."}

        price = model_data["mrt"]
        tier = get_credit_tier_number(credit_score)
        
        # Fees
        admin_fee = TOYOTA_FINANCE_DATA["adminFee"]
        doc_fee = FLORIDA_FEES["doc_fee"]
        tag_title = FLORIDA_FEES["tag_title_reg"]
        
        # Cap Cost
        gross_cap_cost = price + admin_fee
        cap_cost_reduction = down_payment
        adjusted_cap_cost = gross_cap_cost - cap_cost_reduction
        
        # LTV
        ltv = (adjusted_cap_cost / price) * 100
        
        # Residual
        res_key = 36 if term not in model_data["residuals"] else term
        residual_percent = model_data["residuals"].get(res_key, 50)
        
        # Mileage Adj
        if mileage == 12000: residual_percent += 2
        elif mileage == 18000: residual_percent -= 2
        
        residual_value = round(price * (residual_percent / 100))
        
        # Money Factor
        money_factor = get_money_factor(model_code, tier, ltv, term)
        
        # Calc
        depreciation = (adjusted_cap_cost - residual_value) / term
        finance_charge = (adjusted_cap_cost + residual_value) * money_factor
        base_payment = depreciation + finance_charge
        
        monthly_tax = base_payment * TOYOTA_FINANCE_DATA["standardLeaseRates"].get("salesTaxRate", 0.06)
        total_payment = base_payment + monthly_tax
        
        due_at_signing = down_payment + doc_fee + tag_title + total_payment

        return {
            "model": model_data["name"],
            "msrp": price,
            "term": term,
            "mileage": mileage,
            "monthly_payment": round(total_payment),
            "due_at_signing": round(due_at_signing),
            "residual_value": residual_value,
            "money_factor": money_factor,
            "details": f"Based on Score {credit_score} (Tier {tier}), {mileage} miles/yr"
        }

    @staticmethod
    def calculate_finance(model_name: str, credit_score: int, down_payment: float, term: int = 60):
        """
        Calculates Finance Payment (Purchase).
        """
        model_code, model_data = find_model_by_name(model_name)
        if not model_data:
            return {"error": f"Model '{model_name}' not found."}
            
        price = model_data["mrt"]
        
        # Fees
        fees = FLORIDA_FEES["doc_fee"] + FLORIDA_FEES["tag_title_reg_purchase"] + FLORIDA_FEES["loan_processing"]
        sales_tax = price * FLORIDA_FEES["sales_tax_rate"]
        
        total_price = price + fees + sales_tax
        amount_financed = total_price - down_payment
        
        # APR
        # Simple lookup for now based on score
        apr = 6.99
        if credit_score >= 740: apr = 5.99
        elif credit_score < 650: apr = 12.99
        
        # Monthly
        monthly_rate = (apr / 100) / 12
        if monthly_rate == 0:
            payment = amount_financed / term
        else:
            payment = amount_financed * (monthly_rate * (1 + monthly_rate)**term) / ((1 + monthly_rate)**term - 1)
            
        return {
            "model": model_data["name"],
            "price_with_tax_fees": round(total_price),
            "amount_financed": round(amount_financed),
            "apr_estimated": apr,
            "term": term,
            "monthly_payment": round(payment),
            "due_at_signing": round(down_payment) # Usually just down payment for finance
        }

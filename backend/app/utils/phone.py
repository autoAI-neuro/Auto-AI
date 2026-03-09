import re

def normalize_phone(phone: str) -> str:
    """
    Normalize phone number for comparison.
    - Removes all non-digit characters.
    """
    if not phone:
        return ""
    # Strip everything except digits
    digits = re.sub(r'\D', '', phone)
    return digits


def ensure_country_code(phone: str) -> str:
    """
    Ensure phone number has country code (+1 for USA).
    - If 10 digits (no country code), prepend +1
    - If 11 digits starting with 1, prepend +
    - If already has +, return as-is
    - Otherwise return with + prefix
    """
    if not phone:
        return ""
    
    # If already has +, return as-is
    if phone.startswith('+'):
        return phone
    
    # Strip non-digits for analysis
    digits = re.sub(r'\D', '', phone)
    
    # 10 digits = US number without country code -> add +1
    if len(digits) == 10:
        return f"+1{digits}"
    
    # 11 digits starting with 1 = US number with country code -> add +
    if len(digits) == 11 and digits.startswith('1'):
        return f"+{digits}"
    
    # Otherwise, just add + (international numbers)
    return f"+{digits}"

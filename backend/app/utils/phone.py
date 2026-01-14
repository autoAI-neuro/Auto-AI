import re

def normalize_phone(phone: str) -> str:
    """
    Normalize phone number for comparison.
    - Removes all non-digit characters.
    - Removes leading '1' if country code 1 (USA) and length is 11, to standardize.
    - Actually, for DB matching, we should just strip non-digits.
    """
    if not phone:
        return ""
    # Strip everything except digits
    digits = re.sub(r'\D', '', phone)
    return digits

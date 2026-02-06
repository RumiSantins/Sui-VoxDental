from typing import Optional, Tuple

def is_anterior(tooth_number: int) -> bool:
    """Check if tooth is anterior (Incisors/Canines). 1-3"""
    second_digit = tooth_number % 10
    return 1 <= second_digit <= 3

def is_upper_arch(tooth_number: int) -> bool:
    first_digit = tooth_number // 10
    return first_digit in (1, 2)

def is_lower_arch(tooth_number: int) -> bool:
    first_digit = tooth_number // 10
    return first_digit in (3, 4)

def validate_finding(tooth_number: int, surface: Optional[str], condition: str) -> Tuple[bool, Optional[str]]:
    """
    Validates anatomical consistency.
    Returns (is_valid, warning_message).
    """
    if condition == "missing":
        # Missing teeth don't have surfaces, but if one was dictated, we ignore it or warn?
        # Requirement: "obligatoriamente limpie cualquier valor en surface".
        # This is logic for NLP, but here we validate.
        if surface:
            return True, "Cara ignorada por diente ausente"
        return True, None

    if not surface:
        # Some conditions can exist without specific surface (e.g. Endodoncia, Corona generic)
        return True, None

    surface = surface.lower()
    
    # Surfaces allowed: vestibular, palatina/lingual, mesial, distal.
    # Incisal (Anterior) vs Oclusal (Posterior).

    # Common Logic
    if surface in ["vestibular", "mesial", "distal"]:
        return True, None

    # Oclusal Logic
    if surface == "oclusal":
        if is_anterior(tooth_number):
            return False, "Inconsistencia anatómica detectada: 'Oclusal' no existe en dientes anteriores."
        return True, None

    # Incisal Logic
    if surface == "incisal":
        if not is_anterior(tooth_number):
            return False, "Inconsistencia anatómica detectada: 'Incisal' no existe en dientes posteriores."
        return True, None

    # Palatina vs Lingual Logic
    # Dientes 11-13, 21-23, 31-33, 41-43 (Anteriores) allow both? 
    # Requirement: "Dientes ... (Anteriores): Solo permiten ... Palatina/Lingual"
    # Strict rule: Palatina -> Upper, Lingual -> Lower?
    # Context says "Permiten las mismas caras". 
    # Let's keep the arch check for precision.
    
    if surface == "palatina":
        if is_lower_arch(tooth_number):
            return False, "Inconsistencia anatómica detectada: 'Palatina' no existe en la arcada inferior."
        return True, None

    if surface == "lingual":
        if is_upper_arch(tooth_number):
            return False, "Inconsistencia anatómica detectada: 'Lingual' no existe en la arcada superior."
        return True, None
        
    return True, None

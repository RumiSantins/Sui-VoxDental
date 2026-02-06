import re
from typing import List, Optional
from pydantic import BaseModel
from .validator import validate_finding

class FindingInput(BaseModel):
    tooth_number: int
    surface: Optional[str] = None
    condition: str
    warning: Optional[str] = None

def normalize_text(text: str) -> str:
    """Normalize text for easier regex matching."""
    return text.lower()

def extract_findings_from_text(text: str) -> List[FindingInput]:
    """
    Parses dental dictation text and extracts findings.
    Handles compound sentences and 'missing' condition logic.
    """
    normalized_text = normalize_text(text)
    findings = []
    
    # 1. Identify "Missing" keywords first as they override surfaces
    missing_keywords = ["ausencia", "ausente", "faltante", "extraído", "extraido"]
    
    # 2. Other Conditions
    # "caries", "amalgama", "resina", "corona", "endodoncia"
    other_conditions = ["caries", "carias", "amalgama", "resina", "recina", "corona", "endodoncia", "borrar", "limpiar", "eliminar"]
    
    # Surfaces
    surfaces_pattern = r"(oclusal|incisal|mesial|distal|vestibular|palatina|lingual)"
    tooth_pattern = r"\b([1-4][1-8])\b"
    
    # Combine all condition keywords for segmentation
    all_conditions = missing_keywords + other_conditions
    conditions_regex = "(" + "|".join(all_conditions) + ")"
    
    # Find all matches of conditions to identify segments
    condition_matches = list(re.finditer(conditions_regex, normalized_text))
    
    if not condition_matches:
        return []

    for i, match in enumerate(condition_matches):
        raw_condition = match.group(1)
        start_idx = match.end()
        end_idx = condition_matches[i+1].start() if i + 1 < len(condition_matches) else len(normalized_text)
        
        segment = normalized_text[start_idx:end_idx]
        
        # Determine standardized condition name
        if raw_condition in missing_keywords:
            condition_std = "ausente"
        elif raw_condition == "recina":
             condition_std = "resina"
        elif raw_condition == "carias":
             condition_std = "caries"
        elif raw_condition in ["borrar", "limpiar", "eliminar"]:
             condition_std = "borrar"
        else:
            condition_std = raw_condition
            
        # Parse Segment (Forward)
        surfaces = re.findall(surfaces_pattern, segment)
        teeth = re.findall(tooth_pattern, segment)
        
        # fallback: check PREVIOUS segment if no teeth found (Postfix notation support)
        # e.g. "Diente 46 ausente" -> Match "ausente", teeth in pre-segment
        if not teeth:
            prev_end = condition_matches[i-1].end() if i > 0 else 0
            # Look at text from previous match end up to current match start
            pre_segment = normalized_text[prev_end : match.start()]
            
            # Only use pre-segment teeth if they weren't "claimed" by previous condition?
            # Actually, standard segmentation assigns text AFTER match to that match. 
            # So text BEFORE this match was assigned to PREVIOUS match.
            # But if previous match had NO teeth in its post-segment (or was start of string), maybe we can claim it?
            # OR simpler: The user might say "46 ausente". 46 is in the 'void' before the first match.
            
            teeth_pre = re.findall(tooth_pattern, pre_segment)
            if teeth_pre:
                teeth = teeth_pre
                # Note: We don't look for surfaces in pre-segment for now, assuming "ausente" overrides them.
                
        if not teeth:
            continue
            
        # "Missing" logic: Force surface to None
        if condition_std == "ausente":
            current_surfaces = [None]
        else:
            current_surfaces = surfaces if surfaces else [None]
        
        for tooth in teeth:
            tooth_num = int(tooth)
            for surface in current_surfaces:
                
                is_valid, warning = validate_finding(tooth_num, surface, condition_std)
                
                # If invalid, we still add it but with a warning? 
                # Or we reject it? The prompt says "JSON debe incluir un campo warning".
                # So we add it.
                
                finding = FindingInput(
                    tooth_number=tooth_num,
                    surface=surface,
                    condition=condition_std,
                    warning=warning
                )
                findings.append(finding)

    return findings

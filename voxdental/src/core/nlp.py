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
    text = text.lower()
    # Remove punctuation that might break exact word matches or spacing logic
    text = re.sub(r'[,\.\-;:!¡¿\?]+', ' ', text)
    # Handle common Spanish number transcriptions for dental quadrants
    replacements = {
        "cuarenta y uno": "41", "cuarenta y dos": "42", "cuarenta y tres": "43", "cuarenta y cuatro": "44",
        "cuarenta y cinco": "45", "cuarenta y seis": "46", "cuarenta y siete": "47", "cuarenta y ocho": "48",
        "treinta y uno": "31", "treinta y dos": "32", "treinta y tres": "33", "treinta y cuatro": "34",
        "treinta y cinco": "35", "treinta y seis": "36", "treinta y siete": "37", "treinta y ocho": "38",
        "veintiuno": "21", "veintidós": "22", "veintitres": "23", "veinticuatro": "24",
        "veinticinco": "25", "veintiseis": "26", "veintisiete": "27", "veintiocho": "28",
        "40 yocho": "48", "40 y ocho": "48", "yocho": "ocho", # Special messy cases
        "yuno": " y uno", "ydos": " y dos", "ytres": " y tres", "ycuatro": " y cuatro",
        "ycinco": " y cinco", "yseis": " y seis", "ysiete": " y siete", "yocho": " y ocho",
        "once": "11", "onze": "11", "onza": "11", "onsen": "11", "oce": "11", # Mis-transcriptions for 11
        "surifuera": "sui fuera", "surifuere": "sui fuera", "suifuera": "sui fuera", # More messy stop cases
        "soy fuera": "sui fuera", "soi fuera": "sui fuera", # "Soy" mis-transcription
        "doce": "12", "dose": "12", "donce": "12",
        "trece": "13", "trese": "13", "tense": "13",
        "catorce": "14", "catorse": "14", "cantorce": "14",
        "quince": "15", "kinse": "15", "quinse": "15", "quinta": "15", "la quinta": "15",
        "dieciséis": "16", "dieciseis": "16", "diesisseis": "16", "dsis": "16",
        "diecisiete": "17", "diesisiete": "17",
        "dieciocho": "18", "diesiocho": "18",
        # Phonetic surface corrections (Vosk mistakes)
        "messi el": "mesial", "messiel": "mesial", "mesias": "mesial", "me cial": "mesial", "especial": "mesial", "mecial": "mesial", "mesia": "mesial", "mesini": "mesial",
        "crucial": "oclusal", "plusal": "oclusal", "ok lusal": "oclusal", "ocusal": "oclusal", "oculus sal": "oclusal", "oclu sal": "oclusal", "oclusan": "oclusal", "clusal": "oclusal",
        "insisal": "incisal", "en sisal": "incisal", "in sisal": "incisal", "inicial": "incisal",
        "cristal": "distal", "listal": "distal", "distan": "distal",
        "bestibular": "vestibular", "estimular": "vestibular", "destibular": "vestibular",
        "gelatina": "palatina", "latina": "palatina", "colatina": "palatina", "pa latina": "palatina",
        "igual": "lingual", "lenguaje": "lingual", "lingüal": "lingual",
        # Phonetic condition corrections
        "al magma": "amalgama", "un magma": "amalgama", "amalgaba": "amalgama",
        "aucente": "ausente", "recina": "resina",
        "prótecis": "prótesis", "protecis": "prótesis", "protección": "prótesis",
        "protecís": "prótesis", "prótecís": "prótesis"
    }
    
    # Sort replacements by length descending to match longer phrases first
    sorted_replacements = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)
    
    for word, num in sorted_replacements:
        # Use word boundaries to avoid partial matches (e.g. 'oce' matching inside 'doce')
        pattern = r'\b' + re.escape(word) + r'\b'
        text = re.sub(pattern, num, text)
        
    # 1. First, replace all digit words with actual numbers (un-spaced)
    digit_words = {"uno":"1", "dos":"2", "tres":"3", "cuatro":"4", "cinco":"5", "seis":"6", "siete":"7", "ocho":"8"}
    for w, d in digit_words.items():
        # Use regex to replace only whole words
        text = re.sub(fr'\b{w}\b', d, text)
        
    # 2. Nueva Lógica de Numeración "Dos Seis"
    # Identificar pares de números hablados (ej "2 6") y pegarlos ("26") si corresponden a FDI [11-48sin0ni9]
    text = re.sub(r'\b([1-4])\s+([1-8])\b', r'\1\2', text)
    
    # 3. Context-aware rescue for dangerous_glued acronyms followed by tooth numbers.
    # e.g. Whisper merges "a l 33" → "al treinta y tres" → after digit replacement → "al 33"
    # Map: (glued_word) → ACRONYM token
    glued_rescues = [
        (r'\bal\b', 'ACRONYM_AL'),
        (r'\bad\b', 'ACRONYM_AD'),
        (r'\bam\b', 'ACRONYM_AM'),
        (r'\bap\b', 'ACRONYM_AP'),
        (r'\bco\b', 'ACRONYM_CO'),
        (r'\bcd\b', 'ACRONYM_CD'),
        (r'\bcl\b', 'ACRONYM_CL'),
        (r'\bsl\b', 'ACRONYM_CL'),  # s→c phonetic
        (r'\bsd\b', 'ACRONYM_CD'),  # s→c phonetic
    ]
    for pattern, replacement in glued_rescues:
        # Only rescue if followed (within a few tokens) by a valid tooth number [11-48]
        rescue_pattern = pattern[:-3] + r'(?=\s+(?:[1-4][1-8]|' \
            r'treinta|cuarenta|veinti|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintiuno|' \
            r'once|doce|trece|catorce|quince|diecis|diecio' \
            r'))\b'
        text = re.sub(rescue_pattern, replacement, text)

    return text

def decode_acronym(acronym: str) -> tuple:
    # Returns (condition, surface)
    cond_map = {
        'R': 'resina', 'C': 'caries', 'A': 'amalgama', 
        'E': 'endodoncia', 'EX': 'extraer', 'CR': 'corona', 
        'X': 'ausente', 'B': 'borrar',
        'IMP': 'implante', 'DN': 'denticion_ninos',
        'PT': 'protesis_total', 'PP': 'protesis_parcial'
    }
    surf_map = {
        'O': 'oclusal', 'I': 'incisal', 'M': 'mesial', 
        'D': 'distal', 'V': 'vestibular', 'P': 'palatina', 'L': 'lingual'
    }
    if acronym in cond_map:
        return cond_map[acronym], None
    
    # Check for condition + surface combination
    for cond_acr in cond_map.keys():
        if acronym.startswith(cond_acr):
            surf_acr = acronym[len(cond_acr):]
            if surf_acr in surf_map:
                return cond_map[cond_acr], surf_map[surf_acr]
                
    return "", None

def extract_findings_from_text(text: str, context_tooth: Optional[int] = None) -> List[FindingInput]:
    normalized_text = normalize_text(text)
    findings = []
    
    # 1. Stop Commands
    stop_phrases = ["sui fuera", "suí fuera", "chao sui", "parar sui", "shui fuera", "soy fuera", "soi fuera"]
    if any(phrase in normalized_text for phrase in stop_phrases):
        return [FindingInput(condition="stop_system", tooth_number=0)]

    # 2. Dynamic Acronym Mapping (Exhaustive Phonetic Generation)
    def generate_acronyms():
        reps = []
        
        # Phonetic components
        PR = r"(?:erre|re|r)"
        PC = r"(?:ce|se|c|s)"
        PA = r"(?:a|ah|á)"
        PB = r"(?:be|ve|b|v)"
        
        SO = r"(?:o|oh|ó)"
        SI = r"(?:i|y|í)"
        SM = r"(?:eme|me|m)"
        SD = r"(?:de|d)"
        SV = r"(?:ve|be|v|b|uve)"
        SP = r"(?:pe|p)"
        SL = r"(?:ele|le|l)"
        
        prefixes = [('R', PR), ('C', PC), ('A', PA), ('B', PB)]
        suffixes = [('O', SO), ('I', SI), ('M', SM), ('D', SD), ('V', SV), ('P', SP), ('L', SL)]
        
        # Exceptions that shouldn't match as glued words (to avoid Spanish collisions)
        # e.g. "al" (to the), "so" (so), "ad", "co"
        dangerous_glued = ["al", "co", "so", "ad", "am", "ap", "cl", "sl", "cd", "sd"]
        
        for p_id, p_regex in prefixes:
            for s_id, s_regex in suffixes:
                # 1. Match spaced combinations with optional "e" connector (e.g. "erre o", "erre e eme", "c e v")
                # Spaced: "erre eme"
                reps.append((fr"\b{p_regex}\s+{s_regex}\b", f"ACRONYM_{p_id}{s_id}"))
                # Spaced with "e": "erre e eme"
                reps.append((fr"\b{p_regex}\s+e\s+{s_regex}\b", f"ACRONYM_{p_id}{s_id}"))
                
                # 2. Match glued exact letters (e.g. "ro", "cv", "rm") IF not dangerous
                glued = f"{p_id.lower()}{s_id.lower()}"
                if glued not in dangerous_glued:
                    reps.append((fr"\b{glued}\b", f"ACRONYM_{p_id}{s_id}"))

        # Extra common glued mis-transcriptions
        extras = [
            ("reo", "RO"), ("ceo", "CO"), ("seo", "CO"), ("cero", "CO"),
            ("cel", "CL"), ("sel", "CL"), ("veo", "BO"), ("beo", "BO"),
            ("reve", "RV"), ("reeve", "RV"), ("rebe", "RV"), ("reebe", "RV"),
            ("have", "AV"), ("habe", "AV"), ("ave", "AV"), ("abe", "AV")
        ]
        for word, acr in extras:
            reps.append((fr"\b{word}\b", f"ACRONYM_{acr}"))

        # Standalones (Aggressive match for single letters)
        reps.extend([
            (r"\b(ce\s*erre|ce\s*re|se\s*erre|se\s*re|c\s*r|s\s*r|cr|sr)\b", "ACRONYM_CR"),
            (r"\b(e\s*equis|e\s*x|eh\s*equis|eh\s*x|ex)\b", "ACRONYM_EX"),
            (r"\b(equis|x|ekis)\b", "ACRONYM_X"),
            (r"\b(e|eh|hé|he)\b", "ACRONYM_E"),
            (r"\b(be|ve|b|v)\b", "ACRONYM_B")
        ])
        
        # Sort replacements so longer spaced patterns match before shorter singles
        return reps

    acronym_replacements = generate_acronyms()

    # --- New: Map Full Keywords to Acronyms for Natural Language Support ---
    # Conditions
    cond_words = {
        "resina": "R", "caries": "C", "amalgama": "A", "endodoncia": "E",
        "extracción": "EX", "extraer": "EX", "corona": "CR", "ausente": "X",
        "ausencia": "X", "borrar": "B", "limpiar": "B",
        "implante": "IMP", "implantes": "IMP",
        "prótesis total": "PT", "protesis total": "PT", "prótesis totales": "PT", "protesis totales": "PT",
        "prótesis parcial": "PP", "protesis parcial": "PP", "prótesis parciales": "PP", "protesis parciales": "PP",
        "dentición niños": "DN", "denticion niños": "DN", "dentición de niño": "DN", "denticion de niño": "DN",
        "dentición de niños": "DN", "denticion de niños": "DN",
        "dentición infantil": "DN", "denticion infantil": "DN",
        "diente de leche": "DN", "dientes de leche": "DN",
        "dentición temporal": "DN", "denticion temporal": "DN"
    }
    # Surfaces
    surf_words = {
        "oclusal": "O", "incisal": "I", "mesial": "M", "distal": "D",
        "vestibular": "V", "palatina": "P", "lingual": "L"
    }

    # Use a two-pass approach to handle phrases like "caries mesial" efficiently
    # First, handle composite phrases (Condition + Surface)
    for c_word, c_acr in cond_words.items():
        for s_word, s_acr in surf_words.items():
            # Match "caries mesial", "resina distal", etc.
            pattern = fr"\b{c_word}\s+{s_word}\b"
            normalized_text = re.sub(pattern, f"ACRONYM_{c_acr}{s_acr}", normalized_text)
            # Match inverse "mesial caries" (less common but possible)
            pattern_inv = fr"\b{s_word}\s+{c_word}\b"
            normalized_text = re.sub(pattern_inv, f"ACRONYM_{c_acr}{s_acr}", normalized_text)

    # Second, handle standalone conditions (some imply a default surface later in logic)
    for word, acr in cond_words.items():
        # Match only if not already part of an ACRONYM_ token
        normalized_text = re.sub(fr"\b{word}\b(?!\s*[_])", f"ACRONYM_{acr}", normalized_text)

    for pattern, replacement in acronym_replacements:
        normalized_text = re.sub(pattern, replacement, normalized_text)

    # 3. Extract Findings
    acronym_matches = list(re.finditer(r"ACRONYM_([A-Z]+)", normalized_text))
    
    for i, match in enumerate(acronym_matches):
        acronym = match.group(1)
        condition_std, surface = decode_acronym(acronym)
        if not condition_std:
            continue
            
        # Segment between this acronym and the next one
        curr_start = match.start()
        curr_end = match.end()
        next_start = acronym_matches[i+1].start() if i+1 < len(acronym_matches) else len(normalized_text)
        prev_end = acronym_matches[i-1].end() if i > 0 else 0
        
        # Look for teeth in:
        # A. Segment AFTER acronym (Traditional: "X 26")
        segment_after = normalized_text[curr_end:next_start]
        # B. Segment BEFORE acronym (Natural: "26 ausente")
        segment_before = normalized_text[prev_end:curr_start]
        
        teeth_matches = re.findall(r"\b([1-4][1-8])\b", segment_after + " " + segment_before)
        teeth = list(dict.fromkeys(teeth_matches)) # Unique preserving order
        
        # Look even further ahead if still empty
        if not teeth and i + 1 < len(acronym_matches):
            future_start = acronym_matches[i+1].end()
            future_end = acronym_matches[i+2].start() if i+2 < len(acronym_matches) else len(normalized_text)
            segment_future = normalized_text[future_start:future_end]
            teeth_matches_future = re.findall(r"\b([1-4][1-8])\b", segment_future)
            if teeth_matches_future:
                 teeth = teeth_matches_future
                 
        if not teeth and context_tooth:
            teeth = [str(context_tooth)]
            
        if not teeth:
            continue
            
        for tooth in teeth:
            tooth_num = int(tooth)
            
            # Auto-assign surface for partial acronyms on localized conditions
            if surface is None and condition_std in ["caries", "resina", "amalgama"]:
                from .validator import is_anterior
                surface = "incisal" if is_anterior(tooth_num) else "oclusal"
                
            # Full-tooth findings implicitly have no specific surface
            if condition_std in ["endodoncia", "extraer", "corona", "ausente", "borrar", "implante", "denticion_ninos", "protesis_total", "protesis_parcial"]:
                surface = None
                
            is_valid, warning = validate_finding(tooth_num, surface, condition_std)
            findings.append(FindingInput(
                tooth_number=tooth_num,
                surface=surface,
                condition=condition_std,
                warning=warning
            ))

    return findings

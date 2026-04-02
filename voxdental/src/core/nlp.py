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
        "al magma": "amalgama", "un magma": "amalgama"
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
        
    # 2. Handle 'punto' (decimal format)
    # Case: "1 punto 4" -> "14"
    text = re.sub(r'\b([1-4])\s*(?:\.|punto|ponto|punt|pe)\s*([1-8])\b', r'\1\2', text)
    
    # Case: "1 . 4" (already done above)
    
    return text

def decode_acronym(acronym: str) -> tuple:
    # Returns (condition, surface)
    cond_map = {
        'R': 'resina', 'C': 'caries', 'A': 'amalgama', 
        'E': 'endodoncia', 'EX': 'atraer', 'CR': 'corona', 
        'X': 'ausente', 'B': 'borrar'
    }
    surf_map = {
        'O': 'oclusal', 'I': 'incisal', 'M': 'mesial', 
        'D': 'distal', 'V': 'vestibular', 'P': 'palatina', 'L': 'lingual'
    }
    if acronym in ['E', 'X', 'EX', 'CR', 'B']:
        return cond_map[acronym], None
    if len(acronym) == 2:
        return cond_map.get(acronym[0], ''), surf_map.get(acronym[1], None)
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

    for pattern, replacement in acronym_replacements:
        normalized_text = re.sub(pattern, replacement, normalized_text)

    # 3. Extract Findings
    acronym_matches = list(re.finditer(r"ACRONYM_([A-Z]{1,2})", normalized_text))
    
    for i, match in enumerate(acronym_matches):
        acronym = match.group(1)
        condition_std, surface = decode_acronym(acronym)
        if not condition_std:
            continue
            
        start_idx = match.end()
        end_idx = acronym_matches[i+1].start() if i+1 < len(acronym_matches) else len(normalized_text)
        segment = normalized_text[start_idx:end_idx]
        
        teeth_matches = re.findall(r"\b([1-4][1-8])\b", segment)
        teeth = [m for m in teeth_matches]
        
        # Look ahead for teeth if none in current segment
        if not teeth and i + 1 < len(acronym_matches):
            next_start = acronym_matches[i+1].end()
            next_end = acronym_matches[i+2].start() if i+2 < len(acronym_matches) else len(normalized_text)
            next_segment = normalized_text[next_start:next_end]
            teeth_matches_next = re.findall(r"\b([1-4][1-8])\b", next_segment)
            if teeth_matches_next:
                 teeth = teeth_matches_next
                 
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
                
            is_valid, warning = validate_finding(tooth_num, surface, condition_std)
            findings.append(FindingInput(
                tooth_number=tooth_num,
                surface=surface,
                condition=condition_std,
                warning=warning
            ))

    return findings

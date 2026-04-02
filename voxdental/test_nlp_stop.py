import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

try:
    from core.nlp import extract_findings_from_text
    
    test_phrases = [
        "¡Chao sui!",
        "Sui fuera.",
        "Soy fuera",
        "Suri fuera",
        "Ciao, sui",
        "Parar Sui"
    ]
    
    print("Testing NLP Stop Commands...")
    for phrase in test_phrases:
        findings = extract_findings_from_text(phrase)
        stop_found = any(f.condition == "stop_system" for f in findings)
        print(f"Phrase: '{phrase}' -> Stop Detected: {stop_found}")
        if stop_found:
             print(f"  Findings: {findings}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

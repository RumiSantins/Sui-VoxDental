from src.core.nlp import extract_findings_from_text
import json

def run_demo():
    test_phrases = [
        "Caries en oclusal de la 16", # Valid
        "Ausencia de la 18",           # Valid missing, surface cleared
        "Caries en incisal de la 11",  # Valid anterior incisal
        "Caries en oclusal de la 11",  # Invalid (Warning: Oclusal on Anterior)
        "Resina en palatina de la 36"  # Invalid (Warning: Palatina on Lower)
    ]
    
    print("--- Sui MVP Logic Demo ---\n")
    
    for phrase in test_phrases:
        print(f"Input: '{phrase}'")
        findings = extract_findings_from_text(phrase)
        
        # Use model_dump() for Pydantic V2 compatibility
        output = [f.model_dump(exclude_none=True) for f in findings]
        print(f"Output: {json.dumps(output, indent=2, ensure_ascii=False)}\n")

if __name__ == "__main__":
    run_demo()

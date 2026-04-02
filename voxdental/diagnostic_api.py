import requests
import os

def test_api():
    url = "http://localhost:8000/api/v1/clinical/voice-entry"
    # Create a dummy small wav file or use an existing one if possible
    # For now, let's just check if the server is up
    try:
        r = requests.get("http://localhost:8000/")
        print(f"Root check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Could not connect to backend: {e}")
        return

    # Check whisper service status by sending a fake request or checking main log
    # But I can't check logs easily.
    # Let's try to send a very small file.
    
    # Generate a tiny dummy file (1 second of silence) if not exists
    # Or just use demo.py to test NLP
    from src.core.nlp import extract_findings_from_text
    print(f"NLP Test: {extract_findings_from_text('caries en oclusal de la 16')}")

if __name__ == "__main__":
    test_api()

import os
import smtplib
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

print(f"Testing SMTP with: {SMTP_HOST}:{SMTP_PORT} User: {SMTP_USER}")

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        print("SUCCESS: SMTP Login working!")
except Exception as e:
    print(f"FAILURE: SMTP Error: {e}")

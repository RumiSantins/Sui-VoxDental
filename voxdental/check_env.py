from src.core.email_service import SMTP_USER, SMTP_HOST
import os

print(f"SMTP Host: {SMTP_HOST}")
print(f"SMTP User: {SMTP_USER}")
print(f"ENV SMTP_USER: {os.getenv('SMTP_USER')}")

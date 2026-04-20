import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")

def send_verification_email(email: str, token: str, full_name: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("WARNING: SMTP credentials not set. Email not sent.")
        return False

    msg = EmailMessage()
    msg["Subject"] = "Verifica tu cuenta en VoxDental"
    msg["From"] = f"VoxDental <{SMTP_USER}>"
    msg["To"] = email

    verification_link = f"{BASE_URL}/verify?token={token}"
    
    text_content = f"Hola {full_name},\n\nGracias por registrarte en VoxDental. Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:\n{verification_link}"
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">¡Bienvenido a VoxDental!</h2>
          <p>Hola <strong>{full_name}</strong>,</p>
          <p>Gracias por unirte a nuestra plataforma. Para comenzar, por favor verifica tu dirección de correo electrónico:</p>
          <a href="{verification_link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Verificar mi cuenta</a>
          <p style="font-size: 11px; color: #777;">{verification_link}</p>
        </div>
      </body>
    </html>
    """

    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False

def send_feedback_email(name: str, sender_email: str, comment: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("WARNING: SMTP credentials not set. Feedback email not sent.")
        return False

    msg = EmailMessage()
    msg["Subject"] = f"Nuevo comentario de {name} - EgoS"
    msg["From"] = f"EgoS Feedback <{SMTP_USER}>"
    msg["To"] = "rumi.04.se@gmail.com"

    text_content = f"Nuevo comentario recibido en EgoS:\n\nDe: {name}\nCorreo: {sender_email}\nComentario:\n{comment}"
    
    html_content = f"""
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #9CCBA8; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Nuevo Feedback</h2>
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Has recibido un nuevo mensaje a través del formulario:</p>
          <div style="margin: 20px 0; font-size: 14px;">
            <p><strong>Nombre:</strong> {name}</p>
            <p><strong>Email:</strong> {sender_email}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 20px 0;">
            <p style="white-space: pre-wrap; font-style: italic; color: #1e293b;">"{comment}"</p>
          </div>
        </div>
      </body>
    </html>
    """

    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending feedback email: {e}")
        return False

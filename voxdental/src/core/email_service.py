import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
        print(f"Token for {email}: {token}")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "Verifica tu cuenta en VoxDental"
    message["From"] = f"VoxDental <{SMTP_USER}>"
    message["To"] = email

    verification_link = f"{BASE_URL}/verify?token={token}"

    text = f"Hola {full_name},\n\nGracias por registrarte en VoxDental. Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:\n{verification_link}"
    
    html = f"""
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">¡Bienvenido a VoxDental!</h2>
          <p>Hola <strong>{full_name}</strong>,</p>
          <p>Gracias por unirte a nuestra plataforma de odontogramas manos libres. Para comenzar, por favor verifica tu dirección de correo electrónico:</p>
          <a href="{verification_link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Verificar mi cuenta</a>
          <p style="font-size: 12px; color: #777;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="font-size: 11px; color: #777;">{verification_link}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, email, message.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

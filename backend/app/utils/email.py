import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Configuration
# En un entorno real, estos deberían ir en .env
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "autoai.neuro@gmail.com"
SMTP_PASSWORD = "gbqq gppo ebia kggj" # App Password

def send_email(to_email: str, subject: str, body: str, reply_to: str = None):
    """
    Sends an email using the system Gmail account.
    If reply_to is provided, replies will go there instead of the system account.
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"AutoAI System <{SMTP_USER}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        if reply_to:
            msg['Reply-To'] = reply_to
            
        msg.attach(MIMEText(body, 'html'))
        
        # Connect to server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        # Send
        text = msg.as_string()
        server.sendmail(SMTP_USER, to_email, text)
        server.quit()
        
        print(f"[Email] Sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"[Email] Failed to send email to {to_email}: {str(e)}")
        return False

from app.utils.email import send_email, SMTP_USER

print(f"Testing email sending from {SMTP_USER}...")
success = send_email(
    to_email=SMTP_USER, # Send to self
    subject="Test Manual desde Backend LOCAl",
    body="<h1>Funciona!</h1><p>El sistema de correo está operativo.</p>"
)

if success:
    print("✅ EMAIL SENT SUCCESSFULLY!")
else:
    print("❌ FAILED TO SEND EMAIL.")

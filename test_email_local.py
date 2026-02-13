import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.utils.email import send_email

print("--- Testing Email Functionality ---")
recipient = "raysanchezsolutions@gmail.com" # Using user email seen in screenshot
subject = "Test Email from AutoAI Debugger"
body = "<h1>Test Email</h1><p>If you receive this, the email configuration is working correctly locally.</p>"

print(f"Sending test email to: {recipient}")
success, message = send_email(recipient, subject, body)

if success:
    print("✅ SUCCESS: Email sent successfully!")
    print(f"Message ID: {message}")
else:
    print("❌ FAILURE: Email sending failed.")
    print(f"Error: {message}")

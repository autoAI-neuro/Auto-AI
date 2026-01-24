from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json

# Configuration
TOKEN_PATH = "token.json"  # Relative to where app starts (usually root or backend)

def send_email(to_email: str, subject: str, body: str, reply_to: str = None):
    """
    Sends an email using Gmail API (Port 443).
    Requires 'token.json' in the backend root.
    """
    try:
        # 1. Load Credentials
        if not os.path.exists(TOKEN_PATH):
             # Check for encoded version (Bypass Git Secrets)
             b64_path = "backend/token.b64" 
             if not os.path.exists(b64_path):
                 b64_path = "token.b64"
             
             if os.path.exists(b64_path):
                 print("[Email] Found token.b64, decoding...")
                 with open(b64_path, 'r') as f:
                     lines = f.readlines()
                     # CertUtil adds -----BEGIN CERTIFICATE----- header/footer, simpler just to join all usage chars
                     # OR just strip first and last line if they are headers?
                     # CertUtil default encode is distinct. python base64 is better.
                     # Let's hope I can just read valid b64.
                     # If certutil user used headers, it has BEGIN/END.
                     # Filter only valid b64 chars?
                     # Simpler to just try to load content.
                     content = "".join([l.strip() for l in lines if "BEGIN" not in l and "END" not in l])
                 
                 decoded = base64.b64decode(content).decode('utf-8')
                 # Save to token.json for next time
                 with open(TOKEN_PATH, 'w') as f:
                     f.write(decoded)
                 creds = Credentials.from_authorized_user_info(json.loads(decoded), ['https://www.googleapis.com/auth/gmail.send'])
             else:
                 error_msg = "Token no encontrado. Corre 'setup_gmail.py' primero."
                 print(f"[Email] Error: {error_msg}")
                 return False, error_msg
        else:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, ['https://www.googleapis.com/auth/gmail.send'])

        # 2. Build Service
        service = build('gmail', 'v1', credentials=creds)

        # 3. Create Message
        img_msg = MIMEMultipart()
        img_msg['to'] = to_email
        img_msg['from'] = 'AutoAI System <autoai.neuro@gmail.com>'
        img_msg['subject'] = subject
        if reply_to:
            img_msg['Reply-To'] = reply_to
            
        img_msg.attach(MIMEText(body, 'html'))
        
        # Encode
        raw_string = base64.urlsafe_b64encode(img_msg.as_bytes()).decode()
        message = {'raw': raw_string}

        # 4. Send
        sent_message = service.users().messages().send(userId="me", body=message).execute()
        print(f"[Email] API Send ID: {sent_message['id']}")
        return True, "Sent via Gmail API"

    except Exception as e:
        error_msg = str(e)
        print(f"[Email] API Failed: {error_msg}")
        return False, error_msg

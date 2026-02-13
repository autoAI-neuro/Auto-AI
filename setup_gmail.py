import os.path
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# Scope needed to send emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("\n--- AUTOAI GMAIL CONFIG ---")
    print("Copia y pega los datos que descargaste (o de la pantalla):")
    
    client_id = input("1. Pega tu ID DE CLIENTE: ").strip()
    client_secret = input("2. Pega tu SECRETO DEL CLIENTE: ").strip()
    
    config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "project_id": "autoai-mailer",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "redirect_uris": ["http://localhost"]
        }
    }
    
    # Write temp file for the library to read
    with open('credentials_temp.json', 'w') as f:
        json.dump(config, f)
        
    print("\n[INFO] Se abrirá una ventana en tu navegador...")
    print("[INFO] Logueate con 'autoai.neuro@gmail.com' y dale 'Continuar' / 'Permitir'.")
    if os.path.exists('token.json'):
        os.remove('token.json')
        
    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials_temp.json', SCOPES)
        creds = flow.run_local_server(port=0)
        
        # Save the token.json
        with open('backend/token.json', 'w') as token:
            token.write(creds.to_json())
            
        print("\n✅ ¡ÉXITO TOTAL!")
        print("El archivo 'token.json' se ha guardado en la carpeta backend.")
        print("Ahora ya puedo usarlo para enviar correos.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        if os.path.exists('credentials_temp.json'):
            os.remove('credentials_temp.json')

if __name__ == '__main__':
    main()

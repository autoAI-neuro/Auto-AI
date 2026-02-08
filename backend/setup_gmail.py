from google_auth_oauthlib.flow import InstalledAppFlow
import os
import shutil
import base64

# Configuration
CREDENTIALS_PATH = "credentials.json"
TOKEN_PATH = "token.json"
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("--- Gmail API Setup ---")
    
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"❌ ERROR: File '{CREDENTIALS_PATH}' not found.")
        print("Please download your OAuth 2.0 Client ID (JSON) from Google Cloud Console.")
        print(f"Rename it to '{CREDENTIALS_PATH}' and place it in this folder.")
        return

    try:
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        token_json = creds.to_json()
        with open(TOKEN_PATH, 'w') as token:
            token.write(token_json)
            
        print(f"✅ SUCCESS: Token generated and saved to '{TOKEN_PATH}'.")
        
        # Also create base64 version for deployment
        with open(TOKEN_PATH, 'rb') as f:
            content = f.read()
            encoded = base64.b64encode(content).decode('utf-8')
            
        with open("token.b64", "w") as f:
            f.write(encoded)
            
        print("✅ SUCCESS: Encoded token saved to 'token.b64'. Ready valid for deployment.")
        
    except Exception as e:
        print(f"❌ ERROR: Setup failed: {str(e)}")

if __name__ == '__main__':
    main()

import subprocess
import time
import requests
import os
import signal
import sys
import psutil
from datetime import datetime

# Configuration
SERVICES = {
    "backend": {
        "command": ["python", "run.py"],
        "cwd": os.path.abspath("backend"),
        "health_url": "http://127.0.0.1:8000/docs",  # Check docs status as health
        "port": 8000
    },
    "whatsapp": {
        "command": ["npm.cmd", "start"], 
        "cwd": os.path.abspath("whatsapp-service"),
        "health_url": "http://127.0.0.1:3005/health",
        "port": 3005
    },
    "frontend": {
        "command": ["npm.cmd", "run", "dev"],
        "cwd": os.path.abspath("frontend"),
        "health_url": "http://127.0.0.1:3000",
        "port": 3000
    }
}

PROCESSES = {}

def log(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open("ecosystem.log", "a") as f:
            f.write(line + "\n")
    except:
        pass

def kill_process_on_port(port):
    """Find and kill any process using the specified port"""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conn in proc.connections(kind='inet'):
                if conn.laddr.port == port:
                    log(f"Killing process {proc.name()} ({proc.pid}) on port {port}")
                    proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

def start_service(name):
    """Start a service and store its process handle"""
    service = SERVICES[name]
    
    # Ensure port is free
    kill_process_on_port(service["port"])
    
    log(f"Starting {name}...")
    try:
        # Use shell=True for Windows command compatibility, but keep process handle
        PROCESSES[name] = subprocess.Popen(
            service["command"], 
            cwd=service["cwd"],
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE # Open separate window? No, keep hidden for daemon feel, or separate for debug?
            # Let's keep them in this console or hidden. Better: New console for now so user can see logs if needed.
            # Actually, user wants a single window. We will stream output or just let them run in bg.
            # Let's use CREATE_NEW_CONSOLE to prevent them from dying if this script is CTRL+C'd hard
            # But we want to MANAGE them. 
        )
        # Using CREATE_NO_WINDOW might be better for "production feel" but harder to debug.
        # Let's try standard Popen (subprocesses of THIS script).
    except Exception as e:
        log(f"Failed to start {name}: {e}")

def check_health(name):
    """Check if service is responsive"""
    service = SERVICES[name]
    try:
        if name == "frontend":
            # Frontend: DISABLE WATCHDOG. 
            # The dev server (Vite) can be slow to respond during HMR or interaction.
            # Restarting it causes the page to reload, which ruins the UX.
            # We assume it's alive if we started it.
            return True
        else:
            # Backend/WhatsApp: Strict check
            try:
                resp = requests.get(service["health_url"], timeout=5)
                if resp.status_code != 200:
                    return False
            except requests.exceptions.Timeout:
                log(f"⚠️ Service {name} timed out. Considering unhealthy.")
                return False
            except requests.exceptions.ConnectionError:
                return False
                
        return True
    except Exception as e:
        log(f"Health check failed for {name}: {e}")
        return False

def monitor_loop():
    """Main supervision loop"""
    log("AutoAI Ecosystem Supervisor Started")
    log("Press CTRL+C to stop all services")
    
    # 1. Start all
    for name in SERVICES:
        start_service(name)
    
    # 2. Monitor
    while True:
        try:
            time.sleep(15) # Check less frequently
            for name in SERVICES:
                if not check_health(name):
                    log(f"⚠️ Service {name} is UNHEALTHY or DOWN. Restarting...")
                    # Kill old if exists
                    start_service(name)
                    log(f"✅ Service {name} restarted.")
                else:
                    # Optional: log(f"{name} is OK")
                    pass
        except KeyboardInterrupt:
            log("Stopping ecosystem...")
            break
        except Exception as e:
            log(f"Monitor error: {e}")

if __name__ == "__main__":
    monitor_loop()

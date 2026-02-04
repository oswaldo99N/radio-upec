import socketio
import socket
import subprocess
import time
import os
import json
import threading
import sys

# Configuration Files
NETWORK_CONFIG_FILE = 'config.json'
DEVICE_CONFIG_FILE = 'device.json'
VOLUME_CONFIG_FILE = 'volume.json'
RADIO_URL = 'https://grupomundodigital.com:8646/live'
MPV_SOCKET = '/tmp/mpv_socket'

def load_saved_volume():
    """Load saved volume or return 90 as default"""
    if os.path.exists(VOLUME_CONFIG_FILE):
        try:
            with open(VOLUME_CONFIG_FILE, 'r') as f:
                data = json.load(f)
                return data.get('volume', 90)
        except:
            pass
    return 90

def save_volume(volume):
    """Save current volume to persist across restarts"""
    try:
        with open(VOLUME_CONFIG_FILE, 'w') as f:
            json.dump({'volume': int(volume)}, f)
    except Exception as e:
        print(f"Error saving volume: {e}")


def load_network_config():
    """Load network configuration (server URL, device name, auto_play)"""
    if not os.path.exists(NETWORK_CONFIG_FILE):
        print("=" * 50)
        print("ERROR: Archivo de configuración no encontrado")
        print("=" * 50)
        print("")
        print(f"No se encontró '{NETWORK_CONFIG_FILE}'")
        print("")
        print("Por favor ejecuta el script de configuración primero:")
        print("  $ sudo ./configure.sh")
        print("")
        print("O crea manualmente el archivo config.json con:")
        print('{')
        print('  "server_url": "http://IP_DEL_SERVIDOR:3000",')
        print('  "device_name": "Nombre del dispositivo",')
        print('  "auto_play": true')
        print('}')
        print("")
        sys.exit(1)
    
    try:
        with open(NETWORK_CONFIG_FILE, 'r') as f:
            config = json.load(f)
        
        # Validar campos requeridos
        if 'server_url' not in config:
            print("ERROR: 'server_url' no encontrado en config.json")
            sys.exit(1)
        
        print(f"✓ Configuración cargada desde {NETWORK_CONFIG_FILE}")
        print(f"  Servidor: {config['server_url']}")
        if config.get('device_name'):
            print(f"  Nombre: {config['device_name']}")
        
        return config
    except json.JSONDecodeError as e:
        print(f"ERROR: config.json tiene formato JSON inválido: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR al leer config.json: {e}")
        sys.exit(1)

# Load configurations
NETWORK_CONFIG = load_network_config()
SERVER_URL = NETWORK_CONFIG['server_url']
AUTO_PLAY = NETWORK_CONFIG.get('auto_play', True)
CUSTOM_DEVICE_NAME = NETWORK_CONFIG.get('device_name', '')

def get_or_create_device_config():
    """Get or create device-specific config (ID and hostname)"""
    # Load existing config
    if os.path.exists(DEVICE_CONFIG_FILE):
        try:
            with open(DEVICE_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    
    # Create new config
    id = None
    
    # Try to get MAC from various interfaces
    interfaces = ['eth0', 'wlan0', 'en0', 'wlan1']
    for iface in interfaces:
        try:
            path = f"/sys/class/net/{iface}/address"
            if os.path.exists(path):
                id = subprocess.check_output(f"cat {path}", shell=True).decode().strip()
                if id and len(id) > 10: break # Valid MAC found
        except:
            pass
            
    # Fallback to UUID if no MAC found
    if not id:
        import uuid
        id = str(uuid.uuid4())
    
    config = {
        "id": id,
        "name": socket.gethostname()
    }
    
    # Save for persistence
    try:
        with open(DEVICE_CONFIG_FILE, 'w') as f:
            json.dump(config, f)
    except Exception as e:
        print(f"Error saving config: {e}")
    
    return config

DEVICE_CONFIG = get_or_create_device_config()
DEVICE_ID = DEVICE_CONFIG['id']
# Use custom name if provided, otherwise use hostname
DEVICE_NAME = CUSTOM_DEVICE_NAME if CUSTOM_DEVICE_NAME else DEVICE_CONFIG['name']

sio = socketio.Client()

# Global variable to store the volume set by the server
SERVER_VOLUME = None

def start_mpv():
    # Start mpv in idle mode with IPC socket
    # Added buffering options to handle network instability
    cmd = [
        'mpv',
        '--idle',
        f'--input-ipc-server={MPV_SOCKET}',
        '--no-video',
        '--audio-device=alsa/default:CARD=Headphones',  # User verified device
        # Low Latency Settings for Multi-Device Sync
        '--profile=low-latency',         # Optimize for real-time streaming
        '--cache=no',                    # Disable caching to stay at live edge
        '--untimed',                     # Don't try to time frames, just play
        '--audio-buffer=0',              # Minimize audio buffer
        '--demuxer-thread=no',           # Run demuxer in same thread
        '--network-timeout=5',           # Default timeout
        '--gapless-audio=no',            # Don't try to be clever with streams
        '--quiet',
    ]
    # Check if already running
    if os.path.exists(MPV_SOCKET):
        response = send_mpv_command(['get_property', 'idle-active'])
        if response is not None:
             print("MPV already running")
             return
        else:
            print("Cleaning up stale socket...")
            try:
                os.remove(MPV_SOCKET)
            except FileNotFoundError:
                pass
    
    print("Starting MPV...")
    subprocess.Popen(cmd)
    time.sleep(1) # Wait for socket
    
    # Load saved volume or use 90% as default
    saved_vol = load_saved_volume()
    print(f"Setting initial volume to {saved_vol}%")
    send_mpv_command(['set_property', 'volume', saved_vol])

def send_mpv_command(command):
    try:
        data = json.dumps({ 'command': command }) + '\n'
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
            sock.connect(MPV_SOCKET)
            sock.sendall(data.encode())
            # Receive data
            raw_response = sock.recv(4096).decode().strip()
            # MPV might return multiple JSON lines (events), we want the one with 'data' or the result
            for line in raw_response.split('\n'):
                try:
                    msg = json.loads(line)
                    if 'error' in msg and msg['error'] == 'success':
                        if 'data' in msg:
                            return msg['data']
                        return True # Success but no data
                except:
                    pass
            return None
    except Exception as e:
        # print(f"Error sending to MPV: {e}") # Silence spam
        return None

@sio.event
def connect():
    print('✓ Conectado al servidor')
    ip_address = subprocess.check_output(['hostname', '-I']).decode().strip().split(' ')[0]
    
    # Get the current system username
    try:
        username = subprocess.check_output(['whoami']).decode().strip()
    except:
        username = 'pi'  # Default fallback
    
    sio.emit('register_device', {
        'id': DEVICE_ID,
        'name': DEVICE_NAME,
        'ip': ip_address,
        'username': username
    })
    
    # Auto-play después de reconectar si está habilitado
    if AUTO_PLAY:
        print("Reconexión exitosa - Reiniciando reproducción automática...")
        time.sleep(1)  # Wait for registration to complete
        send_mpv_command(['loadfile', RADIO_URL])

@sio.event
def connect_error(data):
    print("⚠ Error de conexión - Reintentando automáticamente...")

@sio.event
def disconnect():
    print('✗ Desconectado del servidor - Reconectando automáticamente...')

def fade_volume(target_vol, duration=1.0, steps=10):
    """Gradually change volume to target value"""
    try:
        current_vol = send_mpv_command(['get_property', 'volume'])
        if current_vol is None:
            current_vol = 90
        else:
            current_vol = float(current_vol)
            
        target_vol = float(target_vol)
        if current_vol == target_vol:
            return

        diff = target_vol - current_vol
        step_val = diff / steps
        delay = duration / steps

        for i in range(steps):
            new_vol = current_vol + (step_val * (i + 1))
            send_mpv_command(['set_property', 'volume', new_vol])
            time.sleep(delay)
            
        # Ensure final value is set exactly
        send_mpv_command(['set_property', 'volume', target_vol])
    except Exception as e:
        print(f"Error fading volume: {e}")

@sio.on('command')
def on_command(data):
    print(f"Received command: {data}")
    action = data.get('action')
    value = data.get('value')

    if action == 'play':
        print("Playing radio...")
        send_mpv_command(['loadfile', RADIO_URL])
    elif action == 'stop':
        print("Stopping radio...")
        send_mpv_command(['stop'])
    elif action == 'set_volume':
        global SERVER_VOLUME
        print(f"Setting volume to {value} (with fade)")
        # Store the server's volume globally
        SERVER_VOLUME = value
        # Save the new volume so it persists across restarts
        save_volume(value)
        # Use a thread so we don't block the socket loop
        threading.Thread(target=fade_volume, args=(value, 0.5)).start()
    elif action == 'announce':
        print(f"📢 ANUNCIO: {value}")
        
        def play_announcement():
            # 0. Get current volume to restore later
            current_vol = 90
            try:
                v = send_mpv_command(['get_property', 'volume'])
                if v: current_vol = float(v)
            except: pass
            
            print(f"Volumen actual: {current_vol}. Iniciando anuncio...")

            # 1. Fade out current audio
            fade_volume(10, 0.5) 
            
            # 2. Load announcement
            send_mpv_command(['loadfile', value])
            
            # 3. Set volume high for speech (immediately)
            send_mpv_command(['set_property', 'volume', 85])
            
            # 4. Wait for announcement to finish (approximate or just let idle-active handle it)
            # The ensure_mpv_running logic will kick in when idle, but we want to pass the restore volume
            # Ideally we'd wait here, but ensure_mpv_running runs on main loop.
            # Hack: Store target volume in a file or global? 
            # Better: Let ensure_mpv_running read a 'restore_volume' intent?
            # Simplest for now: Just let standard restoration happen but we need to pass the volume.
            
            # Actually, ensure_mpv_running is called by main loop. 
            # We can save this volume to a temp file that ensure_mpv_running reads.
            with open('/tmp/restore_volume', 'w') as f:
                f.write(str(current_vol))
            
        threading.Thread(target=play_announcement).start()

def ensure_mpv_running():
    """Check if MPV is running and restart if needed"""
    global SERVER_VOLUME
    
    # Check if we can talk to MPV
    response = send_mpv_command(['get_property', 'idle-active'])
    
    # Determine which volume to restore
    # Priority: 1. SERVER_VOLUME (from server), 2. restore_volume (from announcement), 3. saved volume (local file)
    restore_vol = SERVER_VOLUME if SERVER_VOLUME is not None else load_saved_volume()
    
    # Check if we need to restore volume from an announcement
    if os.path.exists('/tmp/restore_volume'):
        try:
            with open('/tmp/restore_volume', 'r') as f:
                restore_vol = float(f.read().strip())
            os.remove('/tmp/restore_volume')
            print(f"Recuperando volumen anterior: {restore_vol}")
        except: pass

    if response is None:
        print("⚠ MPV no responde - Reiniciando...")
        # Clean up socket if exists
        try:
            os.remove(MPV_SOCKET)
        except OSError:
            pass
        start_mpv()
        time.sleep(2)  # Give it time to start
        
        # Auto-resume radio if configured
        if AUTO_PLAY:
            print(f"Reiniciando reproducción automática (Fade-in a {restore_vol})...")
            send_mpv_command(['set_property', 'volume', 0])
            send_mpv_command(['loadfile', RADIO_URL])
            threading.Thread(target=fade_volume, args=(restore_vol, 3.0)).start()
    
    # Also check if MPV is idle and should be playing
    elif AUTO_PLAY and response is True:
        # MPV is idle (not playing) but should be
        print(f"MPV está en idle - Reiniciando reproducción (Fade-in a {restore_vol})...")
        send_mpv_command(['set_property', 'volume', 0])
        send_mpv_command(['loadfile', RADIO_URL])
        threading.Thread(target=fade_volume, args=(restore_vol, 3.0)).start()

def report_status():
   if not sio.connected: return
   
   # Check idle property
   idle_active = send_mpv_command(['get_property', 'idle-active'])
   # MPV returns true if idle (stopped), false if playing
   is_playing = False
   if idle_active is not None:
       # If idle-active is false, we are playing
       is_playing = (idle_active == False)
   
   # Get volume
   vol = send_mpv_command(['get_property', 'volume'])
   
   # If MPV is stopped/idle, volume might be None. Use SERVER_VOLUME or saved volume instead of default 90
   final_vol = 90
   if vol:
       final_vol = int(float(vol))
   elif SERVER_VOLUME is not None:
       final_vol = SERVER_VOLUME
   else:
       final_vol = load_saved_volume()

   sio.emit('device_status', {
       'is_playing': is_playing,
       'volume': final_vol
   })

def main():
    print("Iniciando cliente Radio UPEC...")
    print(f"Dispositivo: {DEVICE_NAME} ({DEVICE_ID})")
    print(f"Servidor: {SERVER_URL}")
    
    start_mpv()
    
    # Auto-play on start if configured
    if AUTO_PLAY:
        print("Auto-reproducción habilitada, iniciando radio...")
        time.sleep(2)
        send_mpv_command(['loadfile', RADIO_URL])
    else:
        print("Auto-reproducción deshabilitada. Esperando comandos del servidor...")

    reconnect_attempts = 0
    max_reconnect_delay = 30  # Max 30 seconds between reconnect attempts
    
    while True:
        try:
            # Ensure MPV is alive and restart if needed
            ensure_mpv_running()

            # Try to connect if not connected
            if not sio.connected:
                reconnect_attempts += 1
                delay = min(reconnect_attempts * 2, max_reconnect_delay)  # Exponential backoff
                print(f"Intento de reconexión #{reconnect_attempts} (esperando {delay}s)...")
                
                try:
                    sio.connect(SERVER_URL, wait_timeout=10)
                    reconnect_attempts = 0  # Reset counter on successful connection
                except Exception as e:
                    print(f"Reconexión fallida: {e}")
                    time.sleep(delay)
                    continue
            
            # Report status periodically if connected
            if sio.connected:
                report_status()
            
            sio.sleep(5)  # Check every 5 seconds (reduced frequency for stability)
        except KeyboardInterrupt:
            print("\n✓ Deteniendo cliente...")
            break
        except Exception as e:
            print(f"Error en loop principal: {e}")
            print("Reintentando en 5 segundos...")
            time.sleep(5)

if __name__ == '__main__':
    main()

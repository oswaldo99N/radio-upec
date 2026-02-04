# 🔄 Mejoras de Reconexión Automática - Radio UPEC

## ✅ Mejoras Implementadas

### 1. **Reconexión Automática Infinita**

El cliente ahora **NUNCA se rinde** intentando reconectar. Siempre intentará volver a conectarse automáticamente.

**Características:**

- ✅ Reintentos infinitos (no hay límite)
- ✅ **Exponential backoff**: Aumenta el tiempo entre intentos gradualmente
  - Intento 1: 2 segundos
  - Intento 2: 4 segundos
  - Intento 3: 6 segundos
  - ...hasta máximo 30 segundos
- ✅ Resetea el contador cuando se reconecta exitosamente
- ✅ Mensajes claros en español sobre el estado de reconexión

---

### 2. **Auto-Play Después de Reconectar**

Cuando el dispositivo se reconecta al servidor, **automáticamente reanuda la reproducción** (si `auto_play: true` en config.json).

**Antes:**

- Se reconectaba pero quedaba en silencio
- Había que darle "play" manualmente desde el panel

**Ahora:**

- Se reconecta Y empieza a reproducir automáticamente
- No requiere intervención manual

---

### 3. **Detección y Recuperación de MPV**

El cliente ahora detecta si MPV está:

1. **No respondiendo** → Lo reinicia automáticamente
2. **En idle (sin reproducir)** → Lo reanuda automáticamente

**Revisa cada 5 segundos:**

```python
# Si MPV no responde
→ Reinicia MPV
→ Auto-reproduce si AUTO_PLAY está habilitado

# Si MPV está en idle pero debería estar reproduciendo
→ Reanuda la reproducción automáticamente
```

---

### 4. **Mensajes Mejorados**

Todos los mensajes ahora están en **español** y usan **iconos** para claridad:

- ✓ Conectado al servidor
- ✗ Desconectado del servidor - Reconectando automáticamente...
- ⚠ Error de conexión - Reintentando automáticamente...
- ⚠ MPV no responde - Reiniciando...

---

## 📝 Cambios Específicos en el Código

### Cambio 1: Handler de Conexión

```python
@sio.event
def connect():
    print('✓ Conectado al servidor')
    # ... registro del dispositivo ...
    
    # NUEVO: Auto-play después de reconectar
    if AUTO_PLAY:
        print("Reconexión exitosa - Reiniciando reproducción automática...")
        time.sleep(1)
        send_mpv_command(['loadfile', RADIO_URL])
```

### Cambio 2: Loop Principal con Exponential Backoff

```python
reconnect_attempts = 0
max_reconnect_delay = 30

while True:
    try:
        ensure_mpv_running()
        
        if not sio.connected:
            reconnect_attempts += 1
            delay = min(reconnect_attempts * 2, max_reconnect_delay)
            print(f"Intento de reconexión #{reconnect_attempts} (esperando {delay}s)...")
            
            try:
                sio.connect(SERVER_URL, wait_timeout=10)
                reconnect_attempts = 0  # Reset en conexión exitosa
            except Exception as e:
                print(f"Reconexión fallida: {e}")
                time.sleep(delay)
                continue
```

### Cambio 3: ensure_mpv_running() Mejorado

```python
def ensure_mpv_running():
    response = send_mpv_command(['get_property', 'idle-active'])
    
    if response is None:
        # MPV no responde - reiniciar
        print("⚠ MPV no responde - Reiniciando...")
        # ... reinicia MPV ...
        if AUTO_PLAY:
            send_mpv_command(['loadfile', RADIO_URL])
    
    elif AUTO_PLAY and response is True:
        # MPV está idle pero debería estar reproduciendo
        print("MPV está en idle - Reiniciando reproducción...")
        send_mpv_command(['loadfile', RADIO_URL])
```

---

## 🎯 Comportamiento Esperado

### Escenario 1: Pérdida Temporal de Red

1. Cliente detecta desconexión
2. Muestra: `✗ Desconectado del servidor - Reconectando automáticamente...`
3. Intenta reconectar cada 2s, 4s, 6s... (hasta 30s máximo)
4. Cuando la red vuelve:
   - `✓ Conectado al servidor`
   - `Reconexión exitosa - Reiniciando reproducción automática...`
5. **La radio vuelve a sonar automáticamente**

### Escenario 2: MPV se Cierra

1. Cliente detecta que MPV no responde
2. Muestra: `⚠ MPV no responde - Reiniciando...`
3. Reinicia MPV
4. Muestra: `Reiniciando reproducción automática...`
5. **La radio vuelve a sonar automáticamente**

### Escenario 3: MPV Está en Idle (Silencio)

1. Cliente detecta que MPV está en idle
2. Muestra: `MPV está en idle - Reiniciando reproducción...`
3. Reanuda la reproducción
4. **La radio vuelve a sonar automáticamente**

### Escenario 4: Servidor se Reinicia

1. Todos los clientes se desconectan
2. Intentan reconectar automáticamente
3. Cuando el servidor vuelve, se reconectan
4. **La radio vuelve a sonar en todos los dispositivos automáticamente**

---

## 🚀 Cómo Aplicar las Mejoras

### Desde tu Mac

```bash
# Copiar el archivo actualizado
scp /Users/anthonynarvaez/Downloads/RadioOnelineUPEC/pi-client/client.py pi@172.20.248.102:/home/pi/pi-client/

# Copiar el script de actualización
scp /Users/anthonynarvaez/Downloads/RadioOnelineUPEC/pi-client/update_client.sh pi@172.20.248.102:/home/pi/pi-client/
```

### En la Raspberry Pi

```bash
cd ~/pi-client
chmod +x update_client.sh
sudo ./update_client.sh
```

---

## 🔍 Cómo Verificar que Funciona

### Test 1: Reconexión Automática

```bash
# En la Raspberry Pi, ver logs
journalctl -u radio-upec -f

# En tu Mac, detén el servidor
# (Ctrl+C en la terminal donde corre npm run dev)

# Observa en los logs de la Raspberry Pi:
# "✗ Desconectado del servidor - Reconectando automáticamente..."
# "Intento de reconexión #1 (esperando 2s)..."
# "Intento de reconexión #2 (esperando 4s)..."

# Reinicia el servidor en tu Mac
# npm run dev

# Observa en los logs:
# "✓ Conectado al servidor"
# "Reconexión exitosa - Reiniciando reproducción automática..."
```

### Test 2: MPV se Cierra

```bash
# Matar MPV manualmente
sudo pkill mpv

# Ver logs
journalctl -u radio-upec -f

# Deberías ver:
# "⚠ MPV no responde - Reiniciando..."
# "Reiniciando reproducción automática..."
```

### Test 3: Reinicio de la Raspberry Pi

```bash
# Reiniciar
sudo reboot

# Después del reinicio, verificar
systemctl status radio-upec
journalctl -u radio-upec -n 50

# Deberías ver que:
# - El servicio inició automáticamente
# - Se conectó al servidor
# - Empezó a reproducir automáticamente
```

---

## 📊 Resumen de Características

| Característica | Antes | Ahora |
|----------------|-------|-------|
| **Reconexión automática** | ✅ Sí | ✅ Sí (mejorada) |
| **Límite de reintentos** | ❌ No | ✅ Infinitos |
| **Auto-play al reconectar** | ❌ No | ✅ Sí |
| **Recovery de MPV** | ✅ Básico | ✅ Avanzado |
| **Exponential backoff** | ❌ No | ✅ Sí |
| **Mensajes en español** | ❌ No | ✅ Sí |
| **Detección de idle** | ❌ No | ✅ Sí |

---

## 🎉 Resultado Final

Con estas mejoras, el sistema es **100% automático**:

1. ✅ Se inicia automáticamente al encender la Raspberry Pi
2. ✅ Se conecta automáticamente al servidor
3. ✅ Empieza a reproducir automáticamente
4. ✅ Si pierde conexión, reintenta **infinitamente**
5. ✅ Al reconectar, **vuelve a reproducir automáticamente**
6. ✅ Si MPV falla, **se reinicia automáticamente**
7. ✅ Si queda en silencio, **se reanuda automáticamente**

**No requiere intervención manual en ningún momento** ⭐

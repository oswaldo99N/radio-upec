# Guía de Solución de Problemas - Radio UPEC

Esta guía te ayudará a diagnosticar y resolver problemas comunes con el cliente de Radio UPEC en Raspberry Pi.

---

## 🚨 Problema: La Raspberry Pi se Desconecta o No Suena

### Síntomas

- El dispositivo aparece "offline" en el panel de administración
- El audio se corta o suena entrecortado
- Necesitas darle "play" manualmente cada vez
- La conexión se pierde intermitentemente

---

## 📊 Diagnóstico Rápido

### Paso 1: Ejecutar el Script de Diagnóstico

Desde tu SSH en la Raspberry Pi:

```bash
cd ~/pi-client
chmod +x diagnostico.sh
./diagnostico.sh
```

Este script te mostrará:

- Estado del servicio
- Logs recientes
- Conectividad al servidor
- Recursos del sistema
- Errores específicos

---

## 🔍 Revisión Manual de Logs

### Ver logs en tiempo real

```bash
journalctl -u radio-upec -f
```

### Ver últimos 100 logs

```bash
journalctl -u radio-upec -n 100
```

### Ver solo errores

```bash
journalctl -u radio-upec -p err -n 50
```

---

## 🛠️ Causas Comunes y Soluciones

### Causa 1: Problemas de Red Intermitentes

**Síntomas:**

- En los logs ves: `Connection failed, retrying...`
- Ping al servidor falla ocasionalmente

**Solución:**

```bash
# Verificar conectividad
ping -c 10 [IP_DEL_SERVIDOR]

# Si hay pérdida de paquetes, puede ser:
# - Problema de WiFi (señal débil)
# - Problemas en el router
# - Congestión de red
```

**Fix temporal:**

```bash
# Reiniciar red
sudo systemctl restart networking
```

**Fix permanente:**

- Usa cable Ethernet en lugar de WiFi
- Mejora la señal WiFi
- Configura IP estática en la Raspberry Pi

---

### Causa 2: MPV se Cierra Inesperadamente

**Síntomas:**

- En los logs ves: `MPV not responding, restarting...`
- Socket `/tmp/mpv_socket` desaparece

**Diagnóstico:**

```bash
# Verificar si MPV está corriendo
ps aux | grep mpv

# Verificar socket
ls -l /tmp/mpv_socket
```

**Solución:**
El código ya tiene auto-recuperación, pero podemos mejorar el reintentos. Ver sección "Mejoras al Código" abajo.

---

### Causa 3: Problemas con el Stream de Radio

**Síntomas:**

- Audio se corta
- Calidad degradada
- Silencio intermitente

**Diagnóstico:**

```bash
# Probar el stream directamente
mpv https://grupomundodigital.com:8646/live

# Si esto también falla, el problema es:
# - El stream de radio está caído
# - Problemas de ancho de banda
```

**Solución temporal:**

```bash
# Reiniciar el servicio
sudo systemctl restart radio-upec
```

---

### Causa 4: Servidor Caído o No Accesible

**Síntomas:**

- Todos los dispositivos offline
- En logs: timeouts de conexión

**Diagnóstico:**

```bash
# Verificar si el servidor está accesible
telnet [IP_SERVIDOR] 3000

# Verificar conectividad
ping [IP_SERVIDOR]
```

**Solución:**

- Verificar que el servidor esté ejecutándose
- Verificar firewall/router

---

### Causa 5: Problemas de Memoria/Recursos

**Síntomas:**

- Raspberry Pi muy lenta
- El servicio se detiene después de un tiempo

**Diagnóstico:**

```bash
# Ver uso de memoria
free -h

# Ver procesos
top
```

**Solución:**

```bash
# Liberar memoria
sudo systemctl restart radio-upec

# Si el problema persiste, puede ser memoria insuficiente
```

---

## 🔧 Mejoras al Código (Aplicar si los problemas persisten)

### Mejora 1: Aumentar Frecuencia de Reconexión

El cliente actualmente intenta reconectar cada 3 segundos. Para debug, podemos agregar más logs.

Edita `client.py` y busca la función `main()` (línea ~230):

```python
# Cambiar de:
sio.sleep(3)

# A:
sio.sleep(5)  # Dar más tiempo entre intentos
```

### Mejora 2: Agregar Más Logs de Debug

Agrega esto al inicio de `client.py` después de los imports:

```python
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
```

Y reemplaza los `print()` con `logger.info()` o `logger.error()`.

---

## 📋 Comandos Útiles para Diagnóstico

### Estado del servicio

```bash
systemctl status radio-upec
```

### Reiniciar servicio

```bash
sudo systemctl restart radio-upec
```

### Ver servicio iniciando

```bash
sudo systemctl restart radio-upec && journalctl -u radio-upec -f
```

### Ver uso de red en tiempo real

```bash
sudo iftop
```

### Ver dispositivos de audio

```bash
aplay -l
```

### Probar MPV manualmente

```bash
mpv --no-video https://grupomundodigital.com:8646/live
```

---

## 🚀 Solución Rápida: Reiniciar Todo

Si nada funciona, prueba esto:

```bash
# 1. Detener el servicio
sudo systemctl stop radio-upec

# 2. Limpiar socket de MPV
sudo rm -f /tmp/mpv_socket

# 3. Matar cualquier proceso restante
sudo pkill -9 python3
sudo pkill -9 mpv

# 4. Iniciar nuevamente
sudo systemctl start radio-upec

# 5. Ver logs
journalctl -u radio-upec -f
```

---

## 📞 Checklist de Diagnóstico

Antes de pedir ayuda, verifica:

- [ ] El servicio está ejecutándose: `systemctl status radio-upec`
- [ ] Los logs no muestran errores: `journalctl -u radio-upec -n 50`
- [ ] Hay conectividad al servidor: `ping [IP_SERVIDOR]`
- [ ] El puerto del servidor está abierto: `telnet [IP_SERVIDOR] 3000`
- [ ] MPV está ejecutándose: `ps aux | grep mpv`
- [ ] El socket de MPV existe: `ls /tmp/mpv_socket`
- [ ] El stream de radio funciona: `mpv https://grupomundodigital.com:8646/live`
- [ ] Hay suficiente memoria: `free -h`
- [ ] La configuración es correcta: `cat ~/pi-client/config.json`

---

## 🔄 Monitoreo Continuo

Para monitorear en tiempo real:

```bash
# Terminal 1: Logs del servicio
journalctl -u radio-upec -f

# Terminal 2: Uso de recursos
watch -n 2 'free -h && echo "" && ps aux | grep -E "(python|mpv)" | grep -v grep'

# Terminal 3: Conectividad
watch -n 5 'ping -c 1 [IP_SERVIDOR] && echo "✓ Conectado" || echo "✗ Desconectado"'
```

---

## 💡 Prevención de Problemas

### 1. Usar Cable Ethernet

WiFi puede ser inestable. Usa cable si es posible.

### 2. IP Estática

Configura IP estática para evitar cambios de IP:

```bash
sudo nano /etc/dhcpcd.conf

# Agregar al final:
interface eth0
static ip_address=192.168.1.XXX/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8
```

### 3. Watchdog para Auto-Recuperación

Configura un watchdog que reinicie automáticamente si el servicio falla.

---

## 📊 Información para Reportar Problemas

Si necesitas ayuda, incluye:

1. **Output del script de diagnóstico**: `./diagnostico.sh > diagnostico.txt`
2. **Últimos 100 logs**: `journalctl -u radio-upec -n 100 > logs.txt`
3. **Modelo de Raspberry Pi**: `cat /proc/cpuinfo | grep Model`
4. **Versión del OS**: `cat /etc/os-release`
5. **Configuración de red**: `ip addr show`

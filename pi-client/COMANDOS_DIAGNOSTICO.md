# 🚨 COMANDOS DE DIAGNÓSTICO INMEDIATO

**Ejecuta estos comandos en tu Raspberry Pi vía SSH para diagnosticar el problema**

---

## 1️⃣ Ver Estado del Servicio

```bash
systemctl status radio-upec
```

**¿Qué buscar?**

- Si dice `Active: active (running)` ✅ está bien
- Si dice `Active: inactive (dead)` ❌ el servicio está detenido
- Si dice `Active: failed` ❌ el servicio falló

---

## 2️⃣ Ver Logs en Tiempo Real

```bash
journalctl -u radio-upec -f
```

**Presiona Ctrl+C para salir**

**¿Qué buscar?**

- `Connection failed, retrying...` = Problema de red
- `MPV not responding` = MPV se cerró
- `Error sending to MPV` = Problemas con el reproductor
- `Disconnected from server` = Se perdió la conexión

---

## 3️⃣ Ver Últimos 50 Logs (incluye errores)

```bash
journalctl -u radio-upec -n 50
```

**Copia y pega la salida para análisis**

---

## 4️⃣ Verificar Conectividad al Servidor

```bash
# Primero, ver la IP configurada
cat ~/pi-client/config.json

# Luego hacer ping (reemplaza con tu IP)
ping -c 5 172.20.226.1

# Verificar si el puerto está abierto
telnet 172.20.226.1 3000
```

**Si telnet dice "Connected"** ✅ el servidor está accesible
**Si dice "Connection refused"** ❌ el servidor no está escuchando o firewall bloquea

---

## 5️⃣ Verificar Procesos

```bash
# Ver si Python está corriendo el cliente
ps aux | grep python

# Ver si MPV está corriendo
ps aux | grep mpv
```

---

## 6️⃣ Reiniciar el Servicio (Fix Temporal)

```bash
sudo systemctl restart radio-upec

# Luego ver los logs
journalctl -u radio-upec -f
```

---

## 7️⃣ Ejecutar Diagnóstico Completo

**PRIMERO**, copia el archivo desde tu Mac a la Raspberry Pi:

Desde tu Mac (en otra terminal):

```bash
scp /Users/anthonynarvaez/Downloads/RadioOnelineUPEC/pi-client/diagnostico.sh pi@[IP_RASPBERRY]:/home/pi/pi-client/
```

**Luego**, en la Raspberry Pi:

```bash
cd ~/pi-client
chmod +x diagnostico.sh
./diagnostico.sh
```

Esto generará un reporte completo del estado del sistema.

---

## 8️⃣ Si Nada Funciona: Reset Completo

```bash
# Detener todo
sudo systemctl stop radio-upec

# Limpiar
sudo rm -f /tmp/mpv_socket
sudo pkill -9 python3
sudo pkill -9 mpv

# Reiniciar
sudo systemctl start radio-upec

# Ver logs
journalctl -u radio-upec -f
```

---

## 💡 CAUSAS MÁS COMUNES

### Causa #1: WiFi Inestable

**Síntoma:** Se desconecta cada cierto tiempo
**Solución:** Usar cable Ethernet

### Causa #2: Servidor Caído

**Síntoma:** Todos los dispositivos offline
**Solución:** Verificar que el servidor en tu Mac esté ejecutándose

### Causa #3: Stream de Radio Caído

**Síntoma:** Audio entrecortado o silencio
**Prueba:** `mpv https://grupomundodigital.com:8646/live`

### Causa #4: IP del Servidor Cambió

**Síntoma:** No puede conectar después de que la Mac se reconectó a la red
**Solución:** Verificar IP de la Mac con `ifconfig`, actualizar config.json

---

## 📞 ¿Qué Información Necesito?

Copia y envía:

```bash
# 1. Últimos logs
journalctl -u radio-upec -n 100

# 2. Estado del servicio
systemctl status radio-upec

# 3. Configuración
cat ~/pi-client/config.json

# 4. Test de ping
ping -c 5 [TU_IP_SERVIDOR]
```

---

## ⚡ SOLUCIÓN RÁPIDA SI ESTÁS EN APUROS

```bash
sudo systemctl restart radio-upec && journalctl -u radio-upec -f
```

Observa los logs. Si se conecta exitosamente verás:

```
Connected to server
Device registered: [ID]
```

Si ves errores, cópialos y envíalos para análisis.

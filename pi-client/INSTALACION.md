# Guía de Instalación - Cliente Radio UPEC para Raspberry Pi

Esta guía explica cómo instalar y configurar el cliente de Radio UPEC en dispositivos Raspberry Pi para diferentes campus y ubicaciones.

---

## 📋 Requisitos Previos

- **Hardware**: Raspberry Pi (cualquier modelo con salida de audio)
- **Sistema Operativo**: Raspberry Pi OS (Bullseye o posterior)
- **Red**: Conexión a Internet o acceso al servidor
- **Permisos**: Acceso root (`sudo`)

---

## 🚀 Instalación Rápida (Recomendado)

Para instalar en una nueva Raspberry Pi, sigue estos pasos:

### 1. Copiar los archivos

Copia la carpeta `pi-client` a tu Raspberry Pi. Puedes usar:

- USB
- `scp` desde otra computadora
- `git clone` si el proyecto está en un repositorio

```bash
# Ejemplo usando scp desde tu computadora:
scp -r pi-client/ pi@192.168.1.XXX:/home/pi/
```

### 2. Acceder a la carpeta

```bash
cd ~/pi-client
```

### 3. Ejecutar el script de despliegue

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

El script te pedirá:

- **IP del servidor**: La dirección IP donde está ejecutándose el servidor de Radio UPEC
- **Puerto del servidor**: Por defecto es `3000`
- **Nombre del dispositivo**: Opcional, un nombre descriptivo (ej: "Radio Biblioteca Campus Norte")
- **Auto-reproducción**: Si debe iniciar la radio automáticamente

### 4. Verificar

El dispositivo debería aparecer automáticamente en el panel de administración.

---

## 🔧 Instalación Manual (Paso a Paso)

Si prefieres mayor control, puedes ejecutar los scripts por separado:

### Paso 1: Configurar

```bash
cd ~/pi-client
chmod +x configure.sh
./configure.sh
```

Esto creará el archivo `config.json` con la configuración de red.

### Paso 2: Instalar

```bash
chmod +x install.sh
sudo ./install.sh
```

Esto instalará las dependencias y configurará el servicio systemd.

---

## 📝 Configuración para Múltiples Campus

### Escenario: Diferentes Redes

Si vas a instalar clientes en diferentes campus con diferentes redes:

#### Opción 1: Servidor en Red Local (Mismo Campus)

Cada campus tiene su propio servidor:

- Campus Norte: servidor en `192.168.1.100:3000`
- Campus Sur: servidor en `192.168.2.100:3000`

Configura cada Raspberry Pi con la IP de su servidor local.

#### Opción 2: Servidor Central Accesible por Internet

El servidor está en una ubicación y es accesible desde todas las redes:

**Ejemplo**: El servidor tiene IP pública `203.0.113.50` o un dominio `radio.upec.edu.ec`

```bash
# Durante la configuración, ingresa:
IP del servidor: 203.0.113.50
# o
IP del servidor: radio.upec.edu.ec
```

> **⚠️ Importante**: Si usas esta opción, asegúrate de que el puerto 3000 esté abierto en el firewall del servidor y redirigido correctamente en el router.

#### Opción 3: VPN o Túnel

Usa una VPN (como Tailscale, ZeroTier) para conectar todas las Raspberry Pi al servidor en una red virtual privada.

---

## 🔄 Actualizar Configuración

Si necesitas cambiar la IP del servidor después de la instalación:

```bash
cd ~/pi-client
sudo ./configure.sh
sudo systemctl restart radio-upec
```

---

## 📊 Comandos Útiles

### Ver estado del servicio

```bash
systemctl status radio-upec
```

### Ver logs en tiempo real

```bash
journalctl -u radio-upec -f
```

### Ver los últimos 50 logs

```bash
journalctl -u radio-upec -n 50
```

### Reiniciar el servicio

```bash
sudo systemctl restart radio-upec
```

### Detener el servicio

```bash
sudo systemctl stop radio-upec
```

### Iniciar el servicio

```bash
sudo systemctl start radio-upec
```

### Deshabilitar auto-inicio

```bash
sudo systemctl disable radio-upec
```

### Verificar conectividad con el servidor

```bash
# Reemplaza con tu IP de servidor
ping -c 4 192.168.1.100
telnet 192.168.1.100 3000
```

---

## 🛠️ Solución de Problemas

### El dispositivo no aparece en el panel

1. Verifica que el servicio esté ejecutándose:

   ```bash
   systemctl status radio-upec
   ```

2. Verifica los logs:

   ```bash
   journalctl -u radio-upec -n 50
   ```

3. Verifica conectividad al servidor:

   ```bash
   # Reemplaza con tu IP
   ping 192.168.1.100
   ```

4. Verifica que `config.json` tenga la IP correcta:

   ```bash
   cat ~/pi-client/config.json
   ```

### No se escucha audio

1. Verifica que MPV esté usando el dispositivo de audio correcto:

   ```bash
   mpv --audio-device=help
   ```

2. Edita `client.py` línea 60 para usar el dispositivo correcto:

   ```python
   '--audio-device=alsa/default:CARD=TU_DISPOSITIVO'
   ```

3. Ajusta el volumen del sistema:

   ```bash
   alsamixer
   ```

### Error: "config.json no encontrado"

Ejecuta el script de configuración:

```bash
cd ~/pi-client
./configure.sh
```

### El servicio se detiene después de un tiempo

Verifica los logs para más detalles:

```bash
journalctl -u radio-upec -n 100
```

Posibles causas:

- Problemas de red intermitentes
- El servidor no está accesible
- MPV se cerró inesperadamente

---

## 📦 Archivos del Proyecto

- **`client.py`**: Cliente principal que se conecta al servidor
- **`config.json`**: Configuración de red (creado durante setup)
- **`device.json`**: ID único del dispositivo (creado automáticamente)
- **`configure.sh`**: Script de configuración interactivo
- **`install.sh`**: Script de instalación del servicio
- **`deploy.sh`**: Script maestro (configuración + instalación)
- **`requirements.txt`**: Dependencias de Python
- **`config.ejemplo.json`**: Plantilla de configuración

---

## 🔐 Configuración Avanzada

### Cambiar el nombre del dispositivo después de la instalación

Edita `config.json`:

```bash
nano ~/pi-client/config.json
```

Cambia el valor de `device_name`:

```json
{
  "server_url": "http://192.168.1.100:3000",
  "device_name": "Radio Cafetería - Planta Baja",
  "auto_play": true
}
```

Reinicia el servicio:

```bash
sudo systemctl restart radio-upec
```

### Deshabilitar auto-reproducción

Edita `config.json` y cambia `auto_play` a `false`:

```json
{
  "server_url": "http://192.168.1.100:3000",
  "device_name": "Mi Radio",
  "auto_play": false
}
```

---

## 🎯 Flujo Recomendado para Despliegue Masivo

Para instalar en múltiples Raspberry Pi de manera eficiente:

### 1. Preparar una imagen maestra

1. Instala el cliente en una Raspberry Pi "maestra"
2. **NO** ejecutes `configure.sh` todavía
3. Crea una imagen de la tarjeta SD usando herramientas como:
   - Raspberry Pi Imager
   - Win32 Disk Imager
   - `dd` en Linux

### 2. Clonar a múltiples tarjetas SD

Usa la imagen maestra para crear múltiples tarjetas SD.

### 3. Primera ejecución en cada dispositivo

En cada Raspberry Pi nueva:

```bash
cd ~/pi-client
sudo ./configure.sh
```

Ingresa la configuración específica para esa ubicación.

---

## 📞 Soporte

Si encuentras problemas, verifica:

1. Los logs del servicio: `journalctl -u radio-upec -f`
2. Conectividad de red: `ping [IP_SERVIDOR]`
3. Estado del servidor
4. Configuración en `config.json`

---

## 🔄 Actualizar el Cliente

Para actualizar el código del cliente:

```bash
cd ~/pi-client
# Respaldar configuración
cp config.json config.json.backup

# Copiar nuevos archivos (desde USB, git, etc.)
# ...

# Restaurar configuración
cp config.json.backup config.json

# Reiniciar servicio
sudo systemctl restart radio-upec
```

# Radio UPEC - Cliente Raspberry Pi

Cliente para reproducir Radio UPEC en dispositivos Raspberry Pi con gestión centralizada.

## 🚀 Instalación Rápida

```bash
cd ~/pi-client
chmod +x deploy.sh
sudo ./deploy.sh
```

Sigue las instrucciones en pantalla para configurar la conexión al servidor.

## 📖 Documentación Completa

Para instrucciones detalladas, consulta [INSTALACION.md](INSTALACION.md)

## 📦 Archivos

- `client.py` - Cliente principal
- `configure.sh` - Configuración interactiva
- `install.sh` - Instalación del servicio
- `deploy.sh` - Script maestro (config + install)
- `config.ejemplo.json` - Plantilla de configuración

## 🔧 Configuración

El cliente requiere un archivo `config.json` con la IP del servidor:

```json
{
  "server_url": "http://192.168.1.100:3000",
  "device_name": "Radio Biblioteca",
  "auto_play": true
}
```

## 📊 Comandos Útiles

```bash
# Ver estado
systemctl status radio-upec

# Ver logs
journalctl -u radio-upec -f

# Reiniciar
sudo systemctl restart radio-upec

# Reconfigurar
sudo ./configure.sh && sudo systemctl restart radio-upec
```

## 🌐 Despliegue Multi-Campus

Este cliente está diseñado para ser desplegado en múltiples ubicaciones con diferentes redes. Solo necesitas configurar la IP del servidor durante la instalación.

Ver [INSTALACION.md](INSTALACION.md) para escenarios de despliegue.

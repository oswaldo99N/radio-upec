# ✅ Configuración Correcta para Raspberry Pi

## 🎯 IP del Servidor Identificada

Tu Mac tiene las siguientes IPs:

- **172.20.226.1** ← Probablemente esta
- 172.20.214.52

## 📝 Comandos para Configurar la Raspberry Pi

**Copia y pega ESTO en tu Raspberry Pi (SSH):**

```bash
cd ~/pi-client

# Crear config.json con la IP CORRECTA
cat > config.json << 'EOF'
{
  "server_url": "http://172.20.226.1:3000",
  "device_name": "Radio Raspberry Pi",
  "auto_play": true
}
EOF

# Verificar que se creó bien
echo "========================================="
echo "Contenido de config.json:"
echo "========================================="
cat config.json

# Probar conexión al servidor
echo ""
echo "========================================="
echo "Probando conexión al servidor..."
echo "========================================="
ping -c 3 172.20.226.1

# Si el ping funciona, probar el puerto 3000
echo ""
echo "Probando puerto 3000..."
timeout 3 bash -c "cat < /dev/null > /dev/tcp/172.20.226.1/3000" && echo "✓ Puerto 3000 accesible" || echo "✗ Puerto 3000 NO accesible"

# Reiniciar el servicio
echo ""
echo "========================================="
echo "Reiniciando servicio..."
echo "========================================="
sudo systemctl restart radio-upec

# Esperar un poco
sleep 3

# Mostrar estado
echo ""
echo "========================================="
echo "Estado del servicio:"
echo "========================================="
systemctl status radio-upec --no-pager

# Mostrar logs en tiempo real
echo ""
echo "========================================="
echo "Logs en tiempo real (Ctrl+C para salir):"
echo "========================================="
sleep 2
journalctl -u radio-upec -f
```

---

## 📌 Nota Importante

**NO uses `localhost:5173`** - Eso es solo el admin panel (frontend) que corre en tu Mac.

El servidor backend (donde se conectan las Raspberry Pi) está en:

- **IP:** `172.20.226.1` (o `172.20.214.52`)
- **Puerto:** `3000`

---

## 🔍 Si No Funciona con 172.20.226.1

Prueba con la otra IP:

```bash
cd ~/pi-client

# Cambiar a la otra IP
cat > config.json << 'EOF'
{
  "server_url": "http://172.20.214.52:3000",
  "device_name": "Radio Raspberry Pi",
  "auto_play": true
}
EOF

sudo systemctl restart radio-upec
journalctl -u radio-upec -f
```

---

## ✅ Deberías Ver Esto en los Logs

Si funciona correctamente:

```
✓ Configuración cargada desde config.json
  Servidor: http://172.20.226.1:3000
Iniciando cliente Radio UPEC...
Dispositivo: Radio Raspberry Pi (xx:xx:xx:xx:xx:xx)
Starting MPV...
Auto-reproducción habilitada, iniciando radio...
✓ Conectado al servidor
Reconexión exitosa - Reiniciando reproducción automática...
```

**¡La radio debería empezar a sonar!** 🎵

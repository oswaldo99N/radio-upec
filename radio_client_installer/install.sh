#!/bin/bash

# Radio UPEC Installation Script
# Run with: sudo ./install.sh

if [ "$EUID" -ne 0 ]; then
  echo "Por favor ejecuta como root: sudo ./install.sh"
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Verificar que existe config.json
if [ ! -f "config.json" ]; then
  echo "========================================="
  echo "  ERROR: Configuración no encontrada"
  echo "========================================="
  echo ""
  echo "No se encontró 'config.json'"
  echo ""
  echo "Ejecutando script de configuración..."
  echo ""
  
  # Ejecutar configure.sh si está disponible
  if [ -f "configure.sh" ]; then
    chmod +x configure.sh
    sudo -u $SUDO_USER ./configure.sh
    
    # Verificar si se creó exitosamente
    if [ ! -f "config.json" ]; then
      echo ""
      echo "ERROR: Configuración cancelada o falló."
      echo "No se puede continuar con la instalación."
      exit 1
    fi
  else
    echo "ERROR: configure.sh no encontrado."
    echo ""
    echo "Por favor crea manualmente config.json con:"
    echo "{"
    echo '  "server_url": "http://IP_DEL_SERVIDOR:3000",'
    echo '  "device_name": "Nombre del dispositivo",'
    echo '  "auto_play": true'
    echo "}"
    exit 1
  fi
fi

echo ""
echo "========================================="
echo "  Instalación Cliente Radio UPEC"
echo "========================================="
echo ""

echo "Updating system..."
apt-get update

echo "Installing MPV and Python tools..."
apt-get install -y mpv python3-pip python3-full

echo "Installing Python dependencies..."
# Using --break-system-packages for recent Raspberry Pi OS versions (Bookworm based)
pip3 install -r requirements.txt --break-system-packages

# Create Service
SERVICE_FILE=/etc/systemd/system/radio-upec.service
CURRENT_DIR=$(pwd)

echo "Creating systemd service at $SERVICE_FILE..."
cat <<EOF > $SERVICE_FILE
[Unit]
Description=Radio UPEC Client
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/python3 $CURRENT_DIR/client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "Habilitando e iniciando servicio..."
systemctl daemon-reload
systemctl enable radio-upec.service
systemctl start radio-upec.service

echo ""
echo "========================================="
echo "  ✓ Instalación Completada"
echo "========================================="
echo ""
echo "El servicio se ha instalado y está ejecutándose."
echo ""
echo "Comandos útiles:"
echo "  Ver estado:    systemctl status radio-upec"
echo "  Ver logs:      journalctl -u radio-upec -f"
echo "  Reiniciar:     systemctl restart radio-upec"
echo "  Detener:       systemctl stop radio-upec"
echo ""
echo "Para cambiar la configuración del servidor:"
echo "  sudo ./configure.sh"
echo "  sudo systemctl restart radio-upec"
echo ""

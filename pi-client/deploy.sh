#!/bin/bash

# Script de Despliegue Completo - Radio UPEC
# Este script configura e instala el cliente de una sola vez

echo "========================================="
echo "  Radio UPEC - Instalación Completa"
echo "========================================="
echo ""
echo "Este script configurará e instalará el cliente"
echo "de Radio UPEC en esta Raspberry Pi."
echo ""

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Este script debe ejecutarse como root"
  echo "Por favor ejecuta: sudo ./deploy.sh"
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Verificar que los archivos necesarios existen
if [ ! -f "configure.sh" ]; then
  echo "ERROR: configure.sh no encontrado"
  exit 1
fi

if [ ! -f "install.sh" ]; then
  echo "ERROR: install.sh no encontrado"
  exit 1
fi

if [ ! -f "client.py" ]; then
  echo "ERROR: client.py no encontrado"
  exit 1
fi

# Paso 1: Configuración
echo "========================================="
echo " PASO 1/2: Configuración"
echo "========================================="
echo ""

# Si ya existe configuración, preguntar si desea mantenerla
if [ -f "config.json" ]; then
  echo "Ya existe una configuración:"
  cat config.json
  echo ""
  read -p "¿Deseas mantener esta configuración? (S/n): " keep_config
  keep_config=${keep_config:-s}
  
  if [[ $keep_config != "s" && $keep_config != "S" ]]; then
    chmod +x configure.sh
    sudo -u $SUDO_USER ./configure.sh
  fi
else
  chmod +x configure.sh
  sudo -u $SUDO_USER ./configure.sh
fi

# Verificar que la configuración existe
if [ ! -f "config.json" ]; then
  echo ""
  echo "ERROR: La configuración no fue creada."
  echo "No se puede continuar con la instalación."
  exit 1
fi

echo ""
echo "========================================="
echo " PASO 2/2: Instalación"
echo "========================================="
echo ""

# Paso 2: Instalación
chmod +x install.sh
./install.sh

# Verificar que el servicio esté ejecutándose
echo ""
echo "========================================="
echo " Verificando instalación..."
echo "========================================="
echo ""

sleep 3

if systemctl is-active --quiet radio-upec.service; then
  echo "✓ El servicio está ejecutándose correctamente"
  echo ""
  echo "Estado del servicio:"
  systemctl status radio-upec.service --no-pager -l
  echo ""
  echo "========================================="
  echo "  ✓✓✓ INSTALACIÓN EXITOSA ✓✓✓"
  echo "========================================="
  echo ""
  echo "El cliente Radio UPEC está instalado y funcionando."
  echo ""
  echo "Verifica que aparezca en el panel de administración:"
  SERVER_URL=$(cat config.json | grep server_url | cut -d'"' -f4)
  echo "  Panel: $SERVER_URL"
  echo ""
else
  echo "⚠ ADVERTENCIA: El servicio no está ejecutándose"
  echo ""
  echo "Verifica los logs para más detalles:"
  echo "  journalctl -u radio-upec -n 50"
  echo ""
  exit 1
fi

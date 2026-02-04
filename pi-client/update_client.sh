#!/bin/bash

# Script para actualizar el cliente en una Raspberry Pi existente
# Ejecutar con: sudo ./update_client.sh

echo "========================================="
echo "  Actualización Radio UPEC Client"
echo "========================================="
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "Por favor ejecuta como root: sudo ./update_client.sh"
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Hacer backup de la configuración
echo "Haciendo backup de configuración..."
if [ -f "config.json" ]; then
    cp config.json config.json.backup
    echo "✓ Backup guardado en config.json.backup"
fi

if [ -f "device.json" ]; then
    cp device.json device.json.backup
    echo "✓ Backup guardado en device.json.backup"
fi

echo ""
echo "Deteniendo servicio..."
systemctl stop radio-upec

echo ""
echo "Limpiando socket de MPV..."
rm -f /tmp/mpv_socket

echo ""
echo "Reiniciando servicio con nueva configuración..."
systemctl start radio-upec

echo ""
echo "Esperando 3 segundos..."
sleep 3

echo ""
echo "========================================="
echo "  Estado del Servicio"
echo "========================================="
systemctl status radio-upec --no-pager

echo ""
echo "========================================="
echo "  ✓ Actualización Completada"
echo "========================================="
echo ""
echo "El cliente ahora tiene:"
echo "  ✓ Buffer de 50MB para streaming"
echo "  ✓ Cache de 10 segundos"
echo "  ✓ Timeout de red: 60 segundos"
echo "  ✓ Pre-buffer de 5 segundos"
echo "  ✓ Logs reducidos (menos spam)"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  journalctl -u radio-upec -f"
echo ""

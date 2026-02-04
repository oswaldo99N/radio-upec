#!/bin/bash

# Test de Reconexión - Radio UPEC
# Este script prueba la reconexión automática matando el servicio

echo "========================================="
echo "  Test de Reconexión Automática"
echo "========================================="
echo ""

echo "Este test verificará que el cliente se reconecta automáticamente."
echo ""
echo "El test hará:"
echo "  1. Detener el servicio"
echo "  2. Matar MPV manualmente"
echo "  3. Reiniciar el servicio"
echo "  4. Observar la reconexión"
echo ""
read -p "Presiona Enter para continuar..."

echo ""
echo "1. Deteniendo servicio..."
sudo systemctl stop radio-upec
sleep 2

echo ""
echo "2. Limpiando procesos..."
sudo pkill -9 python3 2>/dev/null || true
sudo pkill -9 mpv 2>/dev/null || true
sudo rm -f /tmp/mpv_socket

echo ""
echo "3. Reiniciando servicio..."
sudo systemctl start radio-upec

echo ""
echo "4. Esperando 5 segundos..."
sleep 5

echo ""
echo "========================================="
echo "  Logs en Tiempo Real"
echo "========================================="
echo ""
echo "Observa los mensajes de reconexión automática."
echo "Presiona Ctrl+C para salir."
echo ""
sleep 2

journalctl -u radio-upec -f

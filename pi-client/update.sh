#!/bin/bash
# Script para actualizar el cliente en las Raspberry Pi

echo "=========================================="
echo "Actualizando Cliente Radio UPEC"
echo "=========================================="
echo ""

# Detener el servicio
echo "1. Deteniendo servicio..."
sudo systemctl stop radio-client

# Hacer backup del archivo actual
echo "2. Creando backup..."
cp client.py client.py.backup

# Aquí el usuario debe copiar el nuevo client.py
echo "3. El nuevo client.py debe estar en este directorio"
echo ""

# Reiniciar el servicio
echo "4. Reiniciando servicio..."
sudo systemctl restart radio-client

echo ""
echo "✓ Actualización completada"
echo ""
echo "Para ver el estado:"
echo "  sudo systemctl status radio-client"
echo ""
echo "Para ver los logs:"
echo "  sudo journalctl -u radio-client -f"

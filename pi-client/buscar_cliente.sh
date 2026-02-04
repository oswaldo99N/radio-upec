#!/bin/bash
# Script simple para encontrar y actualizar client.py

echo "🔍 Buscando ubicación de client.py en las Raspberry Pi..."
echo ""

DEVICE="raspberry@172.20.248.102"

echo "Conectando a $DEVICE..."
echo "Por favor ingresa la contraseña cuando se solicite"
echo ""

# Buscar client.py
echo "Buscando client.py..."
ssh $DEVICE "find ~ -name 'client.py' -type f 2>/dev/null | head -5"

echo ""
echo "Verificando servicios systemd..."
ssh $DEVICE "systemctl list-units --type=service --all | grep -i radio"

echo ""
echo "Buscando en directorios comunes..."
ssh $DEVICE "ls -la ~/radio-client/client.py 2>/dev/null || ls -la ~/client.py 2>/dev/null || ls -la /home/*/radio-client/client.py 2>/dev/null || echo 'No encontrado en ubicaciones comunes'"

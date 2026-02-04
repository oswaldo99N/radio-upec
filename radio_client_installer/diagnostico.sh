#!/bin/bash

# Script de Diagnóstico para Radio UPEC
# Ejecuta este script en la Raspberry Pi para diagnosticar problemas

echo "========================================="
echo "  Diagnóstico Radio UPEC Client"
echo "========================================="
echo ""
date
echo ""

# 1. Estado del servicio
echo "========================================="
echo "1. ESTADO DEL SERVICIO"
echo "========================================="
systemctl status radio-upec --no-pager
echo ""

# 2. Verificar si está ejecutándose
echo "========================================="
echo "2. PROCESOS EN EJECUCIÓN"
echo "========================================="
echo "Python processes:"
ps aux | grep "[p]ython.*client.py"
echo ""
echo "MPV processes:"
ps aux | grep "[m]pv"
echo ""

# 3. Últimos 50 logs del servicio
echo "========================================="
echo "3. ÚLTIMOS 50 LOGS DEL SERVICIO"
echo "========================================="
journalctl -u radio-upec -n 50 --no-pager
echo ""

# 4. Verificar socket de MPV
echo "========================================="
echo "4. SOCKET DE MPV"
echo "========================================="
if [ -e /tmp/mpv_socket ]; then
    echo "✓ Socket de MPV existe: /tmp/mpv_socket"
    ls -lh /tmp/mpv_socket
else
    echo "✗ Socket de MPV NO existe"
fi
echo ""

# 5. Verificar configuración
echo "========================================="
echo "5. CONFIGURACIÓN"
echo "========================================="
if [ -f ~/pi-client/config.json ]; then
    echo "Archivo config.json:"
    cat ~/pi-client/config.json
else
    echo "✗ config.json NO encontrado"
fi
echo ""

# 6. Test de conectividad al servidor
echo "========================================="
echo "6. CONECTIVIDAD AL SERVIDOR"
echo "========================================="
if [ -f ~/pi-client/config.json ]; then
    SERVER_IP=$(cat ~/pi-client/config.json | grep server_url | cut -d'"' -f4 | sed 's|http://||' | cut -d':' -f1)
    SERVER_PORT=$(cat ~/pi-client/config.json | grep server_url | cut -d'"' -f4 | sed 's|http://||' | cut -d':' -f2)
    
    echo "Probando conectividad a: $SERVER_IP:$SERVER_PORT"
    ping -c 3 $SERVER_IP
    echo ""
    echo "Probando puerto $SERVER_PORT:"
    timeout 3 bash -c "cat < /dev/null > /dev/tcp/$SERVER_IP/$SERVER_PORT" && echo "✓ Puerto accesible" || echo "✗ Puerto NO accesible"
fi
echo ""

# 7. Dispositivos de audio
echo "========================================="
echo "7. DISPOSITIVOS DE AUDIO"
echo "========================================="
aplay -l 2>/dev/null || echo "No se pudieron listar dispositivos de audio"
echo ""

# 8. Uso de red
echo "========================================="
echo "8. ESTADO DE RED"
echo "========================================="
ip addr show | grep "inet "
echo ""

# 9. Memoria y CPU
echo "========================================="
echo "9. RECURSOS DEL SISTEMA"
echo "========================================="
free -h
echo ""
uptime
echo ""

# 10. Errores recientes
echo "========================================="
echo "10. ERRORES RECIENTES EN LOGS"
echo "========================================="
journalctl -u radio-upec -p err -n 20 --no-pager
echo ""

echo "========================================="
echo "  Diagnóstico Completado"
echo "========================================="
echo ""
echo "Para ver logs en tiempo real:"
echo "  journalctl -u radio-upec -f"
echo ""
echo "Para reiniciar el servicio:"
echo "  sudo systemctl restart radio-upec"
echo ""

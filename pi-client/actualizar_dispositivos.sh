#!/bin/bash
# Script de actualización automática con contraseña

PASSWORD="123"

echo "=========================================="
echo "Actualización Automática - Radio UPEC"
echo "=========================================="
echo ""

update_device() {
    local device=$1
    local ip=$(echo "$device" | cut -d'@' -f2)
    
    echo "📡 Actualizando: $device"
    echo "=========================================="
    
    # 1. Ping
    echo "1️⃣  Verificando conectividad..."
    if ! ping -c 1 -W 2 "$ip" &> /dev/null; then
        echo "❌ No se puede alcanzar $ip"
        return 1
    fi
    echo "✓ Dispositivo alcanzable"
    
    # 2. Detectar ubicación
    echo "2️⃣  Detectando ubicación del cliente..."
    
    # Intentar ubicaciones comunes
    REMOTE_DIR=""
    for dir in "/home/raspberry/pi-client" "/home/raspberry2/pi-client" "/home/pi/pi-client" "/home/raspberry" "/home/raspberry2" "/home/pi" "/root"; do
        if sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$device" "test -f $dir/client.py" 2>/dev/null; then
            REMOTE_DIR="$dir"
            echo "✓ Encontrado en: $REMOTE_DIR"
            break
        fi
    done
    
    if [ -z "$REMOTE_DIR" ]; then
        echo "❌ No se pudo encontrar client.py"
        return 1
    fi
    
    # 3. Backup
    echo "3️⃣  Creando backup..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$device" "cd '$REMOTE_DIR' && cp client.py client.py.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null" 2>/dev/null
    echo "✓ Backup creado"
    
    # 4. Copiar
    echo "4️⃣  Copiando nuevo client.py..."
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no client.py "$device:$REMOTE_DIR/" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Error al copiar archivo"
        return 1
    fi
    echo "✓ Archivo copiado"
    
    # 5. Reiniciar
    echo "5️⃣  Reiniciando servicio..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$device" "sudo systemctl restart radio-client" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Error al reiniciar servicio"
        return 1
    fi
    echo "✓ Servicio reiniciado"
    
    # 6. Verificar
    echo "6️⃣  Verificando estado..."
    sleep 3
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$device" "sudo systemctl is-active radio-client" &>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Dispositivo actualizado correctamente"
        return 0
    else
        echo "⚠️  El servicio no está activo"
        return 1
    fi
}

# Verificar sshpass
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  brew install hudochenkov/sshpass/sshpass"
    echo ""
    exit 1
fi

# Dispositivos
DEVICES=("raspberry@172.20.248.102" "raspberry2@172.20.228.207")

echo "📋 Dispositivos a actualizar:"
for device in "${DEVICES[@]}"; do
    echo "  - $device"
done
echo ""

read -p "¿Continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""

SUCCESS=0
FAIL=0

for device in "${DEVICES[@]}"; do
    echo ""
    if update_device "$device"; then
        ((SUCCESS++))
    else
        ((FAIL++))
    fi
    echo ""
done

echo "=========================================="
echo "📊 RESUMEN"
echo "=========================================="
echo "✅ Exitosas: $SUCCESS"
echo "❌ Fallidas: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 ¡Actualización completada!"
    echo "Verifica en: http://localhost:3000"
else
    echo "⚠️  Algunas actualizaciones fallaron"
fi

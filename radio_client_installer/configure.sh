#!/bin/bash

# Script de Configuración para Radio UPEC
# Este script configura la conexión al servidor para el cliente Raspberry Pi

echo "========================================="
echo "  Configuración Cliente Radio UPEC"
echo "========================================="
echo ""

# Verificar que se ejecute desde el directorio correcto
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Función para validar IP
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Función para verificar conectividad
test_server_connection() {
    local server_url=$1
    echo "Verificando conectividad con el servidor..."
    
    # Extraer IP y puerto de la URL
    local ip=$(echo $server_url | sed -n 's|http://\([^:]*\):.*|\1|p')
    local port=$(echo $server_url | sed -n 's|.*:\([0-9]*\)|\1|p')
    
    # Verificar si el puerto está abierto
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$ip/$port" 2>/dev/null; then
        echo "✓ Servidor accesible en $server_url"
        return 0
    else
        echo "⚠ ADVERTENCIA: No se pudo conectar al servidor en $server_url"
        echo "  Verifica que:"
        echo "  - El servidor esté ejecutándose"
        echo "  - La IP y puerto sean correctos"
        echo "  - No haya firewall bloqueando la conexión"
        read -p "¿Deseas continuar de todas formas? (s/n): " continue_anyway
        if [[ $continue_anyway == "s" || $continue_anyway == "S" ]]; then
            return 0
        else
            return 1
        fi
    fi
}

# Leer configuración existente si existe
if [ -f "config.json" ]; then
    echo "Se encontró una configuración existente."
    cat config.json
    echo ""
    read -p "¿Deseas actualizar la configuración? (s/n): " update_config
    if [[ $update_config != "s" && $update_config != "S" ]]; then
        echo "Configuración no modificada."
        exit 0
    fi
fi

echo ""
echo "Ingresa la configuración del servidor:"
echo "---------------------------------------"

# Solicitar IP del servidor
while true; do
    read -p "IP del servidor (ej: 192.168.1.100): " server_ip
    
    if validate_ip "$server_ip"; then
        break
    else
        echo "⚠ IP inválida. Por favor ingresa una IP válida (ej: 192.168.1.100)"
    fi
done

# Solicitar puerto del servidor
read -p "Puerto del servidor (default 3000): " server_port
server_port=${server_port:-3000}

# Construir URL del servidor
server_url="http://$server_ip:$server_port"

# Verificar conectividad
if ! test_server_connection "$server_url"; then
    echo "Configuración cancelada."
    exit 1
fi

# Solicitar nombre del dispositivo (opcional)
echo ""
default_name=$(hostname)
read -p "Nombre del dispositivo (opcional, Enter para usar '$default_name'): " device_name
device_name=${device_name:-""}

# Preguntar si debe reproducir automáticamente
echo ""
read -p "¿Reproducir radio automáticamente al iniciar? (S/n): " auto_play_input
auto_play_input=${auto_play_input:-s}
if [[ $auto_play_input == "s" || $auto_play_input == "S" ]]; then
    auto_play="true"
else
    auto_play="false"
fi

# Crear archivo de configuración
echo ""
echo "Generando archivo de configuración..."

cat > config.json <<EOF
{
  "server_url": "$server_url",
  "device_name": "$device_name",
  "auto_play": $auto_play
}
EOF

echo "✓ Configuración guardada en config.json"
echo ""
echo "Contenido:"
cat config.json
echo ""
echo "========================================="
echo "  Configuración completada exitosamente"
echo "========================================="
echo ""
echo "Siguiente paso: Ejecuta 'sudo ./install.sh' para instalar el servicio"

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

# Función para verificar conectividad
test_server_connection() {
    local url=$1
    echo "Verificando conectividad con el servidor..."
    
    # Intentar conexión con curl (soporta HTTP y HTTPS)
    if command -v curl &> /dev/null; then
        if curl --output /dev/null --silent --head --fail "$url"; then
            echo "✓ Servidor accesible en $url"
            return 0
        fi
    elif command -v wget &> /dev/null; then
        if wget -q --spider "$url"; then
            echo "✓ Servidor accesible en $url"
            return 0
        fi
    fi

    # Fallback o si falla curl/wget
    echo "⚠ ADVERTENCIA: No se pudo verificar la conexión a $url"
    echo "  (Esto puede ser normal si el servidor bloquea pings o respuestas vacías)"
    read -p "¿Deseas continuar de todas formas? (s/n): " continue_anyway
    if [[ $continue_anyway == "s" || $continue_anyway == "S" ]]; then
        return 0
    else
        return 1
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
echo "Ejemplos:"
echo "  - Cloud: https://radio-upec.onrender.com"
echo "  - Local: http://192.168.1.100:3000"
echo ""

while true; do
    read -p "URL del servidor: " server_url
    
    # Validación básica (debe empezar con http:// o https://)
    if [[ $server_url =~ ^https?:// ]]; then
        break
    else
        echo "⚠ La URL debe comenzar con http:// o https://"
        # Intento de corrección automática
        read -p "¿Quisiste decir http://$server_url? (s/n): " try_fix
        if [[ $try_fix == "s" || $try_fix == "S" ]]; then
             server_url="http://$server_url"
             break
        fi
    fi
done

# Eliminar barra final si existe
server_url=${server_url%/}

# Verificar conectividad
test_server_connection "$server_url"

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
echo "Si ya estaba instalado: 'sudo systemctl restart radio-upec'"
echo ""

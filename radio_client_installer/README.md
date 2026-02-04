# Instalación de Radio UPEC Client

Este paquete contiene todo lo necesario para instalar el cliente de radio en una nueva Raspberry Pi.

## Pasos de Instalación

1. **Copiar Archivos**: Transfiere esta carpeta a tu Raspberry Pi (por USB, SCP o descarga).

2. **Configurar**:
    Ejecuta el script de configuración para conectar con el servidor:

    ```bash
    ./configure.sh
    ```

    (Te pedirá la IP del servidor y el nombre del dispositivo).

3. **Instalar**:
    Ejecuta el script de instalación con permisos de administrador:

    ```bash
    sudo ./install.sh
    ```

    Esto instalará todas las dependencias (mpv, python, etc.) y configurará el servicio para que arranque automáticamente.

## Comandos Útiles

- **Ver estado**: `systemctl status radio-upec`
- **Reiniciar servicio**: `sudo systemctl restart radio-upec`
- **Diagnóstico**: `./diagnostico.sh` (si tienes problemas)

## Notas

- El ID del dispositivo se generará automáticamente la primera vez.
- Si necesitas cambiar la IP del servidor en el futuro, vuelve a ejecutar `./configure.sh` y luego reinicia el servicio.

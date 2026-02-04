# Guía de Actualización - Cliente Radio UPEC

## 📋 Dispositivos a actualizar

1. **Dispositivo 1**: 172.20.248.102
2. **Dispositivo 2**: 172.20.228.207

---

## 🚀 Pasos para actualizar cada Raspberry Pi

### **Paso 1: Conectarse por SSH**

Abre una terminal en tu Mac y conéctate a la primera Raspberry Pi:

```bash
ssh pi@172.20.248.102
```

> **Nota**: Si el usuario no es `pi`, prueba con `ubuntu` o el usuario que uses normalmente.
> Te pedirá la contraseña de la Raspberry Pi.

---

### **Paso 2: Ir al directorio del cliente**

Una vez conectado, ve al directorio donde está instalado el cliente:

```bash
cd ~/radio-client
```

> **Nota**: Si está en otra ubicación, ajusta la ruta. Puedes verificar con `ls` que veas el archivo `client.py`.

---

### **Paso 3: Hacer backup del archivo actual**

Antes de actualizar, haz una copia de seguridad:

```bash
cp client.py client.py.backup
```

---

### **Paso 4: Copiar el nuevo archivo**

**Opción A - Desde tu Mac (RECOMENDADO):**

Abre una **nueva terminal** en tu Mac (sin cerrar la conexión SSH) y ejecuta:

```bash
cd /Users/anthonynarvaez/Downloads/RadioOnelineUPEC/pi-client
scp client.py pi@172.20.248.102:~/radio-client/
```

Te pedirá la contraseña de la Raspberry Pi.

**Opción B - Editar manualmente:**

Si prefieres editar el archivo directamente en la Raspberry Pi:

```bash
nano client.py
```

Busca la función `connect()` (alrededor de la línea 192) y reemplaza el código para que quede así:

```python
@sio.event
def connect():
    print('✓ Conectado al servidor')
    ip_address = subprocess.check_output(['hostname', '-I']).decode().strip().split(' ')[0]
    
    # Get the current system username
    try:
        username = subprocess.check_output(['whoami']).decode().strip()
    except:
        username = 'pi'  # Default fallback
    
    sio.emit('register_device', {
        'id': DEVICE_ID,
        'name': DEVICE_NAME,
        'ip': ip_address,
        'username': username
    })
```

Guarda con `Ctrl+O`, Enter, y sal con `Ctrl+X`.

---

### **Paso 5: Reiniciar el servicio**

Reinicia el servicio del cliente para aplicar los cambios:

```bash
sudo systemctl restart radio-client
```

---

### **Paso 6: Verificar que funciona**

Verifica que el servicio esté corriendo correctamente:

```bash
sudo systemctl status radio-client
```

Deberías ver algo como:

```
● radio-client.service - Radio UPEC Client
   Active: active (running)
```

Para ver los logs en tiempo real:

```bash
sudo journalctl -u radio-client -f
```

Presiona `Ctrl+C` para salir de los logs.

---

### **Paso 7: Desconectarse**

```bash
exit
```

---

### **Paso 8: Repetir para el segundo dispositivo**

Repite todos los pasos anteriores para la segunda Raspberry Pi:

```bash
ssh pi@172.20.228.207
```

Y sigue los mismos pasos del 2 al 7.

---

## ✅ Verificación Final

1. Abre el panel de administración en tu navegador: `http://localhost:3000`
2. Deberías ver ahora en cada dispositivo algo como:

   ```
   Usuario: pi@172.20.248.102
   ```

   En lugar de solo la IP.

---

## 🆘 Solución de Problemas

### El servicio no arranca

```bash
sudo journalctl -u radio-client -n 50
```

Esto muestra los últimos 50 logs para ver el error.

### Restaurar el backup si algo sale mal

```bash
cd ~/radio-client
cp client.py.backup client.py
sudo systemctl restart radio-client
```

### No puedo conectarme por SSH

- Verifica que las IPs sean correctas
- Asegúrate de que SSH esté habilitado en las Raspberry Pi
- Prueba hacer ping primero: `ping 172.20.248.102`

---

## 📝 Notas Importantes

- **No cierres** la conexión SSH hasta verificar que el servicio funciona
- Si algo falla, siempre puedes restaurar el backup
- Los cambios se aplican inmediatamente al reiniciar el servicio
- No es necesario reiniciar la Raspberry Pi completa

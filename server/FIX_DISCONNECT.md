# ✅ Corrección Aplicada: Detección de Desconexión

## 🐛 Problema

Cuando apagabas la Raspberry Pi, el panel seguía mostrándola como "en línea" y "al aire".

## ✅ Solución

Actualizado el servidor para que cuando un dispositivo se desconecte:

1. Actualice el estado a **`offline`**
2. Actualice `is_playing` a **`false`**
3. Notifique a todos los paneles conectados

## 📝 Cambio Realizado

**Archivo:** `server/index.js` (línea 208)

**Antes:**

```javascript
db.prepare("UPDATE devices SET status = 'offline' WHERE id = ?").run(deviceId);
```

**Después:**

```javascript
db.prepare("UPDATE devices SET status = 'offline', is_playing = 0 WHERE id = ?").run(deviceId);
```

---

## 🚀 Cómo Aplicar el Cambio

### Paso 1: Reiniciar el Servidor

En la terminal donde está corriendo `npm run dev`, presiona:

**`Ctrl+C`** (para detener)

Luego ejecuta de nuevo:

```bash
npm run dev
```

### Paso 2: Recargar el Panel

En tu navegador (donde tienes abierto `localhost:5173`), recarga la página:

**`Cmd+R`** o **`F5`**

---

## ✅ Verificación

### Test 1: Apagar Raspberry Pi

1. **Enciende** la Raspberry Pi
2. Verifica que aparezca como **"En línea"** en el panel
3. **Apaga** la Raspberry Pi
4. Espera 5-10 segundos
5. **Recarga** el panel
6. Ahora debería aparecer como **"Fuera de línea"** ⚠️

### Test 2: Cerrar Cliente

En la Raspberry Pi:

```bash
sudo systemctl stop radio-upec
```

En el panel web, el dispositivo debería cambiar a **"Fuera de línea"** automáticamente.

---

## 📊 Comportamiento Correcto

| Acción | Estado en Panel | Estado "Al Aire" |
|--------|----------------|------------------|
| Raspberry encendida y conectada | ✅ En línea | ✅ Sí (si está reproduciendo) |
| Raspberry apagada | ⚠️ Fuera de línea | ❌ No |
| Servicio detenido | ⚠️ Fuera de línea | ❌ No |
| Pierde conexión WiFi | ⚠️ Fuera de línea | ❌ No |

---

## 💡 Próximo Paso

**Reinicia el servidor AHORA** para que el cambio tome efecto:

```bash
# En la terminal del servidor (presiona Ctrl+C primero)
npm run dev
```

El servidor se reiniciará y ahora detectará correctamente las desconexiones.

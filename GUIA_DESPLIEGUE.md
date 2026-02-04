# Guía de Despliegue: Radio UPEC "Siempre en Línea"

Esta guía te ayudará a poner tu servidor de Radio UPEC en internet de forma gratuita y permanente.

## Parte 1: Base de Datos (MongoDB Atlas)

Necesitamos un lugar donde guardar los datos que no se borre.

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) y regístrate (es gratis).
2. Crea un **Cluster** (selecciona la opción **FREE** / **M0 Sandbox**).
3. **Configura el Acceso**:
    * En **Database User**, crea un usuario (ej: `admin`) y una contraseña segura. **¡APÚNTALA!**
    * En **Network Access**, haz clic en "Add IP Address" y selecciona **"Allow Access from Anywhere" (0.0.0.0/0)**. Esto es vital para que Render pueda conectarse.
4. **Obtén tu URL de Conexión**:
    * Dale a **Connect** > **Drivers**.
    * Copia la "Connection String". Se verá algo así:
        `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    * Reemplaza `<password>` por tu contraseña real. **Guarda este enlace secreto.**

## Parte 2: Preparar el Código (GitHub)

Asegúrate de que todo tu código actualizado esté en GitHub.

1. Si no tienes un repositorio, crea uno en [GitHub](https://github.com/new).
2. Sube tus archivos (puedes usar GitHub Desktop o la terminal).

## Parte 3: Servidor en la Nube (Render)

Render alojará tu página web y el servidor.

1. Ve a [Render](https://render.com/) y crea una cuenta.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub.
4. Configura lo siguiente:
    * **Name**: `radio-upec` (o lo que quieras).
    * **Environment**: `Node`
    * **Build Command**: `cd server && npm install && cd ../admin-panel && npm install && npm run build`
    * **Start Command**: `cd server && node index.js`
    * **Instance Type**: Free
5. **Variables de Entorno (Environment Variables)**:
    Haz clic en "Advanced" o "Environment" y añade:
    * `MONGO_URI`: Pega aquí tu URL de conexión de MongoDB (la del paso 1.4).
    * `NODE_ENV`: `production`
6. Dale a **Create Web Service**.

## Parte 4: "Siempre en Línea" (Evitar que se duerma)

El plan gratuito de Render se "duerme" si nadie lo usa por 15 minutos. Para evitar que tus dispositivos se desconecten:

1. Ve a [UptimeRobot](https://uptimerobot.com/) (es gratis).
2. Crea un **New Monitor**.
    * **Type**: HTTP(s).
    * **Friendly Name**: Radio UPEC.
    * **URL**: Pega la dirección web que te dió Render (ej: `https://radio-upec.onrender.com`).
    * **Interval**: 5 minutes.
3. ¡Listo! Esto "pingueará" tu servidor cada 5 minutos para mantenerlo despierto las 24 horas.

# Guía de Desarrollo y Despliegue: Un lugar para nosotros dos

Este documento explica paso a paso cómo correr el proyecto localmente, ejecutar pruebas unitarias y desplegarlo en la nube para que Carlos y Mimie puedan abrirlo juntos desde sus teléfonos móviles.

---

## 1. Requisitos Previos

- **Node.js**: Versión 20 LTS o superior.
  - En Windows se puede instalar ejecutando en PowerShell:
    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```
- **Gestor de Paquetes**: `pnpm` (recomendado) o `npm`.
  - Para instalar pnpm globalmente:
    ```powershell
    npm install -g pnpm
    ```

---

## 2. Instalación y Ejecución Local

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Configurar el entorno**:
   - Copia `.env.example` como `.env`:
     ```bash
     cp .env.example .env
     ```
   - Rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con las credenciales de tu proyecto Supabase.

3. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000` (o el puerto indicado por TanStack Start / Nitro).

4. **Ejecutar pruebas unitarias**:
   ```bash
   pnpm run test
   ```
   Ejecuta la suite completa de pruebas en Vitest (versículos NTV, economía de Appa, cultivo del lirio y lógica del quiz).

---

## 3. Despliegue en la Nube (Vercel / Netlify / Lovable)

Para que tanto Carlos como Mimie puedan abrir la app en cualquier momento desde su navegador móvil o agregarla a la pantalla de inicio como PWA:

### Opción A: Vercel (Recomendado)
1. Sube este repositorio a una cuenta de GitHub (privado).
2. Entra a [vercel.com](https://vercel.com) y conecta el repositorio.
3. El preset detectará automáticamente TanStack Start / Nitro o Vite.
4. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Haz clic en **Deploy**. Tendrán una URL pública protegida por contraseña y login (ej: `https://nuestro-rincon.vercel.app`).

### Opción B: Instalar como PWA en el Celular
1. Abre el enlace desplegado en Safari (iPhone) o Chrome (Android).
2. Toca en **Compartir** o los 3 puntos del navegador.
3. Selecciona **"Agregar a la pantalla de inicio"** (Add to Home Screen).
4. La app se abrirá en pantalla completa sin barra del navegador, con el icono de Appa y el lirio rosa.

---

## 4. Hoja de Ruta Futura (Ideas Opcionales)

- **Notificaciones Push**: Avisos cuando tu amor te deje un regalo de Levi o una nota post-it sorpresa en el dormitorio de Appa.
- **Álbum de Fotos por Estaciones**: Organización automática de fotos en primavera, verano, otoño e invierno.
- **Modo Audio / Música**: Lista de reproducción compartida para escuchar canciones juntos mientras cuidan el lirio.

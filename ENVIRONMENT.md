# Configuración del Entorno y Variables: Un lugar para nosotros dos

Este documento explica cómo configurar las credenciales seguras para desplegar y ejecutar el proyecto en desarrollo o producción.

---

## 1. Archivo de Variables de Entorno

El archivo `.env` almacena las claves sensibles y **NUNCA** debe subirse a repositorios públicos de Git.
Se incluye una plantilla segura en [`.env.example`](file:///C:/Users/delac_5w/.gemini/antigravity/scratch/un-lugar-para-nosotros-dos/.env.example).

### Contenido de `.env.example`:

```bash
# Supabase Configuration
# Obtén estas claves en tu panel de Supabase: Project Settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 2. Instrucciones para Configurar Supabase

1. Crea o ingresa a tu proyecto en [Supabase](https://supabase.com).
2. Dirígete a **Project Settings** > **API**.
3. Copia la **Project URL** y colócala en `VITE_SUPABASE_URL`.
4. Copia la clave **Project API key (anon / public)** y colócala en `VITE_SUPABASE_ANON_KEY`.
5. En la sección **SQL Editor** de Supabase, ejecuta las migraciones ubicadas en `drizzle/migrations/` en orden correlativo (o ejecuta `pnpm run db:push` si configuras la conexión directa de Postgres).

---

## 3. Protección de Secretos

El archivo [`.gitignore`](file:///C:/Users/delac_5w/.gemini/antigravity/scratch/un-lugar-para-nosotros-dos/.gitignore) contiene reglas específicas para evitar fugas accidentales:
```gitignore
.env
.env.*
!.env.example
```
Cualquier clave que comience con `VITE_` será expuesta en el código del cliente para conectarse a Supabase. La seguridad de la aplicación descansa enteramente en las políticas de **Row Level Security (RLS)** y las funciones `SECURITY DEFINER` de PostgreSQL.

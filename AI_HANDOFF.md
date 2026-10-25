# AI Handoff & Developer Guide: Un lugar para nosotros dos

Este documento sirve como resumen maestro para cualquier desarrollador o asistente de IA que retome el proyecto.

---

## 1. Contexto y Propósito

"Un lugar para nosotros dos" es una aplicación web romántica privada y exclusiva para dos personas (**Carlos & Mimie**). 
Todo el diseño está concebido para fomentar la cercanía, la complicidad, el cuidado mutuo y la ternura a distancia.

---

## 2. Invariantes Clave que NUNCA deben romperse

1. **Nunca eliminar ni romper funcionalidades existentes**:
   - Banco de mensajes diarios (`bank_messages`).
   - Diarios compartidos y privados (`journal_entries`).
   - Álbum de recuerdos fotográficos (`memories`).
   - Fechas especiales y cuenta regresiva (`special_dates`).
   - Cápsulas del tiempo selladas (`time_capsules`).
   - Espacio espiritual y devocionales con versículos NTV (`spiritual_items`).
   - Tienda de Appa, 8 minijuegos y sopa de letras progresiva.

2. **Aislamiento Estético**:
   - La aplicación general se mantiene en tonos crema cálido (`#F7F0E6`), rosa lirio (`#E8B9C4`) y tipografía Garamond / Karla.
   - La **estética de L (Death Note)** solo vive en el expediente/cartas confidenciales (`src/components/Correspondence.tsx` con clase `.l-dossier-card`).
   - La **estética de Levi Ackerman** solo vive en la sección de regalos de honor (`src/components/LeviGifts.tsx` y `src/routes/_authenticated/regalos.tsx`).

3. **Zona Horaria Oficial**:
   - Todo cálculo de día actual (`dominicanToday()`) utiliza la zona horaria **`America/Santo_Domingo`** (UTC-4) para que ambos vean siempre exactamente la misma información sincronizada.

4. **Traducción Bíblica**:
   - Todos los versículos en `src/lib/bible-verses.ts` provienen de la **Nueva Traducción Viviente (NTV)**. No revertir a versiones arcaicas de Reina-Valera 1909.

5. **Protección de Datos y Secretos**:
   - El archivo `.env` está en `.gitignore`. Nunca exponer claves ni secrets en commits ni outputs.

---

## 3. Mapa de Rutas y Componentes Clave

- `src/routes/__root.tsx`: Layout raíz, suscripción Realtime a todas las tablas y proveedor de TanStack Query.
- `src/routes/index.tsx`: Portada principal, contador de amor, versículo del día y accesos rápidos.
- `src/routes/_authenticated/mensajes.tsx` & `src/components/Correspondence.tsx`: Cartas de amor con estética L, sellos y borradores automáticos.
- `src/routes/_authenticated/regalos.tsx` & `src/components/LeviGifts.tsx`: Salón de regalos sobrios estilo Levi Ackerman.
- `src/routes/_authenticated/appa.tsx`: Hogar 2.5D de Appa, caminata interactiva, notas post-it en paredes, cuidado y minijuegos.
- `src/components/AppaRoom.tsx`: Renderizado espacial de habitaciones con soporte para clics en el suelo y rotación de muebles.
- `src/routes/_authenticated/lirio.tsx` & `src/components/LilyScene.tsx`: Planta viva con modelo de humedad, drenaje, luz, abono y señales de estrés no punitivas.
- `src/routes/_authenticated/quiz.tsx` & `src/components/CoupleQuiz.tsx`: Juego "¿Cuánto nos conocemos?" con respuestas secretas y revelación simultánea.
- `src/lib/bible-verses.ts`: 90 versículos auténticos NTV en 6 categorías con función determinista `dailyVerse()`.
- `drizzle/migrations/`: 25 migraciones SQL listas para ser ejecutadas en Supabase (`0000` a `0024`).

---

## 4. Estado de las Fases Implementadas

- **Fase 1 (Seguridad y Versículos NTV)**: ✅ Completada.
- **Fase 2 (Cartas estilo L y Regalos estilo Levi)**: ✅ Completada.
- **Fase 3 (Appa Mascota Viva 2.5D y Notas Sorpresa)**: ✅ Completada.
- **Fase 4 (Lirio Compartido Cultivo Profundo)**: ✅ Completada.
- **Fase 5 (Juego "¿Cuánto nos conocemos?")**: ✅ Completada.
- **Fase 6 (Estabilidad, Documentación y Preparación GitHub)**: ✅ Completada.

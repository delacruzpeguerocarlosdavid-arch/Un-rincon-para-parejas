# Estructura de Base de Datos y Migraciones: Un lugar para nosotros dos

Este documento detalla el esquema relacional de PostgreSQL en Supabase, las políticas de Row Level Security (RLS) y el historial de migraciones.

---

## 1. Índice de Migraciones

| Migración | Propósito y Contenido Principal |
| :--- | :--- |
| `0000_private_message_bank` | Tablas de mensajes del banco, estados de aprobación y mensajes diarios. |
| `0001_profiles_and_invite_codes` | Perfiles de usuario (`profiles`), avatares, roles y sistema de invitaciones. |
| `0002_invite_attempts_persist` | Control de intentos de unión a espacios privados. |
| `0003_private_correspondence_library` | Biblioteca de cartas, carpetas y lecturas mutuas. |
| `0004_correspondence_explicit_grants` | Permisos explícitos y programación horaria de correspondencia. |
| `0005_stage3_memories_journals_dates` | Álbum de recuerdos, entradas de diario y fechas especiales. |
| `0006_private_daily_emotions` | Registro de emociones diarias y estado anímico. |
| `0007_emotions_explicit_read_only` | Ajustes de permisos de solo lectura para emociones. |
| `0008_spiritual_space` | Espacio espiritual, peticiones de oración y versículos bíblicos. |
| `0009_appa_pet` | Modelo inicial de la mascota Appa e interacciones. |
| `0010_appa_store_levels_games` | Tienda de comida, niveles de experiencia y resultados de minijuegos. |
| `0011_appa_live_stats` | Estado en tiempo real de hambre, felicidad, energía y sueño. |
| `0012_appa_shared_house` | Habitaciones compartidas (sala, cocina, dormitorio, baño) y catálogo de muebles. |
| `0013_capsules_wordsearch_safe` | Cápsulas del tiempo y sopa de letras romántica. |
| `0014_safe_space_lifecycle_hardening` | Seguridad y endurecimiento del ciclo de vida del espacio privado. |
| `0015_shared_lily_plant` | Primera versión de la planta de lirio rosa compartido y conteo de cuidados. |
| `0016_daily_care_ritual` | Racha de cuidados diarios del lirio y Appa. |
| `0017_lily_extra_care_more_games` | Abono orgánico, plagas, canciones y más minijuegos para Appa. |
| `0018_appa_wardrobe` | Armario de accesorios y ropa para personalizar a Appa. |
| `0019_word_search_levels` | Niveles progresivos para la sopa de letras. |
| `0020_fix_invites_and_pending` | Corrección de invitaciones y redacción pendiente de pareja. |
| **`0021_l_letters_and_levi_gifts`** | **Cartas estilo L (Death Note) y tabla `couple_gifts` con estética de Levi.** |
| **`0022_appa_living_pet_and_house`** | **Appa vivo (`pos_x`, `pos_y`, orientación, notas post-it `appa_house_notes`).** |
| **`0023_lily_deep_cultivation`** | **Cultivo profundo del lirio (columna `drain_at`, drenaje, aireación del sustrato).** |
| **`0024_couple_quiz_game`** | **Juego "¿Cuánto nos conocemos?", rondas, respuestas secretas y banco de 40 preguntas.** |

---

## 2. Tablas Principales

### `private_spaces`
Representa el espacio privado compartido por Carlos y Mimie.
- `id` (uuid, PK)
- `owner_id` (uuid)
- `partner_email` (text)
- `created_at` (timestamptz)

### `profiles`
Perfil público para los miembros del espacio.
- `id` (uuid, PK, ref `auth.users`)
- `display_name` (text)
- `nickname` (text)
- `avatar` (text)

### `couple_gifts` (Fase 2)
Obsequios de honor mutuos (estética Levi).
- `id` (uuid, PK)
- `space_id` (uuid, FK `private_spaces`)
- `sender_id` (uuid, FK `profiles`)
- `recipient_id` (uuid, FK `profiles`)
- `gift_id` (text: `'tea'`, `'blade'`, `'scarf'`, etc.)
- `title` (text)
- `message` (text)
- `opened_at` (timestamptz, null mientras esté sin abrir)
- `created_at` (timestamptz)

### `appa_state` & `appa_house_notes` (Fase 3)
- `appa_state`:
  - `hunger`, `happiness`, `energy`, `sleeping_since`
  - `pos_x` (int, 15-85% del ancho de la sala)
  - `pos_y` (int, altura sobre el suelo)
  - `facing` (text: `'left'` | `'right'`)
  - `current_room` (text: `'sala'`, `'cocina'`, `'dormitorio'`, `'bano'`)
- `appa_house_notes`:
  - `id` (uuid, PK)
  - `space_id` (uuid, FK)
  - `author_id` (uuid, FK)
  - `room` (text)
  - `content` (text)
  - `read_at` (timestamptz)

### `lily_plant` (Fase 4)
- `space_id` (uuid, PK)
- `sun_at`, `water_at`, `prune_at`, `feed_at`, `pests_at`, `song_at`, `drain_at` (timestamptz)
- `care_count` (int)
- `last_by` (uuid)

### `couple_quiz_questions`, `rounds` & `answers` (Fase 5)
- `couple_quiz_questions`: Banco de 40 preguntas ordenadas.
- `couple_quiz_rounds`: Rondas diarias por espacio con `revealed_at`.
- `couple_quiz_answers`: Respuestas individuales confidenciales. RLS impide leer la respuesta de la pareja hasta que `round.revealed_at IS NOT NULL`.

---

## 3. Realtime y Seguridad Definer

Todas las acciones críticas utilizan funciones PostgreSQL con `SECURITY DEFINER` y `search_path = public`:
- `send_couple_gift(...)`
- `open_couple_gift(...)`
- `appa_move(...)`
- `appa_leave_note(...)`
- `appa_read_note(...)`
- `appa_save_furniture_layout(...)`
- `lily_care(...)`
- `submit_quiz_answer(...)`

Las tablas están suscritas a `supabase_realtime` para actualización reactiva en cliente sin necesidad de recargar la página.

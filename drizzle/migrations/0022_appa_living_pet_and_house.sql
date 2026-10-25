-- Migración 0022: Appa Mascota Viva (2D/2.5D), Posicionamiento, Personalización de Casa y Notas Sorpresa

-- 1. Coordenadas y postura para Appa como mascota viva
ALTER TABLE public.appa_state 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 10 AND 90),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 60 CHECK (pos_y BETWEEN 30 AND 85),
ADD COLUMN IF NOT EXISTS facing text NOT NULL DEFAULT 'right' CHECK (facing IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS current_room text NOT NULL DEFAULT 'sala' CHECK (current_room IN ('sala', 'cocina', 'dormitorio', 'bano'));

-- 2. Coordenadas, rotación y variantes para muebles
ALTER TABLE public.appa_furniture 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 5 AND 95),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 60 CHECK (pos_y BETWEEN 20 AND 85),
ADD COLUMN IF NOT EXISTS flipped boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT 'default';

-- 3. Notas adhesivas / Post-its románticos en las habitaciones
CREATE TABLE IF NOT EXISTS public.appa_house_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  room text NOT NULL CHECK (room IN ('sala', 'cocina', 'dormitorio', 'bano')),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz DEFAULT NULL
);

GRANT SELECT ON public.appa_house_notes TO authenticated;
GRANT ALL ON public.appa_house_notes TO service_role;
ALTER TABLE public.appa_house_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY house_notes_read ON public.appa_house_notes FOR SELECT TO authenticated
USING (space_id = public.my_space());

CREATE INDEX IF NOT EXISTS house_notes_space ON public.appa_house_notes(space_id, room, created_at DESC);

-- Función para actualizar posición y orientación de Appa en tiempo real
CREATE OR REPLACE FUNCTION public.appa_move(
  p_room text,
  p_pos_x numeric,
  p_pos_y numeric,
  p_facing text DEFAULT 'right'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  IF p_facing NOT IN ('left', 'right') THEN p_facing := 'right'; END IF;
  
  UPDATE public.appa_state 
  SET current_room = p_room,
      pos_x = greatest(10, least(90, p_pos_x)),
      pos_y = greatest(30, least(85, p_pos_y)),
      facing = p_facing,
      updated_at = now()
  WHERE space_id = s;
END $$;

REVOKE ALL ON FUNCTION public.appa_move(text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_move(text, numeric, numeric, text) TO authenticated;

-- Función para guardar la distribución y posición de un mueble
CREATE OR REPLACE FUNCTION public.appa_save_furniture_layout(
  p_item text,
  p_room text,
  p_pos_x numeric,
  p_pos_y numeric,
  p_flipped boolean DEFAULT false,
  p_variant text DEFAULT 'default'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room IS NOT NULL AND p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  
  PERFORM pg_advisory_xact_lock(hashtext('appa:' || s::text));
  
  UPDATE public.appa_furniture
  SET room = p_room,
      pos_x = greatest(5, least(95, p_pos_x)),
      pos_y = greatest(20, least(85, p_pos_y)),
      flipped = coalesce(p_flipped, false),
      variant = coalesce(p_variant, 'default')
  WHERE space_id = s AND item = p_item;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Mueble no encontrado.'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) TO authenticated;

-- Función para dejar una nota sorpresa en una habitación
CREATE OR REPLACE FUNCTION public.appa_leave_note(
  p_room text,
  p_content text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); result_id uuid;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'La nota debe tener entre 1 y 500 caracteres.';
  END IF;
  
  INSERT INTO public.appa_house_notes(space_id, author_id, room, content)
  VALUES (s, auth.uid(), p_room, btrim(p_content))
  RETURNING id INTO result_id;
  
  RETURN result_id;
END $$;

REVOKE ALL ON FUNCTION public.appa_leave_note(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_leave_note(text, text) TO authenticated;

-- Función para marcar una nota sorpresa como leída
CREATE OR REPLACE FUNCTION public.appa_read_note(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado.'; END IF;
  UPDATE public.appa_house_notes SET read_at = now() WHERE id = p_id AND space_id = public.my_space() AND read_at IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.appa_read_note(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_read_note(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_house_notes;

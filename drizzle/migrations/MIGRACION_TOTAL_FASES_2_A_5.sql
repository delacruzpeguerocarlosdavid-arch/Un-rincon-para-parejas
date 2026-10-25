-- ==============================================================================
-- MIGRACIÓN TOTAL CONSOLIDADA: FASES 2 A 5 (Carlos & Mimie)
-- ==============================================================================
-- 1. Cartas de L (Death Note) y Regalos de Levi Ackerman (Attack on Titan)
-- 2. Appa Mascota Viva (2.5D), Posiciones, Rotación de Muebles y Notas Post-it
-- 3. Cultivo Profundo del Lirio (Humedad, Drenaje y Aireación de Sustrato)
-- 4. Juego "¿Cuánto nos conocemos?" (Respuestas Secretas, Deducciones y Banco de Preguntas)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- FASE 2: CARTAS DE L Y REGALOS DE LEVI
-- ------------------------------------------------------------------------------
ALTER TABLE public.correspondence ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic' CHECK (theme IN ('classic', 'l_investigation'));
ALTER TABLE public.correspondence ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

DROP POLICY IF EXISTS correspondence_read ON public.correspondence;
CREATE POLICY correspondence_read ON public.correspondence FOR SELECT TO authenticated 
USING (space_id = public.my_space() AND (scheduled_at IS NULL OR scheduled_at <= now() OR author_id = auth.uid()));

DROP FUNCTION IF EXISTS public.save_correspondence(text,text,text,text,uuid);
DROP FUNCTION IF EXISTS public.save_correspondence(text,text,text,text,uuid,text,timestamptz);

CREATE OR REPLACE FUNCTION public.save_correspondence(
  p_kind text,
  p_title text,
  p_content text,
  p_folder text DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_theme text DEFAULT 'classic',
  p_scheduled_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; result uuid;
BEGIN
 PERFORM public.ensure_membership(); s:=public.my_space();
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('chat','note','letter','library') THEN RAISE EXCEPTION 'Tipo de mensaje inválido'; END IF;
 IF p_theme IS NULL OR p_theme NOT IN ('classic','l_investigation') THEN p_theme := 'classic'; END IF;
 IF p_title IS NULL OR length(btrim(p_title))>160 OR (p_kind IN ('letter','library') AND length(btrim(p_title))=0) THEN RAISE EXCEPTION 'El título debe tener entre 1 y 160 caracteres'; END IF;
 IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 20000 THEN RAISE EXCEPTION 'Escribe entre 1 y 20000 caracteres'; END IF;
 IF p_kind='library' THEN
  IF p_folder IS NULL OR p_folder NOT IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando sientas que no te escucho','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') THEN RAISE EXCEPTION 'Elige una carpeta válida'; END IF;
 ELSE p_folder:=NULL;
 END IF;
 
 IF p_scheduled_at IS NOT NULL AND p_scheduled_at < now() THEN
  p_scheduled_at := NULL;
 END IF;

 IF p_id IS NULL THEN
  INSERT INTO public.correspondence(space_id,author_id,kind,title,content,folder,theme,scheduled_at) 
  VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_folder,p_theme,p_scheduled_at) 
  RETURNING id INTO result;
 ELSE
  UPDATE public.correspondence 
  SET title=btrim(p_title),content=btrim(p_content),folder=p_folder,theme=p_theme,scheduled_at=p_scheduled_at,updated_at=now() 
  WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind=p_kind 
  RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios textos'; END IF;
 END IF;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_correspondence(
  p_kind text,
  p_title text,
  p_content text,
  p_folder text,
  p_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN public.save_correspondence(p_kind, p_title, p_content, p_folder, p_id, 'classic', NULL);
END $$;

REVOKE ALL ON FUNCTION public.save_correspondence(text,text,text,text,uuid,text,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_correspondence(text,text,text,text,uuid,text,timestamptz) TO authenticated;

CREATE TABLE IF NOT EXISTS public.couple_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  gift_id text NOT NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  opened_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.couple_gifts TO authenticated;
GRANT ALL ON public.couple_gifts TO service_role;
ALTER TABLE public.couple_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS couple_gifts_read ON public.couple_gifts;
CREATE POLICY couple_gifts_read ON public.couple_gifts FOR SELECT TO authenticated
USING (space_id = public.my_space());

CREATE INDEX IF NOT EXISTS couple_gifts_space_created ON public.couple_gifts(space_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.send_couple_gift(
  p_gift_id text,
  p_title text,
  p_message text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  s uuid;
  recipient uuid;
  result_id uuid;
BEGIN
  PERFORM public.ensure_membership();
  s := public.my_space();
  IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
  
  SELECT user_id INTO recipient FROM public.user_roles WHERE space_id = s AND user_id <> auth.uid() LIMIT 1;
  IF recipient IS NULL THEN RAISE EXCEPTION 'Tu pareja aún no se ha vinculado al espacio'; END IF;
  
  IF p_gift_id IS NULL OR btrim(p_gift_id) = '' THEN RAISE EXCEPTION 'Selecciona un regalo válido'; END IF;
  IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'El título debe tener entre 1 y 120 caracteres'; END IF;
  
  INSERT INTO public.couple_gifts(space_id, sender_id, recipient_id, gift_id, title, message)
  VALUES (s, auth.uid(), recipient, btrim(p_gift_id), btrim(p_title), coalesce(btrim(p_message), ''))
  RETURNING id INTO result_id;
  
  RETURN result_id;
END $$;

REVOKE ALL ON FUNCTION public.send_couple_gift(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_couple_gift(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.open_couple_gift(
  p_gift_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  g public.couple_gifts%ROWTYPE;
BEGIN
  PERFORM public.ensure_membership();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
  
  SELECT * INTO g FROM public.couple_gifts WHERE id = p_gift_id AND space_id = public.my_space();
  IF g.id IS NULL THEN RAISE EXCEPTION 'Regalo no encontrado'; END IF;
  IF g.recipient_id <> auth.uid() THEN RAISE EXCEPTION 'Solo el destinatario puede abrir este regalo'; END IF;
  
  IF g.opened_at IS NULL THEN
    UPDATE public.couple_gifts SET opened_at = now() WHERE id = g.id;
    g.opened_at := now();
  END IF;
  
  RETURN jsonb_build_object(
    'id', g.id,
    'gift_id', g.gift_id,
    'title', g.title,
    'message', g.message,
    'opened_at', g.opened_at,
    'created_at', g.created_at
  );
END $$;

REVOKE ALL ON FUNCTION public.open_couple_gift(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.open_couple_gift(uuid) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_gifts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ------------------------------------------------------------------------------
-- FASE 3: APPA MASCOTA VIVA Y NOTAS POST-IT
-- ------------------------------------------------------------------------------
ALTER TABLE public.appa_state 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 10 AND 90),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 26 CHECK (pos_y BETWEEN 10 AND 85),
ADD COLUMN IF NOT EXISTS facing text NOT NULL DEFAULT 'right' CHECK (facing IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS current_room text NOT NULL DEFAULT 'sala' CHECK (current_room IN ('sala', 'cocina', 'dormitorio', 'bano'));

ALTER TABLE public.appa_furniture 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 5 AND 95),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 50 CHECK (pos_y BETWEEN 5 AND 85),
ADD COLUMN IF NOT EXISTS flipped boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT 'default';

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

DROP POLICY IF EXISTS house_notes_read ON public.appa_house_notes;
CREATE POLICY house_notes_read ON public.appa_house_notes FOR SELECT TO authenticated
USING (space_id = public.my_space());

CREATE INDEX IF NOT EXISTS house_notes_space ON public.appa_house_notes(space_id, room, created_at DESC);

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
      pos_y = greatest(10, least(85, p_pos_y)),
      facing = p_facing,
      updated_at = now()
  WHERE space_id = s;
END $$;

REVOKE ALL ON FUNCTION public.appa_move(text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_move(text, numeric, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.appa_save_furniture_layout(
  p_item text,
  p_room text DEFAULT NULL,
  p_pos_x numeric DEFAULT 50,
  p_pos_y numeric DEFAULT 50,
  p_flipped boolean DEFAULT false,
  p_variant text DEFAULT 'default'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room IS NOT NULL AND p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  
  PERFORM pg_advisory_xact_lock(hashtext('appa:' || s::text));
  
  UPDATE public.appa_furniture
  SET room = coalesce(p_room, room),
      pos_x = greatest(5, least(95, p_pos_x)),
      pos_y = greatest(5, least(85, p_pos_y)),
      flipped = coalesce(p_flipped, false),
      variant = coalesce(p_variant, 'default')
  WHERE space_id = s AND item = p_item;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Mueble no encontrado.'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.appa_read_note(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado.'; END IF;
  UPDATE public.appa_house_notes SET read_at = now() WHERE id = p_id AND space_id = public.my_space() AND read_at IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.appa_read_note(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_read_note(uuid) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_house_notes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- ------------------------------------------------------------------------------
-- FASE 4: CULTIVO PROFUNDO DEL LIRIO
-- ------------------------------------------------------------------------------
ALTER TABLE public.lily_plant
ADD COLUMN IF NOT EXISTS drain_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.lily_care(p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar el lirio.'; END IF;
  IF p_action NOT IN ('sun','water','prune','feed','pests','song','drain') THEN
    RAISE EXCEPTION 'Acción de cultivo no válida.';
  END IF;
  
  INSERT INTO lily_plant(space_id) VALUES (s) ON CONFLICT DO NOTHING;
  
  UPDATE lily_plant SET
    sun_at = CASE WHEN p_action = 'sun' THEN now() ELSE sun_at END,
    water_at = CASE WHEN p_action = 'water' THEN now() ELSE water_at END,
    prune_at = CASE WHEN p_action = 'prune' THEN now() ELSE prune_at END,
    feed_at = CASE WHEN p_action = 'feed' THEN now() ELSE feed_at END,
    pests_at = CASE WHEN p_action = 'pests' THEN now() ELSE pests_at END,
    song_at = CASE WHEN p_action = 'song' THEN now() ELSE song_at END,
    drain_at = CASE WHEN p_action = 'drain' THEN now() ELSE drain_at END,
    care_count = care_count + 1,
    last_by = auth.uid(),
    updated_at = now()
  WHERE space_id = s;
END $$;

REVOKE ALL ON FUNCTION public.lily_care(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lily_care(text) TO authenticated;


-- ------------------------------------------------------------------------------
-- FASE 5: JUEGO ¿CUÁNTO NOS CONOCEMOS?
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couple_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  category text NOT NULL DEFAULT 'complicidad',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.couple_quiz_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.couple_quiz_questions(id) ON DELETE CASCADE,
  day date NOT NULL,
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couple_quiz_rounds_space_question_day_unique UNIQUE (space_id, question_id, day)
);

CREATE TABLE IF NOT EXISTS public.couple_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.couple_quiz_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  my_answer text NOT NULL,
  guess_partner_answer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couple_quiz_answers_round_user_unique UNIQUE (round_id, user_id)
);

GRANT SELECT ON public.couple_quiz_questions TO authenticated;
GRANT ALL ON public.couple_quiz_questions TO service_role;

GRANT SELECT ON public.couple_quiz_rounds TO authenticated;
GRANT ALL ON public.couple_quiz_rounds TO service_role;

GRANT SELECT ON public.couple_quiz_answers TO authenticated;
GRANT ALL ON public.couple_quiz_answers TO service_role;

ALTER TABLE public.couple_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_quiz_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_questions_read ON public.couple_quiz_questions;
CREATE POLICY quiz_questions_read ON public.couple_quiz_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS quiz_rounds_read ON public.couple_quiz_rounds;
CREATE POLICY quiz_rounds_read ON public.couple_quiz_rounds FOR SELECT TO authenticated USING (space_id = public.my_space());

DROP POLICY IF EXISTS quiz_answers_read ON public.couple_quiz_answers;
CREATE POLICY quiz_answers_read ON public.couple_quiz_answers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.couple_quiz_rounds r
      WHERE r.id = couple_quiz_answers.round_id
        AND r.space_id = public.my_space()
        AND r.revealed_at IS NOT NULL
    )
  );

CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_question_id uuid,
  p_my_answer text,
  p_guess text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s uuid := public.my_space();
  today_date date := ((now() AT TIME ZONE 'America/Santo_Domingo'))::date;
  r_id uuid;
  ans_count integer;
  is_revealed boolean := false;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden participar en el juego.'; END IF;
  IF trim(coalesce(p_my_answer, '')) = '' THEN RAISE EXCEPTION 'La respuesta no puede estar vacía.'; END IF;

  INSERT INTO public.couple_quiz_rounds (space_id, question_id, day)
  VALUES (s, p_question_id, today_date)
  ON CONFLICT (space_id, question_id, day) DO UPDATE SET space_id = excluded.space_id
  RETURNING id INTO r_id;

  INSERT INTO public.couple_quiz_answers (round_id, user_id, my_answer, guess_partner_answer)
  VALUES (r_id, auth.uid(), trim(p_my_answer), trim(coalesce(p_guess, '')))
  ON CONFLICT (round_id, user_id) DO UPDATE SET
    my_answer = excluded.my_answer,
    guess_partner_answer = excluded.guess_partner_answer,
    created_at = now();

  SELECT count(*) INTO ans_count FROM public.couple_quiz_answers WHERE round_id = r_id;

  IF ans_count >= 2 THEN
    UPDATE public.couple_quiz_rounds
    SET revealed_at = now()
    WHERE id = r_id AND revealed_at IS NULL;
    is_revealed := true;
    PERFORM public.appa_care('play', NULL);
  END IF;

  RETURN jsonb_build_object(
    'round_id', r_id,
    'revealed', is_revealed,
    'answers_count', ans_count
  );
END $$;

REVOKE ALL ON FUNCTION public.submit_quiz_answer(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, text, text) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_rounds;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_answers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 40 Preguntas iniciales para Carlos y Mimie
INSERT INTO public.couple_quiz_questions (question, category, order_index) VALUES
('¿Cuál fue el momento exacto en el que te diste cuenta de que estabas completamente enamorado/a de mí?', 'recuerdos', 1),
('¿Qué pequeña manía o costumbre mía te parece tierna en secreto?', 'detalles', 2),
('Si tuviéramos un día libre entero para nosotros dos sin teléfonos, ¿cuál sería nuestro plan soñado?', 'futuro', 3),
('¿Cuál es mi mayor sueño que aún no he cumplido y que sueñas con ver hecho realidad?', 'profundo', 4),
('¿Qué comida te preparo o compramos cuando queremos alegrarnos el día por completo?', 'detalles', 5),
('¿Qué es lo que más te tranquiliza de mí cuando estás teniendo un día agotador?', 'profundo', 6),
('¿Qué viaje o escapada juntos recordarás por el resto de tu vida?', 'recuerdos', 7),
('¿Cuál consideras que es nuestra mayor fortaleza como pareja cuando las cosas se ponen difíciles?', 'complicidad', 8),
('¿Qué canción nos describe a la perfección cuando estamos solos?', 'detalles', 9),
('¿Cuál es tu recuerdo más gracioso o divertido que hemos vivido juntos?', 'recuerdos', 10),
('Si pudieras congelar un solo instante de nuestra historia para revivirlo mil veces, ¿cuál elegirías?', 'recuerdos', 11),
('¿En qué cosas crees que somos completamente opuestos, pero que encajamos como piezas exactas?', 'complicidad', 12),
('¿Qué es lo primero que pensaste sobre mí la primera vez que hablamos?', 'recuerdos', 13),
('¿Cuál es el abrazo o beso mío que más te recarga el alma?', 'detalles', 14),
('Si tuviéramos que adoptar otra mascota además de Appa en el mundo real, ¿cuál sería?', 'futuro', 15),
('¿Qué detalle simple que hago por ti te recuerda cuánto te amo sin necesidad de palabras?', 'detalles', 16),
('¿Cuál es nuestro rincón o espacio favorito en todo el mundo?', 'complicidad', 17),
('¿Qué virtud mía admiras profundamente en silencio?', 'profundo', 18),
('¿Qué palabra o apodo nuestro te hace sonreír cada vez que lo escuchas?', 'detalles', 19),
('¿Cómo imaginas nuestro hogar dentro de diez años?', 'futuro', 20),
('¿Qué es algo que aprendiste o empezaste a disfrutar gracias a mí?', 'complicidad', 21),
('¿Cuál ha sido la sorpresa que te he dado que más te ha tocado el corazón?', 'recuerdos', 22),
('¿Qué es lo que más te gusta de nuestras conversaciones a altas horas de la noche?', 'profundo', 23),
('Si me vieras triste, ¿cuál es tu fórmula infalible para sacarme una sonrisa?', 'detalles', 24),
('¿Qué película o serie juntos nos hizo reír o llorar más de la cuenta?', 'detalles', 25),
('¿Cuál es un secreto o pensamiento lindo sobre mí que nunca me habías confesado?', 'profundo', 26),
('¿Qué olor o fragancia te hace pensar inmediatamente en mí?', 'detalles', 27),
('¿Cuál es la promesa más bonita que nos hemos hecho mutuamente?', 'profundo', 28),
('¿Qué juego o reto tonto entre nosotros dos siempre te hace reír?', 'complicidad', 29),
('¿Qué foto nuestra de todas las que tenemos en el álbum es tu favorita absoluta y por qué?', 'recuerdos', 30),
('Si solo pudiéramos cenar una sola cosa juntos por el resto de nuestras vidas, ¿qué elegirías?', 'detalles', 31),
('¿Qué es lo que más agradeces a Dios cada noche sobre nuestra relación?', 'profundo', 32),
('¿Cómo describirías mi risa en una sola palabra poética?', 'detalles', 33),
('¿Qué aventura atrevida o divertida te gustaría que hagamos por primera vez este año?', 'futuro', 34),
('¿Cuál es el mejor consejo o frase de apoyo que te he dado en un momento decisivo?', 'recuerdos', 35),
('¿Qué pequeño ritual nuestro de todos los días extrañarías más si estuviéramos lejos?', 'complicidad', 36),
('¿Cuál es el regalo más significativo que te he dado?', 'recuerdos', 37),
('¿Qué es lo que más te enamora de mirarme a los ojos en silencio?', 'profundo', 38),
('Si nuestra historia de amor fuera un libro o una película, ¿cuál sería el título?', 'complicidad', 39),
('¿Por qué sabes que tú y yo fuimos hechos exactamente el uno para el otro?', 'profundo', 40)
ON CONFLICT DO NOTHING;

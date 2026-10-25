-- 0024: ¿Cuánto nos conocemos? (Couple Quiz with Secret Answers & Mutual Reveal)

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

CREATE POLICY quiz_questions_read ON public.couple_quiz_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY quiz_rounds_read ON public.couple_quiz_rounds
  FOR SELECT TO authenticated USING (space_id = public.my_space());

-- Regla de oro de confidencialidad (secreto hasta revelación simultánea):
-- Cada usuario solo puede ver su propia respuesta hasta que la ronda esté revelada.
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

-- Función segura para enviar respuesta y revelar mutuamente
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

  -- Obtener o crear la ronda de hoy para esta pregunta
  INSERT INTO public.couple_quiz_rounds (space_id, question_id, day)
  VALUES (s, p_question_id, today_date)
  ON CONFLICT (space_id, question_id, day) DO UPDATE SET space_id = excluded.space_id
  RETURNING id INTO r_id;

  -- Guardar o actualizar la respuesta secreta del usuario
  INSERT INTO public.couple_quiz_answers (round_id, user_id, my_answer, guess_partner_answer)
  VALUES (r_id, auth.uid(), trim(p_my_answer), trim(coalesce(p_guess, '')))
  ON CONFLICT (round_id, user_id) DO UPDATE SET
    my_answer = excluded.my_answer,
    guess_partner_answer = excluded.guess_partner_answer,
    created_at = now();

  -- Contar respuestas en esta ronda
  SELECT count(*) INTO ans_count FROM public.couple_quiz_answers WHERE round_id = r_id;

  -- Si ambos respondieron (o mínimo 2 respuestas en el espacio), revelar
  IF ans_count >= 2 THEN
    UPDATE public.couple_quiz_rounds
    SET revealed_at = now()
    WHERE id = r_id AND revealed_at IS NULL;
    is_revealed := true;

    -- Bonificación de 3 monedas y 25 EXP en la economía unificada
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

-- Publicación Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_answers;

-- Banco inicial de 40 preguntas para Carlos & Mimie
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
('¿Por qué sabes que tú y yo fuimos hechos exactamente el uno para el otro?', 'profundo', 40);

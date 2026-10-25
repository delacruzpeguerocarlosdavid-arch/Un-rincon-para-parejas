CREATE TABLE public.daily_emotions (
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Santo_Domingo')::date),
 emotion text NOT NULL CHECK (emotion IN ('feliz','en_paz','triste','cansada','enamorada','agradecida','enojada','discusion','no_escuchada')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(space_id,user_id,day)
);
GRANT SELECT ON public.daily_emotions TO authenticated;
GRANT ALL ON public.daily_emotions TO service_role;
ALTER TABLE public.daily_emotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY emotions_space_read ON public.daily_emotions FOR SELECT TO authenticated USING (space_id=public.my_space());
CREATE FUNCTION public.save_daily_emotion(p_emotion text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_emotion IS NULL OR p_emotion NOT IN ('feliz','en_paz','triste','cansada','enamorada','agradecida','enojada','discusion','no_escuchada') THEN RAISE EXCEPTION 'Emoción no válida'; END IF;
 INSERT INTO public.daily_emotions(space_id,user_id,day,emotion) VALUES(s,auth.uid(),(now() AT TIME ZONE 'America/Santo_Domingo')::date,p_emotion)
 ON CONFLICT(space_id,user_id,day) DO UPDATE SET emotion=excluded.emotion,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.save_daily_emotion(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_daily_emotion(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_emotions;
ALTER TABLE public.correspondence DROP CONSTRAINT correspondence_check;
ALTER TABLE public.correspondence ADD CONSTRAINT correspondence_folder_check CHECK ((kind='library' AND folder IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando sientas que no te escucho','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') AND folder IS NOT NULL) OR (kind<>'library' AND folder IS NULL));
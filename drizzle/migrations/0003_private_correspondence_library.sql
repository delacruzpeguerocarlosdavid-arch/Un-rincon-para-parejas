CREATE TABLE public.correspondence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 kind text NOT NULL CHECK (kind IN ('chat','note','letter','library')),
 title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 160),
 content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 20000),
 folder text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((kind = 'library' AND folder IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') AND folder IS NOT NULL) OR (kind <> 'library' AND folder IS NULL)),
 CHECK (kind IN ('chat','note') OR char_length(btrim(title)) > 0)
);
GRANT SELECT ON public.correspondence TO authenticated;
GRANT ALL ON public.correspondence TO service_role;
ALTER TABLE public.correspondence ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondence_read ON public.correspondence FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE INDEX correspondence_space_created ON public.correspondence(space_id, created_at);
CREATE TABLE public.correspondence_reads (
 text_id uuid NOT NULL REFERENCES public.correspondence(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 first_read_at timestamptz NOT NULL DEFAULT now(),
 last_read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (text_id,user_id)
);
GRANT SELECT ON public.correspondence_reads TO authenticated;
GRANT ALL ON public.correspondence_reads TO service_role;
ALTER TABLE public.correspondence_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondence_reads_read ON public.correspondence_reads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.correspondence c WHERE c.id = text_id AND c.space_id = public.my_space()));
CREATE TABLE public.word_favorites (
 text_id uuid NOT NULL REFERENCES public.correspondence(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (text_id,user_id)
);
GRANT SELECT ON public.word_favorites TO authenticated;
GRANT ALL ON public.word_favorites TO service_role;
ALTER TABLE public.word_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY favorites_read ON public.word_favorites FOR SELECT TO authenticated USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.correspondence c WHERE c.id = text_id AND c.space_id = public.my_space()));
CREATE FUNCTION public.save_correspondence(p_kind text, p_title text, p_content text, p_folder text DEFAULT NULL, p_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); result uuid;
BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  IF (SELECT count(*) FROM public.user_roles WHERE space_id = s) <> 2 THEN RAISE EXCEPTION 'Vincula la segunda cuenta antes de enviar'; END IF;
  INSERT INTO public.correspondence(space_id,author_id,kind,title,content,folder) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_folder) RETURNING id INTO result;
 ELSE
  UPDATE public.correspondence SET title=btrim(p_title),content=btrim(p_content),folder=p_folder,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind='library' AND p_kind='library' RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios textos'; END IF;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_correspondence(text,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_correspondence(text,text,text,text,uuid) TO authenticated;
CREATE FUNCTION public.delete_library_text(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 DELETE FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id=auth.uid() AND kind='library';
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes eliminar tus propios textos'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.delete_library_text(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_library_text(uuid) TO authenticated;
CREATE FUNCTION public.mark_correspondence_read(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id<>auth.uid()) THEN RAISE EXCEPTION 'Lectura no autorizada'; END IF;
 INSERT INTO public.correspondence_reads(text_id,user_id) VALUES(p_id,auth.uid()) ON CONFLICT(text_id,user_id) DO UPDATE SET last_read_at=now();
END $$;
REVOKE ALL ON FUNCTION public.mark_correspondence_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_correspondence_read(uuid) TO authenticated;
CREATE FUNCTION public.set_word_favorite(p_id uuid,p_favorite boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id<>auth.uid() AND kind='library') THEN RAISE EXCEPTION 'Solo puedes guardar textos de tu pareja'; END IF;
 IF p_favorite THEN INSERT INTO public.word_favorites(text_id,user_id) VALUES(p_id,auth.uid()) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.word_favorites WHERE text_id=p_id AND user_id=auth.uid(); END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_word_favorite(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_word_favorite(uuid,boolean) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.correspondence,public.correspondence_reads,public.word_favorites;
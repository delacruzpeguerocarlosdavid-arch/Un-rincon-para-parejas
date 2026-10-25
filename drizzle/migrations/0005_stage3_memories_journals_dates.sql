CREATE TABLE public.memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 memory_date date NOT NULL,
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
 photo_path text NOT NULL,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.journal_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 kind text NOT NULL CHECK (kind IN ('private','shared')),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 30000),
 entry_date date NOT NULL,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.special_dates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
 event_date date NOT NULL,
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
 category text NOT NULL CHECK (category IN ('cumpleaños','aniversario','recuerdo','personalizada')),
 reminder_days int CHECK (reminder_days IN (0,1,3,7,14,30)),
 repeats_yearly boolean NOT NULL DEFAULT true,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.item_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
 journal_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE,
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((memory_id IS NULL) <> (journal_id IS NULL)));
CREATE TABLE public.item_reactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
 journal_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE,
 emoji text NOT NULL CHECK (emoji IN ('❤️','🥰','😂','🙏','😢','✨')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((memory_id IS NULL) <> (journal_id IS NULL)));
CREATE UNIQUE INDEX item_reactions_memory_uq ON public.item_reactions(memory_id,user_id,emoji) WHERE memory_id IS NOT NULL;
CREATE UNIQUE INDEX item_reactions_journal_uq ON public.item_reactions(journal_id,user_id,emoji) WHERE journal_id IS NOT NULL;
CREATE INDEX memories_space_idx ON public.memories(space_id, memory_date DESC);
CREATE INDEX journal_space_idx ON public.journal_entries(space_id, entry_date DESC);
CREATE INDEX special_dates_space_idx ON public.special_dates(space_id);

REVOKE ALL ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions FROM anon, authenticated;
GRANT SELECT ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions TO authenticated;
GRANT ALL ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY memories_read ON public.memories FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY journal_read ON public.journal_entries FOR SELECT TO authenticated USING (space_id = public.my_space() AND (kind = 'shared' OR author_id = auth.uid()));
CREATE POLICY special_dates_read ON public.special_dates FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY comments_read ON public.item_comments FOR SELECT TO authenticated USING (space_id = public.my_space() AND (memory_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_id AND j.kind = 'shared')));
CREATE POLICY reactions_read ON public.item_reactions FOR SELECT TO authenticated USING (space_id = public.my_space() AND (memory_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_id AND j.kind = 'shared')));

CREATE OR REPLACE FUNCTION public.save_memory(p_title text, p_date date, p_description text, p_photo_path text DEFAULT NULL, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  IF p_photo_path IS NULL OR p_photo_path NOT LIKE s::text || '/%' OR p_photo_path LIKE '%..%' THEN RAISE EXCEPTION 'Foto inválida'; END IF;
  INSERT INTO public.memories(space_id,author_id,title,memory_date,description,photo_path) VALUES(s,auth.uid(),btrim(p_title),p_date,btrim(coalesce(p_description,'')),p_photo_path) RETURNING id INTO r;
 ELSE
  UPDATE public.memories SET title=btrim(p_title),memory_date=p_date,description=btrim(coalesce(p_description,'')),updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios recuerdos'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.save_journal_entry(p_kind text, p_title text, p_content text, p_date date, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind NOT IN ('private','shared') THEN RAISE EXCEPTION 'Tipo de diario inválido'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.journal_entries(space_id,author_id,kind,title,content,entry_date) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_date) RETURNING id INTO r;
 ELSE
  UPDATE public.journal_entries SET title=btrim(p_title),content=btrim(p_content),entry_date=p_date,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind=p_kind AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propias entradas'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.save_special_date(p_name text, p_date date, p_description text, p_category text, p_reminder_days int DEFAULT NULL, p_repeats_yearly boolean DEFAULT true, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.special_dates(space_id,author_id,name,event_date,description,category,reminder_days,repeats_yearly) VALUES(s,auth.uid(),btrim(p_name),p_date,btrim(coalesce(p_description,'')),p_category,p_reminder_days,coalesce(p_repeats_yearly,true)) RETURNING id INTO r;
 ELSE
  UPDATE public.special_dates SET name=btrim(p_name),event_date=p_date,description=btrim(coalesce(p_description,'')),category=p_category,reminder_days=p_reminder_days,repeats_yearly=coalesce(p_repeats_yearly,true),updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo quien creó la fecha puede editarla'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.set_item_archived(p_type text, p_id uuid, p_archived boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' THEN
  UPDATE public.memories SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSIF p_type = 'journal' THEN
  UPDATE public.journal_entries SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSIF p_type = 'date' THEN
  UPDATE public.special_dates SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'No puedes cambiar este elemento o ya pasó el plazo de 30 días'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.delete_item_forever(p_type text, p_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); path text; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' THEN
  DELETE FROM public.memories WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL RETURNING photo_path INTO path;
 ELSIF p_type = 'journal' THEN
  DELETE FROM public.journal_entries WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL;
 ELSIF p_type = 'date' THEN
  DELETE FROM public.special_dates WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL;
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes eliminar definitivamente tus elementos archivados'; END IF;
 RETURN path; END $$;

CREATE OR REPLACE FUNCTION public.add_item_comment(p_type text, p_id uuid, p_content text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' AND EXISTS (SELECT 1 FROM public.memories WHERE id=p_id AND space_id=s AND archived_at IS NULL) THEN
  INSERT INTO public.item_comments(space_id,author_id,memory_id,content) VALUES(s,auth.uid(),p_id,btrim(p_content)) RETURNING id INTO r;
 ELSIF p_type = 'journal' AND EXISTS (SELECT 1 FROM public.journal_entries WHERE id=p_id AND space_id=s AND kind='shared' AND archived_at IS NULL) THEN
  INSERT INTO public.item_comments(space_id,author_id,journal_id,content) VALUES(s,auth.uid(),p_id,btrim(p_content)) RETURNING id INTO r;
 ELSE RAISE EXCEPTION 'No se puede comentar aquí'; END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.delete_item_comment(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
 DELETE FROM public.item_comments WHERE id=p_id AND space_id=public.my_space() AND author_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes borrar tus comentarios'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.toggle_item_reaction(p_type text, p_id uuid, p_emoji text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' AND EXISTS (SELECT 1 FROM public.memories WHERE id=p_id AND space_id=s AND archived_at IS NULL) THEN
  DELETE FROM public.item_reactions WHERE memory_id=p_id AND user_id=auth.uid() AND emoji=p_emoji; IF FOUND THEN RETURN false; END IF;
  INSERT INTO public.item_reactions(space_id,user_id,memory_id,emoji) VALUES(s,auth.uid(),p_id,p_emoji);
 ELSIF p_type = 'journal' AND EXISTS (SELECT 1 FROM public.journal_entries WHERE id=p_id AND space_id=s AND kind='shared' AND archived_at IS NULL) THEN
  DELETE FROM public.item_reactions WHERE journal_id=p_id AND user_id=auth.uid() AND emoji=p_emoji; IF FOUND THEN RETURN false; END IF;
  INSERT INTO public.item_reactions(space_id,user_id,journal_id,emoji) VALUES(s,auth.uid(),p_id,p_emoji);
 ELSE RAISE EXCEPTION 'No se puede reaccionar aquí'; END IF; RETURN true; END $$;

CREATE OR REPLACE FUNCTION public.purge_expired_archive()
RETURNS SETOF text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
 DELETE FROM public.journal_entries WHERE archived_at <= now() - interval '30 days';
 DELETE FROM public.special_dates WHERE archived_at <= now() - interval '30 days';
 RETURN QUERY DELETE FROM public.memories WHERE archived_at <= now() - interval '30 days' RETURNING photo_path; END $$;
REVOKE EXECUTE ON FUNCTION public.purge_expired_archive() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_archive() TO service_role;

CREATE POLICY memories_photos_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text);
CREATE POLICY memories_photos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text);
CREATE POLICY memories_photos_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text AND owner_id = auth.uid()::text AND NOT EXISTS (SELECT 1 FROM public.memories m WHERE m.photo_path = storage.objects.name));

ALTER PUBLICATION supabase_realtime ADD TABLE public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions;
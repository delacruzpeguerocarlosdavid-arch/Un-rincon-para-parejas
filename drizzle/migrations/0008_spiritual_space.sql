CREATE TABLE public.spiritual_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('prayer','petition','reading')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 10000),
  reference text NOT NULL DEFAULT '' CHECK (char_length(reference) <= 120),
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.spiritual_checkins (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Santo_Domingo'))::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id, day)
);
GRANT SELECT ON public.spiritual_items, public.spiritual_checkins TO authenticated;
GRANT ALL ON public.spiritual_items, public.spiritual_checkins TO service_role;
ALTER TABLE public.spiritual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY spiritual_items_read ON public.spiritual_items FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY spiritual_checkins_read ON public.spiritual_checkins FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.save_spiritual_item(p_kind text, p_title text, p_content text, p_reference text, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); r uuid;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden escribir aquí.'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO spiritual_items(space_id, author_id, kind, title, content, reference)
    VALUES (s, auth.uid(), p_kind, trim(p_title), coalesce(p_content,''), coalesce(trim(p_reference),'')) RETURNING id INTO r;
  ELSE
    UPDATE spiritual_items SET title = trim(p_title), content = coalesce(p_content,''), reference = coalesce(trim(p_reference),''), updated_at = now()
    WHERE id = p_id AND space_id = s AND author_id = auth.uid() RETURNING id INTO r;
    IF r IS NULL THEN RAISE EXCEPTION 'Solo quien lo escribió puede editarlo.'; END IF;
  END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.delete_spiritual_item(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM spiritual_items WHERE id = p_id AND space_id = public.my_space() AND author_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Solo quien lo escribió puede eliminarlo.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_petition_answered(p_id uuid, p_answered boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE spiritual_items SET answered_at = CASE WHEN p_answered THEN now() ELSE NULL END, updated_at = now()
  WHERE id = p_id AND space_id = public.my_space() AND kind = 'petition';
  IF NOT FOUND THEN RAISE EXCEPTION 'No encontramos esa petición.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.spiritual_checkin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden marcar su momento con Dios.'; END IF;
  INSERT INTO spiritual_checkins(space_id, user_id, day) VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date) ON CONFLICT DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION public.save_spiritual_item(text,text,text,text,uuid), public.delete_spiritual_item(uuid), public.set_petition_answered(uuid,boolean), public.spiritual_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_spiritual_item(text,text,text,text,uuid), public.delete_spiritual_item(uuid), public.set_petition_answered(uuid,boolean), public.spiritual_checkin() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spiritual_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spiritual_checkins;
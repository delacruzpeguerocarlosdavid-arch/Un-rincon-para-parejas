CREATE TABLE public.appa_interactions (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  action text NOT NULL CHECK (action IN ('pet','feed','play','hug')),
  coins integer NOT NULL CHECK (coins BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id, day, action)
);
GRANT SELECT ON public.appa_interactions TO authenticated;
GRANT ALL ON public.appa_interactions TO service_role;
ALTER TABLE public.appa_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY appa_read ON public.appa_interactions FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.appa_interact(p_action text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); c integer; d date := ((now() AT TIME ZONE 'America/Santo_Domingo'))::date;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar a Appa.'; END IF;
  c := CASE p_action WHEN 'pet' THEN 1 WHEN 'feed' THEN 2 WHEN 'play' THEN 3 WHEN 'hug' THEN 2 ELSE NULL END;
  IF c IS NULL THEN RAISE EXCEPTION 'Acción no válida.'; END IF;
  INSERT INTO appa_interactions(space_id, user_id, day, action, coins) VALUES (s, auth.uid(), d, p_action, c) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.appa_interact(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_interact(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_interactions;
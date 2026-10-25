CREATE TABLE public.lily_plant (
  space_id uuid PRIMARY KEY REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  sun_at timestamptz NOT NULL DEFAULT now(),
  water_at timestamptz NOT NULL DEFAULT now(),
  prune_at timestamptz NOT NULL DEFAULT now(),
  care_count int NOT NULL DEFAULT 0,
  last_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lily_plant TO authenticated;
GRANT ALL ON public.lily_plant TO service_role;
ALTER TABLE public.lily_plant ENABLE ROW LEVEL SECURITY;
CREATE POLICY lily_read ON public.lily_plant FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.lily_care(p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar el lirio.'; END IF;
  IF p_action NOT IN ('sun','water','prune') THEN RAISE EXCEPTION 'Acción no válida.'; END IF;
  INSERT INTO lily_plant(space_id) VALUES (s) ON CONFLICT DO NOTHING;
  UPDATE lily_plant SET
    sun_at = CASE WHEN p_action='sun' THEN now() ELSE sun_at END,
    water_at = CASE WHEN p_action='water' THEN now() ELSE water_at END,
    prune_at = CASE WHEN p_action='prune' THEN now() ELSE prune_at END,
    care_count = care_count + 1, last_by = auth.uid(), updated_at = now()
  WHERE space_id = s;
END $$;
REVOKE ALL ON FUNCTION public.lily_care(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lily_care(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lily_plant;
-- 0023: Lily Deep Cultivation Model (Substrate Moisture, Drainage, Stress Signals, Recovery)

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

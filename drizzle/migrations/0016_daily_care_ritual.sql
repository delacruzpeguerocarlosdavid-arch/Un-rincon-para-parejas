CREATE TABLE public.care_rituals (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  day date NOT NULL,
  claimed_by uuid NOT NULL,
  coins int NOT NULL DEFAULT 5,
  exp int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, day)
);
GRANT SELECT ON public.care_rituals TO authenticated;
GRANT ALL ON public.care_rituals TO service_role;
ALTER TABLE public.care_rituals ENABLE ROW LEVEL SECURITY;
CREATE POLICY care_rituals_read ON public.care_rituals FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.appa_balance(p_space uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT (coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_bath_rewards WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_finds WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM care_rituals WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_furniture WHERE space_id=p_space),0))::integer $$;
REVOKE ALL ON FUNCTION public.appa_balance(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.daily_care_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); d date := (now() AT TIME ZONE 'America/Santo_Domingo')::date; l lily_plant;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  SELECT * INTO l FROM lily_plant WHERE space_id = s;
  RETURN jsonb_build_object('day', d,
    'sun', coalesce((l.sun_at AT TIME ZONE 'America/Santo_Domingo')::date = d AND l.care_count > 0, false),
    'water', coalesce((l.water_at AT TIME ZONE 'America/Santo_Domingo')::date = d AND l.care_count > 0, false),
    'prune', coalesce((l.prune_at AT TIME ZONE 'America/Santo_Domingo')::date = d AND l.care_count > 0, false),
    'feed', EXISTS (SELECT 1 FROM appa_interactions WHERE space_id=s AND day=d AND action='feed') OR EXISTS (SELECT 1 FROM appa_purchases WHERE space_id=s AND (consumed_at AT TIME ZONE 'America/Santo_Domingo')::date=d),
    'bath', EXISTS (SELECT 1 FROM appa_bath_rewards WHERE space_id=s AND day=d),
    'love', EXISTS (SELECT 1 FROM appa_interactions WHERE space_id=s AND day=d AND action IN ('pet','hug')),
    'claimed', EXISTS (SELECT 1 FROM care_rituals WHERE space_id=s AND day=d));
END $$;

CREATE OR REPLACE FUNCTION public.claim_daily_ritual() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); st jsonb; d date;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text));
  st := public.daily_care_status(); d := (st->>'day')::date;
  IF NOT ((st->>'sun')::bool AND (st->>'water')::bool AND (st->>'prune')::bool AND (st->>'feed')::bool AND (st->>'bath')::bool AND (st->>'love')::bool) THEN RAISE EXCEPTION 'Aún faltan cuidados de hoy.'; END IF;
  INSERT INTO care_rituals(space_id, day, claimed_by) VALUES (s, d, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN public.daily_care_status();
END $$;
REVOKE ALL ON FUNCTION public.daily_care_status(), public.claim_daily_ritual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daily_care_status(), public.claim_daily_ritual() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_rituals;
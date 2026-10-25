ALTER TABLE public.lily_plant ADD COLUMN IF NOT EXISTS feed_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN IF NOT EXISTS pests_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN IF NOT EXISTS song_at timestamptz;
CREATE OR REPLACE FUNCTION public.lily_care(p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar el lirio.'; END IF;
  IF p_action NOT IN ('sun','water','prune','feed','pests','song') THEN RAISE EXCEPTION 'Acción no válida.'; END IF;
  INSERT INTO lily_plant(space_id) VALUES (s) ON CONFLICT DO NOTHING;
  UPDATE lily_plant SET
    sun_at = CASE WHEN p_action='sun' THEN now() ELSE sun_at END,
    water_at = CASE WHEN p_action='water' THEN now() ELSE water_at END,
    prune_at = CASE WHEN p_action='prune' THEN now() ELSE prune_at END,
    feed_at = CASE WHEN p_action='feed' THEN now() ELSE feed_at END,
    pests_at = CASE WHEN p_action='pests' THEN now() ELSE pests_at END,
    song_at = CASE WHEN p_action='song' THEN now() ELSE song_at END,
    care_count = care_count + 1, last_by = auth.uid(), updated_at = now()
  WHERE space_id = s;
END $$;
ALTER TABLE public.appa_game_results DROP CONSTRAINT appa_game_results_game_check;
ALTER TABLE public.appa_game_results ADD CONSTRAINT appa_game_results_game_check CHECK (game IN ('nubes','memoria','comida','burbujas','simon','bichos','corazones','reflejos'));
CREATE OR REPLACE FUNCTION public.appa_finish_game(p_game text, p_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); sc integer := greatest(0, least(100, coalesce(p_score,0))); c integer; x integer;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden jugar.'; END IF;
  IF p_game NOT IN ('nubes','memoria','comida','burbujas','simon','bichos','corazones','reflejos') THEN RAISE EXCEPTION 'Juego no válido.'; END IF;
  c := least(5, sc / 3); x := least(50, sc * 2);
  PERFORM public.appa_care('play', NULL);
  INSERT INTO appa_game_results(space_id, user_id, day, game, score, coins, exp)
  VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date, p_game, sc, c, x) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('coins',0,'exp',0,'repeat',true); END IF;
  RETURN jsonb_build_object('coins',c,'exp',x,'repeat',false);
END $$;
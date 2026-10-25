CREATE TABLE public.appa_state (
  space_id uuid PRIMARY KEY REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  hunger numeric NOT NULL DEFAULT 70,
  happiness numeric NOT NULL DEFAULT 70,
  energy numeric NOT NULL DEFAULT 70,
  sleeping_since timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.appa_state TO authenticated;
GRANT ALL ON public.appa_state TO service_role;
ALTER TABLE public.appa_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY appa_state_read ON public.appa_state FOR SELECT TO authenticated USING (space_id = public.my_space());

ALTER TABLE public.appa_purchases ADD COLUMN consumed_at timestamptz;
ALTER TABLE public.appa_game_results DROP CONSTRAINT appa_game_results_game_check;
ALTER TABLE public.appa_game_results ADD CONSTRAINT appa_game_results_game_check CHECK (game IN ('nubes','memoria','comida'));

CREATE OR REPLACE FUNCTION public.appa_finish_game(p_game text, p_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); sc integer := greatest(0, least(100, coalesce(p_score,0))); c integer; x integer;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden jugar.'; END IF;
  IF p_game NOT IN ('nubes','memoria','comida') THEN RAISE EXCEPTION 'Juego no válido.'; END IF;
  c := least(5, sc / 3); x := least(50, sc * 2);
  PERFORM public.appa_care('play', NULL);
  INSERT INTO appa_game_results(space_id, user_id, day, game, score, coins, exp)
  VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date, p_game, sc, c, x) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('coins',0,'exp',0,'repeat',true); END IF;
  RETURN jsonb_build_object('coins',c,'exp',x,'repeat',false);
END $$;

-- Gentle decay per hour; never below 10 so there are no harsh punishments.
CREATE OR REPLACE FUNCTION public.appa_care(p_kind text, p_purchase uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); st appa_state; h numeric; food text; gain numeric; coin_action text;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar a Appa.'; END IF;
  INSERT INTO appa_state(space_id) VALUES (s) ON CONFLICT DO NOTHING;
  SELECT * INTO st FROM appa_state WHERE space_id = s FOR UPDATE;
  h := extract(epoch FROM now() - st.updated_at) / 3600;
  IF st.sleeping_since IS NULL THEN
    st.hunger := greatest(10, st.hunger - 4*h); st.happiness := greatest(10, st.happiness - 3*h); st.energy := greatest(10, st.energy - 2*h);
  ELSE
    st.hunger := greatest(10, st.hunger - 2*h); st.happiness := greatest(10, st.happiness - 1*h); st.energy := least(100, st.energy + 15*h);
  END IF;
  IF p_kind = 'sleep' THEN st.sleeping_since := coalesce(st.sleeping_since, now());
  ELSIF p_kind = 'wake' THEN st.sleeping_since := NULL;
  ELSIF p_kind = 'check' THEN NULL;
  ELSE
    IF st.sleeping_since IS NOT NULL THEN RAISE EXCEPTION 'Appa está durmiendo. Despiértalo con cariño primero.'; END IF;
    IF p_kind = 'pet' THEN st.happiness := least(100, st.happiness + 6); coin_action := 'pet';
    ELSIF p_kind = 'hug' THEN st.happiness := least(100, st.happiness + 10); coin_action := 'hug';
    ELSIF p_kind = 'play' THEN st.happiness := least(100, st.happiness + 8); st.energy := greatest(10, st.energy - 8); st.hunger := greatest(10, st.hunger - 3); coin_action := 'play';
    ELSIF p_kind = 'feed' THEN
      UPDATE appa_purchases SET consumed_at = now() WHERE id = p_purchase AND space_id = s AND consumed_at IS NULL RETURNING appa_purchases.food INTO food;
      IF food IS NULL THEN RAISE EXCEPTION 'Esa comida ya no está en la despensa.'; END IF;
      gain := CASE food WHEN 'manzana' THEN 15 WHEN 'zanahoria' THEN 25 WHEN 'pastel_nubes' THEN 45 ELSE 80 END;
      st.hunger := least(100, st.hunger + gain); st.happiness := least(100, st.happiness + 4); coin_action := 'feed';
    ELSE RAISE EXCEPTION 'Acción no válida.'; END IF;
  END IF;
  UPDATE appa_state SET hunger = st.hunger, happiness = st.happiness, energy = st.energy, sleeping_since = st.sleeping_since, updated_at = now() WHERE space_id = s;
  IF coin_action IS NOT NULL THEN
    INSERT INTO appa_interactions(space_id, user_id, day, action, coins)
    VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date, coin_action, CASE coin_action WHEN 'pet' THEN 1 WHEN 'play' THEN 3 ELSE 2 END) ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('hunger', round(st.hunger), 'happiness', round(st.happiness), 'energy', round(st.energy), 'sleeping', st.sleeping_since IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.appa_care(text, uuid), public.appa_finish_game(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_care(text, uuid), public.appa_finish_game(text,integer) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_state;
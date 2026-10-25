CREATE TABLE public.appa_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food text NOT NULL,
  cost integer NOT NULL CHECK (cost > 0),
  exp integer NOT NULL CHECK (exp >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.appa_game_results (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  game text NOT NULL CHECK (game IN ('nubes','memoria')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  coins integer NOT NULL,
  exp integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id, day, game)
);
GRANT SELECT ON public.appa_purchases, public.appa_game_results TO authenticated;
GRANT ALL ON public.appa_purchases, public.appa_game_results TO service_role;
ALTER TABLE public.appa_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appa_game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY appa_purchases_read ON public.appa_purchases FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY appa_games_read ON public.appa_game_results FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.appa_buy_food(p_food text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); c integer; x integer; bal integer;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden comprar comida.'; END IF;
  SELECT v.c, v.x INTO c, x FROM (VALUES ('manzana',3,15),('zanahoria',5,30),('pastel_nubes',10,70),('banquete',20,160)) v(f,c,x) WHERE v.f = p_food;
  IF c IS NULL THEN RAISE EXCEPTION 'Esa comida no existe.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('appa:' || s::text));
  SELECT coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id = s),0)
       + coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id = s),0)
       - coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id = s),0) INTO bal;
  IF bal < c THEN RAISE EXCEPTION 'No hay suficientes monedas.'; END IF;
  INSERT INTO appa_purchases(space_id, user_id, food, cost, exp) VALUES (s, auth.uid(), p_food, c, x);
  RETURN x;
END $$;

CREATE OR REPLACE FUNCTION public.appa_finish_game(p_game text, p_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); sc integer := greatest(0, least(100, coalesce(p_score,0))); c integer; x integer;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden jugar.'; END IF;
  IF p_game NOT IN ('nubes','memoria') THEN RAISE EXCEPTION 'Juego no válido.'; END IF;
  c := least(5, sc / 3); x := least(50, sc * 2);
  INSERT INTO appa_game_results(space_id, user_id, day, game, score, coins, exp)
  VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date, p_game, sc, c, x) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('coins',0,'exp',0,'repeat',true); END IF;
  RETURN jsonb_build_object('coins',c,'exp',x,'repeat',false);
END $$;
REVOKE ALL ON FUNCTION public.appa_buy_food(text), public.appa_finish_game(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_buy_food(text), public.appa_finish_game(text,integer) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_game_results;
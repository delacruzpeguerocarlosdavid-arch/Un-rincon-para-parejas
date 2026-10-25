CREATE TABLE public.appa_outfits (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  item text NOT NULL,
  cost int NOT NULL CHECK (cost > 0),
  equipped boolean NOT NULL DEFAULT false,
  purchased_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, item)
);
GRANT SELECT ON public.appa_outfits TO authenticated;
GRANT ALL ON public.appa_outfits TO service_role;
ALTER TABLE public.appa_outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY appa_outfits_read ON public.appa_outfits FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.appa_balance(p_space uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT (coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_bath_rewards WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_finds WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM care_rituals WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_furniture WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_outfits WHERE space_id=p_space),0))::integer $$;
REVOKE ALL ON FUNCTION public.appa_balance(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.appa_buy_outfit(p_item text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); c int;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  SELECT v.c INTO c FROM (VALUES ('lazo',6),('corona',15),('gorro',8),('flor',5),('gafas',10),('bufanda',12),('mago',20),('aureola',25)) v(i,c) WHERE v.i = p_item;
  IF c IS NULL THEN RAISE EXCEPTION 'Accesorio no válido.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text));
  IF EXISTS (SELECT 1 FROM appa_outfits WHERE space_id=s AND item=p_item) THEN RAISE EXCEPTION 'Ya lo tienen.'; END IF;
  IF public.appa_balance(s) < c THEN RAISE EXCEPTION 'No hay suficientes monedas.'; END IF;
  INSERT INTO appa_outfits(space_id,item,cost,purchased_by) VALUES (s,p_item,c,auth.uid());
END $$;
CREATE OR REPLACE FUNCTION public.appa_wear_outfit(p_item text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  UPDATE appa_outfits SET equipped = (item = p_item AND NOT equipped) WHERE space_id = s;
END $$;
REVOKE ALL ON FUNCTION public.appa_buy_outfit(text), public.appa_wear_outfit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_buy_outfit(text), public.appa_wear_outfit(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_outfits;
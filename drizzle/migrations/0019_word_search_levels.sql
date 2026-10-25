CREATE TABLE public.word_level_catalog (level int PRIMARY KEY CHECK (level BETWEEN 1 AND 100), size int NOT NULL CHECK (size BETWEEN 6 AND 10), words text[] NOT NULL);
GRANT SELECT ON public.word_level_catalog TO authenticated; GRANT ALL ON public.word_level_catalog TO service_role;
ALTER TABLE public.word_level_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_level_catalog_read ON public.word_level_catalog FOR SELECT TO authenticated USING (true);
CREATE TABLE public.word_level_boards (space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE, level int NOT NULL REFERENCES public.word_level_catalog(level), size int NOT NULL, grid jsonb NOT NULL, words text[] NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (space_id, level));
GRANT SELECT ON public.word_level_boards TO authenticated; GRANT ALL ON public.word_level_boards TO service_role;
ALTER TABLE public.word_level_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_level_boards_read ON public.word_level_boards FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE TABLE public.word_level_finds (space_id uuid NOT NULL, level int NOT NULL, word text NOT NULL, user_id uuid NOT NULL, coins int NOT NULL DEFAULT 1 CHECK (coins = 1), exp int NOT NULL DEFAULT 10 CHECK (exp = 10), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (space_id, level, word), FOREIGN KEY (space_id, level) REFERENCES public.word_level_boards(space_id, level) ON DELETE CASCADE);
GRANT SELECT ON public.word_level_finds TO authenticated; GRANT ALL ON public.word_level_finds TO service_role;
ALTER TABLE public.word_level_finds ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_level_finds_read ON public.word_level_finds FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE TABLE public.word_level_completions (space_id uuid NOT NULL, level int NOT NULL, user_id uuid NOT NULL, coins int NOT NULL DEFAULT 5 CHECK (coins = 5), exp int NOT NULL DEFAULT 50 CHECK (exp = 50), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (space_id, level), FOREIGN KEY (space_id, level) REFERENCES public.word_level_boards(space_id, level) ON DELETE CASCADE);
GRANT SELECT ON public.word_level_completions TO authenticated; GRANT ALL ON public.word_level_completions TO service_role;
ALTER TABLE public.word_level_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_level_completions_read ON public.word_level_completions FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE FUNCTION public.build_word_grid(p_words text[], p_size int) RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path=public AS $$
DECLARE g text[] := array_fill(''::text, ARRAY[p_size*p_size]); placed text[] := '{}'; w text; t int; d int; dx int; dy int; x int; y int; i int; ok boolean; dirs int[] := ARRAY[1,0, 0,1, 1,1, -1,0, 0,-1, 1,-1, -1,1, -1,-1]; rws jsonb := '[]'; r jsonb; c text;
BEGIN
  FOREACH w IN ARRAY p_words LOOP
    FOR t IN 1..400 LOOP
      d := floor(random()*CASE WHEN t < 200 THEN 8 ELSE 3 END)::int; dx := dirs[d*2+1]; dy := dirs[d*2+2];
      x := floor(random()*p_size)::int; y := floor(random()*p_size)::int; ok := true;
      FOR i IN 0..length(w)-1 LOOP
        IF x+i*dx NOT BETWEEN 0 AND p_size-1 OR y+i*dy NOT BETWEEN 0 AND p_size-1 THEN ok := false; EXIT; END IF;
        c := g[(y+i*dy)*p_size + x+i*dx + 1];
        IF c <> '' AND c <> substr(w,i+1,1) THEN ok := false; EXIT; END IF;
      END LOOP;
      IF ok THEN FOR i IN 0..length(w)-1 LOOP g[(y+i*dy)*p_size + x+i*dx + 1] := substr(w,i+1,1); END LOOP; placed := placed || w; EXIT; END IF;
    END LOOP;
  END LOOP;
  FOR y IN 0..p_size-1 LOOP r := '[]';
    FOR x IN 0..p_size-1 LOOP c := g[y*p_size+x+1]; IF c = '' THEN c := substr('AAEEIOOURSNLTCDMBP', 1+floor(random()*18)::int, 1); END IF; r := r || to_jsonb(c); END LOOP;
    rws := rws || jsonb_build_array(r);
  END LOOP;
  RETURN jsonb_build_object('grid', rws, 'words', to_jsonb(placed));
END $$;
REVOKE ALL ON FUNCTION public.build_word_grid(text[], int) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_word_level() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); lv int; cat public.word_level_catalog; b jsonb;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'El espacio no está activo'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('words:'||s::text));
  SELECT min(level) INTO lv FROM word_level_catalog c WHERE NOT EXISTS (SELECT 1 FROM word_level_completions x WHERE x.space_id = s AND x.level = c.level);
  IF lv IS NULL THEN RETURN jsonb_build_object('finished', true, 'level', 100); END IF;
  SELECT * INTO cat FROM word_level_catalog WHERE level = lv;
  IF NOT EXISTS (SELECT 1 FROM word_level_boards WHERE space_id = s AND level = lv) THEN
    b := public.build_word_grid(cat.words, cat.size);
    INSERT INTO word_level_boards(space_id, level, size, grid, words) VALUES (s, lv, cat.size, b->'grid', ARRAY(SELECT jsonb_array_elements_text(b->'words')));
  END IF;
  RETURN (SELECT jsonb_build_object('finished', false, 'level', b2.level, 'size', b2.size, 'grid', b2.grid, 'words', to_jsonb(b2.words)) FROM word_level_boards b2 WHERE space_id = s AND level = lv);
END $$;

CREATE FUNCTION public.find_level_word(p_level int, p_start int, p_end int) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); b public.word_level_boards; n int; x int; y int; dx int; dy int; i int; word text := ''; awarded boolean; done boolean := false;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'El espacio no está activo'; END IF;
  SELECT * INTO b FROM word_level_boards WHERE space_id = s AND level = p_level;
  IF b.space_id IS NULL THEN RAISE EXCEPTION 'Tablero no encontrado'; END IF;
  IF p_start IS NULL OR p_end IS NULL OR p_start NOT BETWEEN 0 AND b.size*b.size-1 OR p_end NOT BETWEEN 0 AND b.size*b.size-1 THEN RAISE EXCEPTION 'Selección no válida'; END IF;
  x := p_start % b.size; y := p_start / b.size; dx := p_end % b.size - x; dy := p_end / b.size - y;
  IF dx <> 0 AND dy <> 0 AND abs(dx) <> abs(dy) THEN RAISE EXCEPTION 'Selecciona una línea recta'; END IF;
  n := greatest(abs(dx), abs(dy)); dx := sign(dx); dy := sign(dy);
  FOR i IN 0..n LOOP word := word || (b.grid->(y+i*dy)->>(x+i*dx)); END LOOP;
  IF NOT (word = ANY(b.words)) THEN word := reverse(word); END IF;
  IF NOT (word = ANY(b.words)) THEN RAISE EXCEPTION 'Esa palabra no está en el tablero'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text));
  INSERT INTO word_level_finds(space_id, level, word, user_id) VALUES (s, p_level, word, auth.uid()) ON CONFLICT DO NOTHING; awarded := FOUND;
  IF (SELECT count(*) FROM word_level_finds WHERE space_id = s AND level = p_level) >= cardinality(b.words) THEN
    INSERT INTO word_level_completions(space_id, level, user_id) VALUES (s, p_level, auth.uid()) ON CONFLICT DO NOTHING; done := FOUND;
  END IF;
  RETURN jsonb_build_object('word', word, 'coins', (CASE WHEN awarded THEN 1 ELSE 0 END) + (CASE WHEN done THEN 5 ELSE 0 END), 'exp', (CASE WHEN awarded THEN 10 ELSE 0 END) + (CASE WHEN done THEN 50 ELSE 0 END), 'completed', done);
END $$;
REVOKE ALL ON FUNCTION public.get_word_level(), public.find_level_word(int,int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_word_level(), public.find_level_word(int,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.appa_balance(p_space uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT (coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_bath_rewards WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_finds WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_level_finds WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_level_completions WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM care_rituals WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_furniture WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_outfits WHERE space_id=p_space),0))::integer $$;
REVOKE ALL ON FUNCTION public.appa_balance(uuid) FROM PUBLIC,anon,authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.word_level_finds, public.word_level_completions;

INSERT INTO public.word_level_catalog(level, size, words)
SELECT n::int, CASE WHEN n <= 25 THEN 8 WHEN n <= 60 THEN 9 ELSE 10 END, string_to_array(w, ',')
FROM unnest(string_to_array('CARIDAD,SUFRIDA,BENIGNA,AMOR,BESO;BUSCA,SUYO,IRRITA,ABRAZO,TERNURA;SUFRE,CREE,ESPERA,CARINO,HOGAR;AHORA,CARIDAD,ESTAS,JUNTOS,PAREJA;AMEMONOS,UNOS,OTROS,MIMOS,ROSA;CONOCE,DIOS,AMOR,LIRIO,CORAZON;AMAMOS,PRIMERO,SUENOS,DULZURA,PASION;MANERA,DIOS,MUNDO,ALMA,TESORO;AMEIS,UNOS,OTROS,BONITA,CUIDAR;AMANDOOS,UNOS,OTROS,ETERNO,FIEL;ESTAS,COSAS,VESTIOS,PROMESA,ANILLO;TODA,HUMILDAD,UNOS,CITA,NOVIOS;ODIO,CARIDAD,CUBRIRA,MIMIE,CARLITO;MUCHAS,AGUAS,PODRAN,SONRISA,LUNA;CARIDAD,PROJIMO,ESTRELLA,CANCION,DETALLE;DEJO,MUNDO,TURBE,PERDON,ESCUCHAR;ESTAS,COSAS,HABLADO,AMISTAD,ALEGRIA;DIOS,GUARDARA,VUESTROS,CARICIA,FLORES;COMPLETA,CUYO,CONFIADO,APPA,AMOR;ACOSTARE,ASIMISMO,DORMIRE,BESO,ABRAZO;TENEMOS,DIOS,MEDIO,TERNURA,CARINO;PUEDE,HACER,CUANTO,HOGAR,JUNTOS;DIOS,GOBIERNE,VUESTROS,PAREJA,MIMOS;SENOR,TODA,MANERA,ROSA,LIRIO;LLAMADOS,HIJOS,DIOS,CORAZON,SUENOS;JEHOVA,DARA,FORTALEZA,DULZURA,PASION,ALMA;EFECTO,JUSTICIA,LABOR,TESORO,BONITA,CUIDAR;SEGUID,SANTIDAD,NADIE,ETERNO,FIEL,PROMESA;INTENCION,CARNE,MUERTE,ANILLO,CITA,NOVIOS;MUCHA,AMAN,TROPIEZO,MIMIE,CARLITO,SONRISA;SUSTANCIA,COSAS,ESPERAN,LUNA,ESTRELLA,CANCION;EMPERO,IMPOSIBLE,AGRADAR,DETALLE,PERDON,ESCUCHAR;ANDAMOS,VISTA,AMISTAD,ALEGRIA,CONFIANZA,CARICIA;LUEGO,PALABRA,DIOS,FLORES,APPA,AMOR;JESUS,DIJO,PUEDES,BESO,ABRAZO,TERNURA;TANTO,DIGO,ORANDO,CARINO,HOGAR,JUNTOS;JESUS,DIJO,CIERTO,PAREJA,MIMOS,ROSA;PERO,PIDA,DUDANDO,LIRIO,CORAZON,SUENOS;GRACIA,SOIS,SALVOS,DULZURA,PASION,ALMA;CRISTO,ESTOY,VIVO,TESORO,BONITA,CUIDAR;PRUEBA,MUCHO,PRECIOSA,ETERNO,FIEL,PROMESA;JUSTICIA,DIOS,DESCUBRE,ANILLO,CITA,NOVIOS;PUESTOS,OJOS,AUTOR,MIMIE,CARLITO,SONRISA;FIATE,JEHOVA,CORAZON,LUNA,ESTRELLA,CANCION;CAMINOS,VEREDAS,DETALLE,PERDON,ESCUCHAR,AMISTAD;DIOS,ESPERANZA,LLENE,ALEGRIA,CONFIANZA,CARICIA;ACERCA,DICE,JEHOVA,FLORES,APPA,AMOR;ESPERAN,JEHOVA,TENDRAN,BESO,ABRAZO,TERNURA;ABATES,ALMA,CONTURBAS,CARINO,HOGAR,JUNTOS;JEHOVA,SOMOS,NUNCA,PAREJA,MIMOS,ROSA;NUEVAS,CADA,MANANA,LIRIO,CORAZON,SUENOS;PARTE,JEHOVA,DIJO,DULZURA,PASION,ALMA;TENEMOS,SEGURA,FIRME,TESORO,BONITA,CUIDAR;ESPERANZA,SOMOS,SALVOS,ETERNO,FIEL,PROMESA;EMPERO,VEMOS,ESPERAMOS,ANILLO,CITA,NOVIOS;ESPERE,JEHOVA,ESPERO,MIMIE,CARLITO,SONRISA;SENOR,JEHOVA,ERES,LUNA,ESTRELLA,CANCION;BENDITO,DIOS,PADRE,DETALLE,PERDON,ESCUCHAR;ESFORZAOS,ESPERAIS,JEHOVA,AMISTAD,ALEGRIA,CONFIANZA;ESPERANZA,AMOR,DIOS,CARICIA,FLORES,APPA;MIRA,MANDO,ESFUERCES,SEAS,VALIENTE,AMOR,BESO;TEMAS,CONTIGO,DESMAYES,DIOS,ESFUERZO,ABRAZO,TERNURA;PUEDO,CRISTO,FORTALECE,CARINO,HOGAR,JUNTOS,PAREJA;ESFORZAOS,COBRAD,ANIMO,TEMAIS,TENGAIS,MIMOS,ROSA;SALMO,DAVID,JEHOVA,SALVACION,QUIEN,LIRIO,CORAZON;MUSICO,PRINCIPAL,HIJOS,CORE,SALMO,SUENOS,DULZURA;DADO,DIOS,ESPIRITU,TEMOR,FORTALEZA,PASION,ALMA;VENID,ESTAIS,TRABAJADOS,CARGADOS,HARE,TESORO,BONITA;LLEVAD,YUGO,APRENDED,MANSO,HUMILDE,CUIDAR,ETERNO;ECHANDO,TODA,SOLICITUD,CUIDADO,FIEL,PROMESA,ANILLO;CERCANO,JEHOVA,CORAZON,SALVARA,CONTRITOS,CITA,NOVIOS;PASARES,AGUAS,SERE,CONTIGO,RIOS,MIMIE,CARLITO;TANTO,DESMAYAMOS,ANTES,AUNQUE,HOMBRE,SONRISA,LUNA;TURBE,CORAZON,CREEIS,DIOS,CREED,ESTRELLA,CANCION;CONSOLAOS,UNOS,OTROS,EDIFICAOS,HACEIS,DETALLE,PERDON;VENID,CELEBREMOS,JEHOVA,CANTEMOS,JUBILO,ESCUCHAR,AMISTAD;VENID,ADOREMOS,DELANTE,JEHOVA,HACEDOR,ALEGRIA,CONFIANZA;SERVID,JEHOVA,ALEGRIA,VENID,ANTE,CARICIA,FLORES;ENTRAD,PUERTAS,ATRIOS,ALABANZA,ALABADLE,APPA,AMOR;SALMO,DAVID,BENDICE,ALMA,JEHOVA,BESO,ABRAZO;RESPIRA,ALABE,ALELUYA,TERNURA,CARINO,HOGAR,JUNTOS;DIOS,ESPIRITU,ADORAN,VERDAD,NECESARIO,PAREJA,MIMOS;OFREZCAMOS,MEDIO,DIOS,SACRIFICIO,ALABANZA,ROSA,LIRIO;SENOR,DIGNO,ERES,RECIBIR,GLORIA,CORAZON,SUENOS;TRIBUTAD,JEHOVA,GLORIA,DEBIDA,NOMBRE,DULZURA,PASION;JEHOVA,GLORIA,DEBIDA,NOMBRE,HUMILLAOS,ALMA,TESORO;ENCORVAOS,JEHOVA,HERMOSURA,SANTUARIO,TEMED,BONITA,CUIDAR;SALMO,DAVID,MUDO,SEMBLANTE,DELANTE,ETERNO,FIEL;JEHOVA,FORTALEZA,CANCION,SALUD,DIOS,PROMESA,ANILLO;GRANDE,JEHOVA,DIGNO,SUPREMA,ALABANZA,CITA,NOVIOS;ENSANCHA,ENVIDIA,BENIGNA,SUFRIDA,CARIDAD,MIMIE,CARLITO;PIENSA,IRRITA,SUYO,BUSCA,INJURIOSA,SONRISA,LUNA;SOPORTA,ESPERA,CREE,SUFRE,ESTRELLA,CANCION,DETALLE;MAYOR,EMPERO,TRES,ESTAS,CARIDAD,PERDON,ESCUCHAR;CONOCE,NACIDO,CUALQUIERA,DIOS,AMOR,AMISTAD,ALEGRIA;AMOR,DIOS,CONOCE,CONFIANZA,CARICIA,FLORES,APPA;PRIMERO,AMAMOS,AMOR,BESO,ABRAZO,TERNURA,CARINO;ETERNA,VIDA,TENGA,PIERDA,CREE,HOGAR,JUNTOS;AMADO,OTROS,UNOS,AMEIS,PAREJA,MIMOS,ROSA;HONRA,FRATERNAL,CARIDAD,OTROS,UNOS,LIRIO,CORAZON', ';')) WITH ORDINALITY AS t(w, n);
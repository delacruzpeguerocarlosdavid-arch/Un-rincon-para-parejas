-- Migración 0021: Cartas estilo L (Death Note) y Regalos estilo Levi Ackerman (Attack on Titan)

-- 1. Soporte de temática y programación para correspondencia (Cartas de L)
ALTER TABLE public.correspondence ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic' CHECK (theme IN ('classic', 'l_investigation'));
ALTER TABLE public.correspondence ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL;

-- Política de lectura segura: el destinatario no puede ver cartas antes de su fecha programada
DROP POLICY IF EXISTS correspondence_read ON public.correspondence;
CREATE POLICY correspondence_read ON public.correspondence FOR SELECT TO authenticated 
USING (space_id = public.my_space() AND (scheduled_at IS NULL OR scheduled_at <= now() OR author_id = auth.uid()));

-- Actualización de función para guardar correspondencia con soporte de tema y programación
CREATE OR REPLACE FUNCTION public.save_correspondence(
  p_kind text,
  p_title text,
  p_content text,
  p_folder text DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_theme text DEFAULT 'classic',
  p_scheduled_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; result uuid;
BEGIN
 PERFORM public.ensure_membership(); s:=public.my_space();
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('chat','note','letter','library') THEN RAISE EXCEPTION 'Tipo de mensaje inválido'; END IF;
 IF p_theme IS NULL OR p_theme NOT IN ('classic','l_investigation') THEN p_theme := 'classic'; END IF;
 IF p_title IS NULL OR length(btrim(p_title))>160 OR (p_kind IN ('letter','library') AND length(btrim(p_title))=0) THEN RAISE EXCEPTION 'El título debe tener entre 1 y 160 caracteres'; END IF;
 IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 20000 THEN RAISE EXCEPTION 'Escribe entre 1 y 20000 caracteres'; END IF;
 IF p_kind='library' THEN
  IF p_folder IS NULL OR p_folder NOT IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando sientas que no te escucho','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') THEN RAISE EXCEPTION 'Elige una carpeta válida'; END IF;
 ELSE p_folder:=NULL;
 END IF;
 
 IF p_scheduled_at IS NOT NULL AND p_scheduled_at < now() THEN
  p_scheduled_at := NULL;
 END IF;

 IF p_id IS NULL THEN
  INSERT INTO public.correspondence(space_id,author_id,kind,title,content,folder,theme,scheduled_at) 
  VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_folder,p_theme,p_scheduled_at) 
  RETURNING id INTO result;
 ELSE
  UPDATE public.correspondence 
  SET title=btrim(p_title),content=btrim(p_content),folder=p_folder,theme=p_theme,scheduled_at=p_scheduled_at,updated_at=now() 
  WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind=p_kind 
  RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios textos'; END IF;
 END IF;
 RETURN result;
END $$;

-- Wrapper de compatibilidad para llamadas previas con 5 parámetros
CREATE OR REPLACE FUNCTION public.save_correspondence(
  p_kind text,
  p_title text,
  p_content text,
  p_folder text,
  p_id uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN public.save_correspondence(p_kind, p_title, p_content, p_folder, p_id, 'classic', NULL);
END $$;

REVOKE ALL ON FUNCTION public.save_correspondence(text,text,text,text,uuid,text,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_correspondence(text,text,text,text,uuid,text,timestamptz) TO authenticated;

-- 2. Sistema de Regalos de Levi Ackerman (Attack on Titan)
CREATE TABLE IF NOT EXISTS public.couple_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  gift_id text NOT NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 2000),
  opened_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.couple_gifts TO authenticated;
GRANT ALL ON public.couple_gifts TO service_role;
ALTER TABLE public.couple_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY couple_gifts_read ON public.couple_gifts FOR SELECT TO authenticated
USING (space_id = public.my_space());

CREATE INDEX IF NOT EXISTS couple_gifts_space_created ON public.couple_gifts(space_id, created_at DESC);

-- Función para enviar un regalo especial a la pareja
CREATE OR REPLACE FUNCTION public.send_couple_gift(
  p_gift_id text,
  p_title text,
  p_message text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  s uuid;
  recipient uuid;
  result_id uuid;
BEGIN
  PERFORM public.ensure_membership();
  s := public.my_space();
  IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
  
  -- Buscar al usuario pareja dentro del mismo espacio
  SELECT user_id INTO recipient FROM public.user_roles WHERE space_id = s AND user_id <> auth.uid() LIMIT 1;
  IF recipient IS NULL THEN RAISE EXCEPTION 'Tu pareja aún no se ha vinculado al espacio'; END IF;
  
  IF p_gift_id IS NULL OR btrim(p_gift_id) = '' THEN RAISE EXCEPTION 'Selecciona un regalo válido'; END IF;
  IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'El título debe tener entre 1 y 120 caracteres'; END IF;
  
  INSERT INTO public.couple_gifts(space_id, sender_id, recipient_id, gift_id, title, message)
  VALUES (s, auth.uid(), recipient, btrim(p_gift_id), btrim(p_title), coalesce(btrim(p_message), ''))
  RETURNING id INTO result_id;
  
  RETURN result_id;
END $$;

REVOKE ALL ON FUNCTION public.send_couple_gift(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_couple_gift(text,text,text) TO authenticated;

-- Función para abrir un regalo recibido
CREATE OR REPLACE FUNCTION public.open_couple_gift(
  p_gift_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  g public.couple_gifts%ROWTYPE;
BEGIN
  PERFORM public.ensure_membership();
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
  
  SELECT * INTO g FROM public.couple_gifts WHERE id = p_gift_id AND space_id = public.my_space();
  IF g.id IS NULL THEN RAISE EXCEPTION 'Regalo no encontrado'; END IF;
  IF g.recipient_id <> auth.uid() THEN RAISE EXCEPTION 'Solo el destinatario puede abrir este regalo'; END IF;
  
  IF g.opened_at IS NULL THEN
    UPDATE public.couple_gifts SET opened_at = now() WHERE id = g.id;
    g.opened_at := now();
  END IF;
  
  RETURN jsonb_build_object(
    'id', g.id,
    'gift_id', g.gift_id,
    'title', g.title,
    'message', g.message,
    'opened_at', g.opened_at,
    'created_at', g.created_at
  );
END $$;

REVOKE ALL ON FUNCTION public.open_couple_gift(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.open_couple_gift(uuid) TO authenticated;

-- Agregar a Realtime para sincronización instantánea
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_gifts;

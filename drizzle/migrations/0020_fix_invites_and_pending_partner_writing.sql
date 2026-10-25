CREATE OR REPLACE FUNCTION public.guard_closed_space() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.private_spaces WHERE id=NEW.space_id AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'El espacio está archivado'; END IF;
 IF TG_TABLE_NAME='user_roles' THEN
  IF EXISTS(SELECT 1 FROM public.space_departures WHERE space_id=NEW.space_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Esta cuenta fue desvinculada; sus datos siguen conservados'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.ensure_membership() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); em text; sid uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO em FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'Confirma tu correo primero'; END IF;
 IF EXISTS(SELECT 1 FROM public.space_config WHERE lower(admin_email)=em) THEN
  PERFORM pg_advisory_xact_lock(781234);
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid) THEN
   SELECT id INTO sid FROM public.private_spaces WHERE owner_id=uid ORDER BY created_at DESC LIMIT 1;
   IF sid IS NULL THEN INSERT INTO public.private_spaces(owner_id) VALUES(uid) RETURNING id INTO sid; END IF;
   INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,sid,'admin') ON CONFLICT(user_id) DO NOTHING;
  END IF;
 END IF;
 RETURN public.membership_json(uid);
END $$;
CREATE OR REPLACE FUNCTION public.create_invite_code() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE sid uuid; code text:=''; alphabet text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; i int; exp timestamptz:=now()+interval '48 hours';
BEGIN
 PERFORM public.ensure_membership();
 PERFORM pg_advisory_xact_lock(781235);
 sid:=public.my_space();
 IF sid IS NULL OR NOT public.is_space_admin() THEN RAISE EXCEPTION 'Solo el administrador de un espacio activo puede crear códigos de invitación'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=sid AND role='member') THEN RAISE EXCEPTION 'El espacio ya tiene sus dos cuentas'; END IF;
 b:=extensions.gen_random_bytes(10);
 FOR i IN 0..9 LOOP code:=code||substr(alphabet,(get_byte(b,i)%length(alphabet))+1,1); END LOOP;
 UPDATE public.space_invites SET revoked_at=now() WHERE space_id=sid AND used_at IS NULL AND revoked_at IS NULL;
 INSERT INTO public.space_invites(space_id,code_hash,expires_at,created_by) VALUES(sid,encode(extensions.digest(code,'sha256'),'hex'),exp,auth.uid());
 RETURN jsonb_build_object('code',substr(code,1,5)||'-'||substr(code,6,5),'expires_at',exp);
END $$;
CREATE OR REPLACE FUNCTION public.save_correspondence(p_kind text,p_title text,p_content text,p_folder text DEFAULT NULL,p_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; result uuid;
BEGIN
 PERFORM public.ensure_membership(); s:=public.my_space();
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('chat','note','letter','library') THEN RAISE EXCEPTION 'Tipo de mensaje inválido'; END IF;
 IF p_title IS NULL OR length(btrim(p_title))>160 OR (p_kind IN ('letter','library') AND length(btrim(p_title))=0) THEN RAISE EXCEPTION 'El título debe tener entre 1 y 160 caracteres'; END IF;
 IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 20000 THEN RAISE EXCEPTION 'Escribe entre 1 y 20000 caracteres'; END IF;
 IF p_kind='library' THEN
  IF p_folder IS NULL OR p_folder NOT IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando sientas que no te escucho','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') THEN RAISE EXCEPTION 'Elige una carpeta válida'; END IF;
 ELSE p_folder:=NULL;
 END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.correspondence(space_id,author_id,kind,title,content,folder) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_folder) RETURNING id INTO result;
 ELSE
  UPDATE public.correspondence SET title=btrim(p_title),content=btrim(p_content),folder=p_folder,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind='library' AND p_kind='library' RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios textos'; END IF;
 END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.save_journal_entry(p_kind text,p_title text,p_content text,p_date date,p_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid; r uuid;
BEGIN
 PERFORM public.ensure_membership(); s:=public.my_space();
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('private','shared') THEN RAISE EXCEPTION 'Tipo de diario inválido'; END IF;
 IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'El título debe tener entre 1 y 160 caracteres'; END IF;
 IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 30000 THEN RAISE EXCEPTION 'Escribe entre 1 y 30000 caracteres'; END IF;
 IF p_date IS NULL THEN RAISE EXCEPTION 'Elige una fecha válida'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.journal_entries(space_id,author_id,kind,title,content,entry_date) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_date) RETURNING id INTO r;
 ELSE
  UPDATE public.journal_entries SET title=btrim(p_title),content=btrim(p_content),entry_date=p_date,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind=p_kind AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propias entradas'; END IF;
 END IF;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.ensure_membership(),public.create_invite_code(),public.save_correspondence(text,text,text,text,uuid),public.save_journal_entry(text,text,text,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_membership(),public.create_invite_code(),public.save_correspondence(text,text,text,text,uuid),public.save_journal_entry(text,text,text,date,uuid) TO authenticated;
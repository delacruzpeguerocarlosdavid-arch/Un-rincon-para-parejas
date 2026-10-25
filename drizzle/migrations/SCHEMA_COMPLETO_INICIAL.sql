CREATE TABLE public.space_config (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), admin_email text NOT NULL);
GRANT ALL ON public.space_config TO service_role;
ALTER TABLE public.space_config ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, UPDATE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.private_spaces (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES public.profiles(id), partner_email text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.private_spaces TO authenticated; GRANT ALL ON public.private_spaces TO service_role;
ALTER TABLE public.private_spaces ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX one_private_space ON public.private_spaces ((true));
CREATE TYPE public.app_role AS ENUM ('admin','member');
CREATE TABLE public.user_roles (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, space_id uuid NOT NULL REFERENCES public.private_spaces(id), role public.app_role NOT NULL);
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.my_space() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT space_id FROM public.user_roles WHERE user_id=auth.uid() $$;
CREATE FUNCTION public.is_space_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') $$;
REVOKE ALL ON FUNCTION public.my_space(), public.is_space_admin() FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.my_space(), public.is_space_admin() TO authenticated;
CREATE POLICY role_read ON public.user_roles FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE POLICY space_read ON public.private_spaces FOR SELECT TO authenticated USING(id=public.my_space());
CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=profiles.id AND r.space_id=public.my_space()));
CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE FUNCTION public.create_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,display_name) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'display_name',NEW.raw_user_meta_data->>'full_name','')); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.create_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile();
CREATE FUNCTION public.ensure_membership() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid:=auth.uid(); em text; sid uuid; BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO em FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'Confirma tu correo primero'; END IF;
 PERFORM pg_advisory_xact_lock(781234);
 IF EXISTS(SELECT 1 FROM public.space_config WHERE admin_email=em) THEN
  INSERT INTO public.private_spaces(owner_id) SELECT uid WHERE NOT EXISTS(SELECT 1 FROM public.private_spaces);
  SELECT id INTO sid FROM public.private_spaces WHERE owner_id=uid;
  IF sid IS NOT NULL THEN INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,sid,'admin') ON CONFLICT(user_id) DO NOTHING; END IF;
 ELSE
  SELECT id INTO sid FROM public.private_spaces WHERE lower(partner_email)=em;
  IF sid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=sid AND role='member' AND user_id<>uid) THEN INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,sid,'member') ON CONFLICT(user_id) DO NOTHING; END IF;
 END IF;
 RETURN (SELECT jsonb_build_object('user_id',r.user_id,'space_id',r.space_id,'role',r.role,'display_name',p.display_name,'partner_email',s.partner_email) FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id JOIN public.private_spaces s ON s.id=r.space_id WHERE r.user_id=uid);
 END $$;
REVOKE ALL ON FUNCTION public.ensure_membership() FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.ensure_membership() TO authenticated;
CREATE FUNCTION public.invite_partner(p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.is_space_admin() THEN RAISE EXCEPTION 'Solo el administrador puede autorizar una cuenta'; END IF;
 IF p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Correo inválido'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=public.my_space() AND role='member') THEN RAISE EXCEPTION 'El espacio ya tiene sus dos cuentas'; END IF;
 IF EXISTS(SELECT 1 FROM public.space_config WHERE admin_email=lower(trim(p_email))) THEN RAISE EXCEPTION 'Usa un correo diferente al tuyo'; END IF;
 UPDATE public.private_spaces SET partner_email=lower(trim(p_email)) WHERE id=public.my_space(); END $$;
REVOKE ALL ON FUNCTION public.invite_partner(text) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.invite_partner(text) TO authenticated;
CREATE TABLE public.bank_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), space_id uuid NOT NULL REFERENCES public.private_spaces(id), author_id uuid NOT NULL REFERENCES public.profiles(id), content text NOT NULL CHECK(length(trim(content)) BETWEEN 1 AND 10000), category text NOT NULL CHECK(category IN ('amor','ánimo','fe','tristeza','alegría','tranquilidad','reconciliación')), approval text NOT NULL DEFAULT 'pending' CHECK(approval IN ('pending','approved','rejected')), scheduled_date date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.bank_messages TO authenticated; GRANT ALL ON public.bank_messages TO service_role;
ALTER TABLE public.bank_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_read ON public.bank_messages FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE UNIQUE INDEX one_message_per_date ON public.bank_messages(space_id,scheduled_date) WHERE scheduled_date IS NOT NULL AND approval='approved';
CREATE TABLE public.daily_history (space_id uuid NOT NULL REFERENCES public.private_spaces(id), day date NOT NULL, message_id uuid NOT NULL, content text NOT NULL, category text NOT NULL, author_name text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(space_id,day));
GRANT SELECT ON public.daily_history TO authenticated; GRANT ALL ON public.daily_history TO service_role;
ALTER TABLE public.daily_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_read ON public.daily_history FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE FUNCTION public.save_bank_message(p_content text,p_category text,p_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE mid uuid; BEGIN
 IF public.my_space() IS NULL THEN RAISE EXCEPTION 'Tu cuenta no pertenece al espacio privado'; END IF;
 IF p_id IS NULL THEN INSERT INTO public.bank_messages(space_id,author_id,content,category) VALUES(public.my_space(),auth.uid(),trim(p_content),p_category) RETURNING id INTO mid;
 ELSE UPDATE public.bank_messages SET content=trim(p_content),category=p_category,approval='pending',scheduled_date=NULL,updated_at=now() WHERE id=p_id AND space_id=public.my_space() AND (author_id=auth.uid() OR public.is_space_admin()) RETURNING id INTO mid;
 IF mid IS NULL THEN RAISE EXCEPTION 'No tienes permiso para editar este mensaje'; END IF; END IF; RETURN mid; END $$;
CREATE FUNCTION public.review_bank_message(p_id uuid,p_approval text,p_date date DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.is_space_admin() THEN RAISE EXCEPTION 'Solo el administrador puede aprobar, rechazar o programar'; END IF;
 IF p_approval NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
 IF p_date IS NOT NULL AND (p_approval<>'approved' OR p_date<(now() AT TIME ZONE 'America/Santo_Domingo')::date) THEN RAISE EXCEPTION 'Elige una fecha válida para un mensaje aprobado'; END IF;
 IF p_date IS NOT NULL AND EXISTS(SELECT 1 FROM public.daily_history WHERE space_id=public.my_space() AND day=p_date) THEN RAISE EXCEPTION 'El mensaje de ese día ya se publicó'; END IF;
 UPDATE public.bank_messages SET approval=p_approval,scheduled_date=p_date,updated_at=now() WHERE id=p_id AND space_id=public.my_space();
 IF NOT FOUND THEN RAISE EXCEPTION 'Mensaje no encontrado'; END IF; END $$;
CREATE FUNCTION public.delete_bank_message(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 DELETE FROM public.bank_messages WHERE id=p_id AND space_id=public.my_space() AND (author_id=auth.uid() OR public.is_space_admin()); IF NOT FOUND THEN RAISE EXCEPTION 'No tienes permiso para eliminar este mensaje'; END IF; END $$;
REVOKE ALL ON FUNCTION public.save_bank_message(text,text,uuid), public.review_bank_message(uuid,text,date),public.delete_bank_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_bank_message(text,text,uuid),public.review_bank_message(uuid,text,date),public.delete_bank_message(uuid) TO authenticated;
CREATE FUNCTION public.select_daily_for_space(p_space uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE d date:=(now() AT TIME ZONE 'America/Santo_Domingo')::date; result jsonb; chosen public.bank_messages; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_space::text,0));
 SELECT to_jsonb(h) INTO result FROM public.daily_history h WHERE space_id=p_space AND day=d; IF result IS NOT NULL THEN RETURN result; END IF;
 SELECT m.* INTO chosen FROM public.bank_messages m WHERE m.space_id=p_space AND m.approval='approved' AND (m.scheduled_date=d OR m.scheduled_date IS NULL)
 ORDER BY (m.scheduled_date=d) DESC NULLS LAST, (SELECT max(h.day) FROM public.daily_history h WHERE h.space_id=p_space AND h.message_id=m.id) ASC NULLS FIRST,m.created_at,m.id LIMIT 1;
 IF chosen.id IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.daily_history(space_id,day,message_id,content,category,author_name) VALUES(p_space,d,chosen.id,chosen.content,chosen.category,coalesce((SELECT nullif(display_name,'') FROM public.profiles WHERE id=chosen.author_id),'Nosotros'));
 SELECT to_jsonb(h) INTO result FROM public.daily_history h WHERE space_id=p_space AND day=d; RETURN result; END $$;
REVOKE ALL ON FUNCTION public.select_daily_for_space(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.select_daily_for_space(uuid) TO service_role;
CREATE FUNCTION public.get_daily_message() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF public.my_space() IS NULL THEN RAISE EXCEPTION 'Acceso privado no autorizado'; END IF; RETURN public.select_daily_for_space(public.my_space()); END $$;
REVOKE ALL ON FUNCTION public.get_daily_message() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.get_daily_message() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_messages,public.daily_history;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE FUNCTION public.publish_daily_messages() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s record; BEGIN FOR s IN SELECT id FROM public.private_spaces LOOP PERFORM public.select_daily_for_space(s.id); END LOOP; END $$;
REVOKE ALL ON FUNCTION public.publish_daily_messages() FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.publish_daily_messages() TO service_role;
ALTER TABLE public.profiles ADD COLUMN nickname text NOT NULL DEFAULT '', ADD COLUMN avatar text NOT NULL DEFAULT 'lirio', ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD CONSTRAINT profile_lengths CHECK (length(display_name)<=80 AND length(nickname)<=40 AND avatar IN ('lirio','corazon','luna','sol','estrella','appa'));

CREATE TABLE public.space_invites (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE, code_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), used_at timestamptz, used_by uuid, revoked_at timestamptz);
GRANT ALL ON public.space_invites TO service_role;
ALTER TABLE public.space_invites ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.invite_attempts (user_id uuid NOT NULL, attempted_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.invite_attempts TO service_role;
ALTER TABLE public.invite_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX invite_attempts_user ON public.invite_attempts(user_id, attempted_at);

REVOKE EXECUTE ON FUNCTION public.invite_partner(text) FROM authenticated;
COMMENT ON FUNCTION public.invite_partner(text) IS 'DEPRECATED: replaced by create_invite_code';
COMMENT ON COLUMN public.private_spaces.partner_email IS 'DEPRECATED: partner joins with an invite code';

CREATE OR REPLACE FUNCTION public.membership_json(uid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('user_id',r.user_id,'space_id',r.space_id,'role',r.role,'display_name',p.display_name,'nickname',p.nickname,'avatar',p.avatar,'preferences',p.preferences,'partner_email',NULL)
 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.user_id=uid $$;
REVOKE ALL ON FUNCTION public.membership_json(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_membership() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE uid uuid:=auth.uid(); em text; sid uuid; BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO em FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'Confirma tu correo primero'; END IF;
 IF EXISTS(SELECT 1 FROM public.space_config WHERE admin_email=em) AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid) THEN
  PERFORM pg_advisory_xact_lock(781234);
  INSERT INTO public.private_spaces(owner_id) SELECT uid WHERE NOT EXISTS(SELECT 1 FROM public.private_spaces);
  SELECT id INTO sid FROM public.private_spaces WHERE owner_id=uid;
  IF sid IS NOT NULL THEN INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,sid,'admin') ON CONFLICT(user_id) DO NOTHING; END IF;
 END IF;
 RETURN public.membership_json(uid);
END $$;

CREATE OR REPLACE FUNCTION public.update_my_profile(p_display_name text, p_nickname text, p_avatar text, p_preferences jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 IF length(trim(coalesce(p_display_name,''))) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'Tu nombre debe tener entre 1 y 80 caracteres'; END IF;
 IF length(trim(coalesce(p_nickname,'')))>40 THEN RAISE EXCEPTION 'El apodo puede tener hasta 40 caracteres'; END IF;
 IF p_avatar NOT IN ('lirio','corazon','luna','sol','estrella','appa') THEN RAISE EXCEPTION 'Avatar inválido'; END IF;
 IF jsonb_typeof(p_preferences)<>'object' OR length(p_preferences::text)>2000 THEN RAISE EXCEPTION 'Preferencias inválidas'; END IF;
 IF (p_preferences ? 'favorite_category') AND NOT (p_preferences->>'favorite_category' IN ('amor','ánimo','fe','tristeza','alegría','tranquilidad','reconciliación')) THEN RAISE EXCEPTION 'Categoría inválida'; END IF;
 UPDATE public.profiles SET display_name=trim(p_display_name), nickname=trim(coalesce(p_nickname,'')), avatar=p_avatar,
  preferences=jsonb_strip_nulls(jsonb_build_object('favorite_category',p_preferences->>'favorite_category','greeting',left(p_preferences->>'greeting',60),'show_verse',CASE WHEN jsonb_typeof(p_preferences->'show_verse')='boolean' THEN p_preferences->'show_verse' END))
 WHERE id=auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.get_space_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE sid uuid:=public.my_space(); BEGIN
 IF sid IS NULL THEN RETURN NULL; END IF;
 RETURN jsonb_build_object(
  'members',(SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',p.id,'role',r.role,'display_name',p.display_name,'nickname',p.nickname,'avatar',p.avatar) ORDER BY r.role),'[]') FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.space_id=sid),
  'invite',CASE WHEN public.is_space_admin() THEN (SELECT jsonb_build_object('expires_at',expires_at,'created_at',created_at) FROM public.space_invites WHERE space_id=sid AND used_at IS NULL AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1) END);
END $$;

CREATE OR REPLACE FUNCTION public.create_invite_code() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, extensions AS $$ DECLARE sid uuid:=public.my_space(); code text:=''; alphabet text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea:=extensions.gen_random_bytes(10); i int; exp timestamptz:=now()+interval '48 hours'; BEGIN
 IF NOT public.is_space_admin() THEN RAISE EXCEPTION 'Solo el administrador puede crear códigos de invitación'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=sid AND role='member') THEN RAISE EXCEPTION 'El espacio ya tiene sus dos cuentas'; END IF;
 FOR i IN 0..9 LOOP code:=code||substr(alphabet,(get_byte(b,i)%32)+1,1); END LOOP;
 UPDATE public.space_invites SET revoked_at=now() WHERE space_id=sid AND used_at IS NULL AND revoked_at IS NULL;
 INSERT INTO public.space_invites(space_id,code_hash,expires_at,created_by) VALUES(sid,encode(extensions.digest(code,'sha256'),'hex'),exp,auth.uid());
 RETURN jsonb_build_object('code',substr(code,1,5)||'-'||substr(code,6,5),'expires_at',exp);
END $$;

CREATE OR REPLACE FUNCTION public.revoke_invite_code() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT public.is_space_admin() THEN RAISE EXCEPTION 'Solo el administrador puede anular códigos'; END IF;
 UPDATE public.space_invites SET revoked_at=now() WHERE space_id=public.my_space() AND used_at IS NULL AND revoked_at IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, extensions AS $$ DECLARE uid uuid:=auth.uid(); em text; inv public.space_invites; norm text:=upper(regexp_replace(coalesce(p_code,''),'[^A-Za-z0-9]','','g')); BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO em FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'Confirma tu correo primero'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid) THEN RAISE EXCEPTION 'Tu cuenta ya pertenece al espacio'; END IF;
 IF EXISTS(SELECT 1 FROM public.space_config WHERE admin_email=em) THEN RAISE EXCEPTION 'Esta cuenta es la del administrador'; END IF;
 IF (SELECT count(*) FROM public.invite_attempts WHERE user_id=uid AND attempted_at>now()-interval '15 minutes')>=5 THEN RAISE EXCEPTION 'Demasiados intentos. Espera unos minutos.'; END IF;
 INSERT INTO public.invite_attempts(user_id) VALUES(uid);
 PERFORM pg_advisory_xact_lock(781235);
 SELECT * INTO inv FROM public.space_invites WHERE code_hash=encode(extensions.digest(norm,'sha256'),'hex') FOR UPDATE;
 IF inv.id IS NULL OR inv.revoked_at IS NOT NULL OR inv.used_at IS NOT NULL THEN RAISE EXCEPTION 'Código no válido'; END IF;
 IF inv.expires_at<=now() THEN RAISE EXCEPTION 'Este código venció. Pide uno nuevo.'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=inv.space_id AND role='member') THEN RAISE EXCEPTION 'El espacio ya tiene sus dos cuentas'; END IF;
 INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,inv.space_id,'member');
 UPDATE public.space_invites SET used_at=now(), used_by=uid WHERE id=inv.id;
 RETURN public.membership_json(uid);
END $$;

REVOKE ALL ON FUNCTION public.update_my_profile(text,text,text,jsonb), public.get_space_status(), public.create_invite_code(), public.revoke_invite_code(), public.redeem_invite_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text,text,text,jsonb), public.get_space_status(), public.create_invite_code(), public.revoke_invite_code(), public.redeem_invite_code(text) TO authenticated;
DROP POLICY profile_update ON public.profiles;
REVOKE UPDATE ON public.profiles FROM authenticated;
CREATE UNIQUE INDEX one_member_per_space ON public.user_roles(space_id) WHERE role='member';
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, extensions AS $$ DECLARE uid uuid:=auth.uid(); em text; inv public.space_invites; norm text:=upper(regexp_replace(coalesce(p_code,''),'[^A-Za-z0-9]','','g')); BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO em FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'Confirma tu correo primero'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid) THEN RAISE EXCEPTION 'Tu cuenta ya pertenece al espacio'; END IF;
 IF EXISTS(SELECT 1 FROM public.space_config WHERE admin_email=em) THEN RAISE EXCEPTION 'Esta cuenta es la del administrador'; END IF;
 IF (SELECT count(*) FROM public.invite_attempts WHERE user_id=uid AND attempted_at>now()-interval '15 minutes')>=5 THEN RAISE EXCEPTION 'Demasiados intentos. Espera unos minutos.'; END IF;
 INSERT INTO public.invite_attempts(user_id) VALUES(uid);
 PERFORM pg_advisory_xact_lock(781235);
 SELECT * INTO inv FROM public.space_invites WHERE code_hash=encode(extensions.digest(norm,'sha256'),'hex') FOR UPDATE;
 IF inv.id IS NULL OR inv.revoked_at IS NOT NULL OR inv.used_at IS NOT NULL THEN RETURN jsonb_build_object('error','Código no válido'); END IF;
 IF inv.expires_at<=now() THEN RETURN jsonb_build_object('error','Este código venció. Pide uno nuevo.'); END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=inv.space_id AND role='member') THEN RETURN jsonb_build_object('error','El espacio ya tiene sus dos cuentas'); END IF;
 INSERT INTO public.user_roles(user_id,space_id,role) VALUES(uid,inv.space_id,'member');
 UPDATE public.space_invites SET used_at=now(), used_by=uid WHERE id=inv.id;
 DELETE FROM public.invite_attempts WHERE user_id=uid;
 RETURN public.membership_json(uid);
END $$;
CREATE TABLE public.correspondence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 kind text NOT NULL CHECK (kind IN ('chat','note','letter','library')),
 title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 160),
 content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 20000),
 folder text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((kind = 'library' AND folder IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') AND folder IS NOT NULL) OR (kind <> 'library' AND folder IS NULL)),
 CHECK (kind IN ('chat','note') OR char_length(btrim(title)) > 0)
);
GRANT SELECT ON public.correspondence TO authenticated;
GRANT ALL ON public.correspondence TO service_role;
ALTER TABLE public.correspondence ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondence_read ON public.correspondence FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE INDEX correspondence_space_created ON public.correspondence(space_id, created_at);
CREATE TABLE public.correspondence_reads (
 text_id uuid NOT NULL REFERENCES public.correspondence(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 first_read_at timestamptz NOT NULL DEFAULT now(),
 last_read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (text_id,user_id)
);
GRANT SELECT ON public.correspondence_reads TO authenticated;
GRANT ALL ON public.correspondence_reads TO service_role;
ALTER TABLE public.correspondence_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondence_reads_read ON public.correspondence_reads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.correspondence c WHERE c.id = text_id AND c.space_id = public.my_space()));
CREATE TABLE public.word_favorites (
 text_id uuid NOT NULL REFERENCES public.correspondence(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (text_id,user_id)
);
GRANT SELECT ON public.word_favorites TO authenticated;
GRANT ALL ON public.word_favorites TO service_role;
ALTER TABLE public.word_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY favorites_read ON public.word_favorites FOR SELECT TO authenticated USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.correspondence c WHERE c.id = text_id AND c.space_id = public.my_space()));
CREATE FUNCTION public.save_correspondence(p_kind text, p_title text, p_content text, p_folder text DEFAULT NULL, p_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); result uuid;
BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  IF (SELECT count(*) FROM public.user_roles WHERE space_id = s) <> 2 THEN RAISE EXCEPTION 'Vincula la segunda cuenta antes de enviar'; END IF;
  INSERT INTO public.correspondence(space_id,author_id,kind,title,content,folder) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_folder) RETURNING id INTO result;
 ELSE
  UPDATE public.correspondence SET title=btrim(p_title),content=btrim(p_content),folder=p_folder,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind='library' AND p_kind='library' RETURNING id INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios textos'; END IF;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_correspondence(text,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_correspondence(text,text,text,text,uuid) TO authenticated;
CREATE FUNCTION public.delete_library_text(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 DELETE FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id=auth.uid() AND kind='library';
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes eliminar tus propios textos'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.delete_library_text(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_library_text(uuid) TO authenticated;
CREATE FUNCTION public.mark_correspondence_read(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id<>auth.uid()) THEN RAISE EXCEPTION 'Lectura no autorizada'; END IF;
 INSERT INTO public.correspondence_reads(text_id,user_id) VALUES(p_id,auth.uid()) ON CONFLICT(text_id,user_id) DO UPDATE SET last_read_at=now();
END $$;
REVOKE ALL ON FUNCTION public.mark_correspondence_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_correspondence_read(uuid) TO authenticated;
CREATE FUNCTION public.set_word_favorite(p_id uuid,p_favorite boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.correspondence WHERE id=p_id AND space_id=public.my_space() AND author_id<>auth.uid() AND kind='library') THEN RAISE EXCEPTION 'Solo puedes guardar textos de tu pareja'; END IF;
 IF p_favorite THEN INSERT INTO public.word_favorites(text_id,user_id) VALUES(p_id,auth.uid()) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.word_favorites WHERE text_id=p_id AND user_id=auth.uid(); END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_word_favorite(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_word_favorite(uuid,boolean) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.correspondence,public.correspondence_reads,public.word_favorites;
REVOKE ALL ON public.correspondence, public.correspondence_reads, public.word_favorites FROM anon, authenticated;
GRANT SELECT ON public.correspondence, public.correspondence_reads, public.word_favorites TO authenticated;
GRANT ALL ON public.correspondence, public.correspondence_reads, public.word_favorites TO service_role;
DO $$ BEGIN
 PERFORM cron.schedule('shared-daily-message-santo-domingo', '0 4 * * *', 'SELECT public.publish_daily_messages()');
END $$;
CREATE TABLE public.memories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 memory_date date NOT NULL,
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
 photo_path text NOT NULL,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.journal_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 kind text NOT NULL CHECK (kind IN ('private','shared')),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 30000),
 entry_date date NOT NULL,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.special_dates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
 event_date date NOT NULL,
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
 category text NOT NULL CHECK (category IN ('cumpleaños','aniversario','recuerdo','personalizada')),
 reminder_days int CHECK (reminder_days IN (0,1,3,7,14,30)),
 repeats_yearly boolean NOT NULL DEFAULT true,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.item_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id),
 memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
 journal_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE,
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((memory_id IS NULL) <> (journal_id IS NULL)));
CREATE TABLE public.item_reactions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
 journal_id uuid REFERENCES public.journal_entries(id) ON DELETE CASCADE,
 emoji text NOT NULL CHECK (emoji IN ('❤️','🥰','😂','🙏','😢','✨')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((memory_id IS NULL) <> (journal_id IS NULL)));
CREATE UNIQUE INDEX item_reactions_memory_uq ON public.item_reactions(memory_id,user_id,emoji) WHERE memory_id IS NOT NULL;
CREATE UNIQUE INDEX item_reactions_journal_uq ON public.item_reactions(journal_id,user_id,emoji) WHERE journal_id IS NOT NULL;
CREATE INDEX memories_space_idx ON public.memories(space_id, memory_date DESC);
CREATE INDEX journal_space_idx ON public.journal_entries(space_id, entry_date DESC);
CREATE INDEX special_dates_space_idx ON public.special_dates(space_id);

REVOKE ALL ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions FROM anon, authenticated;
GRANT SELECT ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions TO authenticated;
GRANT ALL ON public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions TO service_role;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY memories_read ON public.memories FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY journal_read ON public.journal_entries FOR SELECT TO authenticated USING (space_id = public.my_space() AND (kind = 'shared' OR author_id = auth.uid()));
CREATE POLICY special_dates_read ON public.special_dates FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY comments_read ON public.item_comments FOR SELECT TO authenticated USING (space_id = public.my_space() AND (memory_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_id AND j.kind = 'shared')));
CREATE POLICY reactions_read ON public.item_reactions FOR SELECT TO authenticated USING (space_id = public.my_space() AND (memory_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.journal_entries j WHERE j.id = journal_id AND j.kind = 'shared')));

CREATE OR REPLACE FUNCTION public.save_memory(p_title text, p_date date, p_description text, p_photo_path text DEFAULT NULL, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  IF p_photo_path IS NULL OR p_photo_path NOT LIKE s::text || '/%' OR p_photo_path LIKE '%..%' THEN RAISE EXCEPTION 'Foto inválida'; END IF;
  INSERT INTO public.memories(space_id,author_id,title,memory_date,description,photo_path) VALUES(s,auth.uid(),btrim(p_title),p_date,btrim(coalesce(p_description,'')),p_photo_path) RETURNING id INTO r;
 ELSE
  UPDATE public.memories SET title=btrim(p_title),memory_date=p_date,description=btrim(coalesce(p_description,'')),updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propios recuerdos'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.save_journal_entry(p_kind text, p_title text, p_content text, p_date date, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_kind NOT IN ('private','shared') THEN RAISE EXCEPTION 'Tipo de diario inválido'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.journal_entries(space_id,author_id,kind,title,content,entry_date) VALUES(s,auth.uid(),p_kind,btrim(p_title),btrim(p_content),p_date) RETURNING id INTO r;
 ELSE
  UPDATE public.journal_entries SET title=btrim(p_title),content=btrim(p_content),entry_date=p_date,updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND kind=p_kind AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo puedes editar tus propias entradas'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.save_special_date(p_name text, p_date date, p_description text, p_category text, p_reminder_days int DEFAULT NULL, p_repeats_yearly boolean DEFAULT true, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO public.special_dates(space_id,author_id,name,event_date,description,category,reminder_days,repeats_yearly) VALUES(s,auth.uid(),btrim(p_name),p_date,btrim(coalesce(p_description,'')),p_category,p_reminder_days,coalesce(p_repeats_yearly,true)) RETURNING id INTO r;
 ELSE
  UPDATE public.special_dates SET name=btrim(p_name),event_date=p_date,description=btrim(coalesce(p_description,'')),category=p_category,reminder_days=p_reminder_days,repeats_yearly=coalesce(p_repeats_yearly,true),updated_at=now() WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NULL RETURNING id INTO r;
  IF r IS NULL THEN RAISE EXCEPTION 'Solo quien creó la fecha puede editarla'; END IF;
 END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.set_item_archived(p_type text, p_id uuid, p_archived boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' THEN
  UPDATE public.memories SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSIF p_type = 'journal' THEN
  UPDATE public.journal_entries SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSIF p_type = 'date' THEN
  UPDATE public.special_dates SET archived_at = CASE WHEN p_archived THEN now() END WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND (p_archived AND archived_at IS NULL OR NOT p_archived AND archived_at > now() - interval '30 days');
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'No puedes cambiar este elemento o ya pasó el plazo de 30 días'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.delete_item_forever(p_type text, p_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); path text; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' THEN
  DELETE FROM public.memories WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL RETURNING photo_path INTO path;
 ELSIF p_type = 'journal' THEN
  DELETE FROM public.journal_entries WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL;
 ELSIF p_type = 'date' THEN
  DELETE FROM public.special_dates WHERE id=p_id AND space_id=s AND author_id=auth.uid() AND archived_at IS NOT NULL;
 ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes eliminar definitivamente tus elementos archivados'; END IF;
 RETURN path; END $$;

CREATE OR REPLACE FUNCTION public.add_item_comment(p_type text, p_id uuid, p_content text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); r uuid; BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' AND EXISTS (SELECT 1 FROM public.memories WHERE id=p_id AND space_id=s AND archived_at IS NULL) THEN
  INSERT INTO public.item_comments(space_id,author_id,memory_id,content) VALUES(s,auth.uid(),p_id,btrim(p_content)) RETURNING id INTO r;
 ELSIF p_type = 'journal' AND EXISTS (SELECT 1 FROM public.journal_entries WHERE id=p_id AND space_id=s AND kind='shared' AND archived_at IS NULL) THEN
  INSERT INTO public.item_comments(space_id,author_id,journal_id,content) VALUES(s,auth.uid(),p_id,btrim(p_content)) RETURNING id INTO r;
 ELSE RAISE EXCEPTION 'No se puede comentar aquí'; END IF; RETURN r; END $$;

CREATE OR REPLACE FUNCTION public.delete_item_comment(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
 DELETE FROM public.item_comments WHERE id=p_id AND space_id=public.my_space() AND author_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Solo puedes borrar tus comentarios'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.toggle_item_reaction(p_type text, p_id uuid, p_emoji text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid := public.my_space(); BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_type = 'memory' AND EXISTS (SELECT 1 FROM public.memories WHERE id=p_id AND space_id=s AND archived_at IS NULL) THEN
  DELETE FROM public.item_reactions WHERE memory_id=p_id AND user_id=auth.uid() AND emoji=p_emoji; IF FOUND THEN RETURN false; END IF;
  INSERT INTO public.item_reactions(space_id,user_id,memory_id,emoji) VALUES(s,auth.uid(),p_id,p_emoji);
 ELSIF p_type = 'journal' AND EXISTS (SELECT 1 FROM public.journal_entries WHERE id=p_id AND space_id=s AND kind='shared' AND archived_at IS NULL) THEN
  DELETE FROM public.item_reactions WHERE journal_id=p_id AND user_id=auth.uid() AND emoji=p_emoji; IF FOUND THEN RETURN false; END IF;
  INSERT INTO public.item_reactions(space_id,user_id,journal_id,emoji) VALUES(s,auth.uid(),p_id,p_emoji);
 ELSE RAISE EXCEPTION 'No se puede reaccionar aquí'; END IF; RETURN true; END $$;

CREATE OR REPLACE FUNCTION public.purge_expired_archive()
RETURNS SETOF text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ BEGIN
 DELETE FROM public.journal_entries WHERE archived_at <= now() - interval '30 days';
 DELETE FROM public.special_dates WHERE archived_at <= now() - interval '30 days';
 RETURN QUERY DELETE FROM public.memories WHERE archived_at <= now() - interval '30 days' RETURNING photo_path; END $$;
REVOKE EXECUTE ON FUNCTION public.purge_expired_archive() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_archive() TO service_role;

CREATE POLICY memories_photos_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text);
CREATE POLICY memories_photos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text);
CREATE POLICY memories_photos_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'memories' AND (storage.foldername(name))[1] = public.my_space()::text AND owner_id = auth.uid()::text AND NOT EXISTS (SELECT 1 FROM public.memories m WHERE m.photo_path = storage.objects.name));

ALTER PUBLICATION supabase_realtime ADD TABLE public.memories, public.journal_entries, public.special_dates, public.item_comments, public.item_reactions;
CREATE TABLE public.daily_emotions (
 space_id uuid NOT NULL REFERENCES public.private_spaces(id),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Santo_Domingo')::date),
 emotion text NOT NULL CHECK (emotion IN ('feliz','en_paz','triste','cansada','enamorada','agradecida','enojada','discusion','no_escuchada')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(space_id,user_id,day)
);
GRANT SELECT ON public.daily_emotions TO authenticated;
GRANT ALL ON public.daily_emotions TO service_role;
ALTER TABLE public.daily_emotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY emotions_space_read ON public.daily_emotions FOR SELECT TO authenticated USING (space_id=public.my_space());
CREATE FUNCTION public.save_daily_emotion(p_emotion text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
 IF auth.uid() IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_emotion IS NULL OR p_emotion NOT IN ('feliz','en_paz','triste','cansada','enamorada','agradecida','enojada','discusion','no_escuchada') THEN RAISE EXCEPTION 'Emoción no válida'; END IF;
 INSERT INTO public.daily_emotions(space_id,user_id,day,emotion) VALUES(s,auth.uid(),(now() AT TIME ZONE 'America/Santo_Domingo')::date,p_emotion)
 ON CONFLICT(space_id,user_id,day) DO UPDATE SET emotion=excluded.emotion,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.save_daily_emotion(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_daily_emotion(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_emotions;
ALTER TABLE public.correspondence DROP CONSTRAINT correspondence_check;
ALTER TABLE public.correspondence ADD CONSTRAINT correspondence_folder_check CHECK ((kind='library' AND folder IN ('Amor','Cuando estés feliz','Cuando estés triste','Cuando estés enojada','Después de una discusión','Cuando sientas que no te escucho','Cuando tengas miedo','Cuando me extrañes','Cuando necesites tranquilidad','Cuando necesites esperanza','Tu tiempo con Dios') AND folder IS NOT NULL) OR (kind<>'library' AND folder IS NULL));
REVOKE ALL ON public.daily_emotions FROM anon,authenticated;
GRANT SELECT ON public.daily_emotions TO authenticated;
GRANT ALL ON public.daily_emotions TO service_role;
CREATE TABLE public.spiritual_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('prayer','petition','reading')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 10000),
  reference text NOT NULL DEFAULT '' CHECK (char_length(reference) <= 120),
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.spiritual_checkins (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Santo_Domingo'))::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id, day)
);
GRANT SELECT ON public.spiritual_items, public.spiritual_checkins TO authenticated;
GRANT ALL ON public.spiritual_items, public.spiritual_checkins TO service_role;
ALTER TABLE public.spiritual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY spiritual_items_read ON public.spiritual_items FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE POLICY spiritual_checkins_read ON public.spiritual_checkins FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.save_spiritual_item(p_kind text, p_title text, p_content text, p_reference text, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); r uuid;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden escribir aquí.'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO spiritual_items(space_id, author_id, kind, title, content, reference)
    VALUES (s, auth.uid(), p_kind, trim(p_title), coalesce(p_content,''), coalesce(trim(p_reference),'')) RETURNING id INTO r;
  ELSE
    UPDATE spiritual_items SET title = trim(p_title), content = coalesce(p_content,''), reference = coalesce(trim(p_reference),''), updated_at = now()
    WHERE id = p_id AND space_id = s AND author_id = auth.uid() RETURNING id INTO r;
    IF r IS NULL THEN RAISE EXCEPTION 'Solo quien lo escribió puede editarlo.'; END IF;
  END IF;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.delete_spiritual_item(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM spiritual_items WHERE id = p_id AND space_id = public.my_space() AND author_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Solo quien lo escribió puede eliminarlo.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_petition_answered(p_id uuid, p_answered boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE spiritual_items SET answered_at = CASE WHEN p_answered THEN now() ELSE NULL END, updated_at = now()
  WHERE id = p_id AND space_id = public.my_space() AND kind = 'petition';
  IF NOT FOUND THEN RAISE EXCEPTION 'No encontramos esa petición.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.spiritual_checkin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden marcar su momento con Dios.'; END IF;
  INSERT INTO spiritual_checkins(space_id, user_id, day) VALUES (s, auth.uid(), ((now() AT TIME ZONE 'America/Santo_Domingo'))::date) ON CONFLICT DO NOTHING;
END $$;

REVOKE ALL ON FUNCTION public.save_spiritual_item(text,text,text,text,uuid), public.delete_spiritual_item(uuid), public.set_petition_answered(uuid,boolean), public.spiritual_checkin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_spiritual_item(text,text,text,text,uuid), public.delete_spiritual_item(uuid), public.set_petition_answered(uuid,boolean), public.spiritual_checkin() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spiritual_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spiritual_checkins;
CREATE TABLE public.appa_interactions (
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  action text NOT NULL CHECK (action IN ('pet','feed','play','hug')),
  coins integer NOT NULL CHECK (coins BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id, day, action)
);
GRANT SELECT ON public.appa_interactions TO authenticated;
GRANT ALL ON public.appa_interactions TO service_role;
ALTER TABLE public.appa_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY appa_read ON public.appa_interactions FOR SELECT TO authenticated USING (space_id = public.my_space());

CREATE OR REPLACE FUNCTION public.appa_interact(p_action text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s uuid := public.my_space(); c integer; d date := ((now() AT TIME ZONE 'America/Santo_Domingo'))::date;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden cuidar a Appa.'; END IF;
  c := CASE p_action WHEN 'pet' THEN 1 WHEN 'feed' THEN 2 WHEN 'play' THEN 3 WHEN 'hug' THEN 2 ELSE NULL END;
  IF c IS NULL THEN RAISE EXCEPTION 'Acción no válida.'; END IF;
  INSERT INTO appa_interactions(space_id, user_id, day, action, coins) VALUES (s, auth.uid(), d, p_action, c) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.appa_interact(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_interact(text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_interactions;
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
ALTER TABLE public.appa_state ADD COLUMN hygiene numeric NOT NULL DEFAULT 70 CHECK (hygiene BETWEEN 10 AND 100), ADD COLUMN hygiene_updated_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN bath_stage text NOT NULL DEFAULT 'dirty' CHECK (bath_stage IN ('dirty','soapy','rinsed','clean'));
CREATE TABLE public.appa_bath_rewards (space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(id), day date NOT NULL, coins integer NOT NULL DEFAULT 2 CHECK (coins = 2), exp integer NOT NULL DEFAULT 20 CHECK (exp = 20), PRIMARY KEY(space_id,user_id,day));
GRANT SELECT ON public.appa_bath_rewards TO authenticated; GRANT ALL ON public.appa_bath_rewards TO service_role;
ALTER TABLE public.appa_bath_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY bath_read ON public.appa_bath_rewards FOR SELECT TO authenticated USING (space_id = public.my_space());
CREATE TABLE public.appa_furniture (space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE, item text NOT NULL, category text NOT NULL CHECK(category IN ('rug','plant','sofa','picture','lamp')), cost integer NOT NULL CHECK(cost > 0), room text CHECK(room IN ('bano','cocina','dormitorio','sala')), purchased_by uuid NOT NULL REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(space_id,item));
CREATE UNIQUE INDEX furniture_slot ON public.appa_furniture(space_id,room,category) WHERE room IS NOT NULL;
GRANT SELECT ON public.appa_furniture TO authenticated; GRANT ALL ON public.appa_furniture TO service_role;
ALTER TABLE public.appa_furniture ENABLE ROW LEVEL SECURITY;
CREATE POLICY furniture_read ON public.appa_furniture FOR SELECT TO authenticated USING(space_id = public.my_space());
CREATE FUNCTION public.appa_balance(p_space uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT (coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id=p_space),0) + coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id=p_space),0) + coalesce((SELECT sum(coins) FROM appa_bath_rewards WHERE space_id=p_space),0) - coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id=p_space),0) - coalesce((SELECT sum(cost) FROM appa_furniture WHERE space_id=p_space),0))::integer $$;
REVOKE ALL ON FUNCTION public.appa_balance(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.appa_buy_food(p_food text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); c integer; x integer; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden comprar.'; END IF; SELECT v.c,v.x INTO c,x FROM (VALUES ('manzana',3,15),('zanahoria',5,30),('pastel_nubes',10,70),('banquete',20,160)) v(f,c,x) WHERE v.f=p_food; IF c IS NULL THEN RAISE EXCEPTION 'Comida no válida.'; END IF; PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text)); IF public.appa_balance(s)<c THEN RAISE EXCEPTION 'No hay suficientes monedas.'; END IF; INSERT INTO appa_purchases(space_id,user_id,food,cost,exp) VALUES(s,auth.uid(),p_food,c,x); RETURN x; END $$;
CREATE FUNCTION public.appa_bathe(p_step text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); st appa_state; rewarded boolean:=false; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden bañar a Appa.'; END IF; INSERT INTO appa_state(space_id) VALUES(s) ON CONFLICT DO NOTHING; SELECT * INTO st FROM appa_state WHERE space_id=s FOR UPDATE; IF st.sleeping_since IS NOT NULL THEN RAISE EXCEPTION 'Despierta a Appa primero.'; END IF; IF p_step='soap' THEN st.bath_stage:='soapy'; ELSIF p_step='rinse' AND st.bath_stage='soapy' THEN st.bath_stage:='rinsed'; ELSIF p_step='dry' AND st.bath_stage='rinsed' THEN st.bath_stage:='clean'; st.hygiene:=100; INSERT INTO appa_bath_rewards(space_id,user_id,day) VALUES(s,auth.uid(),(now() AT TIME ZONE 'America/Santo_Domingo')::date) ON CONFLICT DO NOTHING; rewarded:=FOUND; ELSE RAISE EXCEPTION 'Primero jabón, después agua y al final la toalla.'; END IF; UPDATE appa_state SET bath_stage=st.bath_stage,hygiene=CASE WHEN p_step='dry' THEN 100 ELSE greatest(10,hygiene-2*extract(epoch FROM now()-hygiene_updated_at)/3600) END,hygiene_updated_at=now() WHERE space_id=s; RETURN jsonb_build_object('rewarded',rewarded,'coins',CASE WHEN rewarded THEN 2 ELSE 0 END,'exp',CASE WHEN rewarded THEN 20 ELSE 0 END); END $$;
CREATE FUNCTION public.appa_buy_furniture(p_item text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); c integer; cat text; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden decorar.'; END IF; SELECT v.c,v.cat INTO c,cat FROM (VALUES ('rug_rose',8,'rug'),('rug_sky',10,'rug'),('plant_lily',6,'plant'),('plant_fern',8,'plant'),('sofa_rose',20,'sofa'),('sofa_sky',24,'sofa'),('picture_heart',7,'picture'),('picture_moon',9,'picture'),('lamp_star',12,'lamp'),('lamp_flower',14,'lamp')) v(i,c,cat) WHERE v.i=p_item; IF c IS NULL THEN RAISE EXCEPTION 'Mueble no válido.'; END IF; PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text)); IF EXISTS(SELECT 1 FROM appa_furniture WHERE space_id=s AND item=p_item) THEN RAISE EXCEPTION 'Ya tienen este mueble.'; END IF; IF public.appa_balance(s)<c THEN RAISE EXCEPTION 'No hay suficientes monedas.'; END IF; INSERT INTO appa_furniture(space_id,item,category,cost,purchased_by) VALUES(s,p_item,cat,c,auth.uid()); END $$;
CREATE FUNCTION public.appa_place_furniture(p_item text,p_room text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); cat text; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden decorar.'; END IF; IF p_room IS NOT NULL AND p_room NOT IN ('bano','cocina','dormitorio','sala') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF; PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text)); SELECT category INTO cat FROM appa_furniture WHERE space_id=s AND item=p_item; IF cat IS NULL THEN RAISE EXCEPTION 'Compren este mueble primero.'; END IF; UPDATE appa_furniture SET room=NULL WHERE space_id=s AND room=p_room AND category=cat; UPDATE appa_furniture SET room=p_room WHERE space_id=s AND item=p_item; END $$;
REVOKE ALL ON FUNCTION public.appa_bathe(text),public.appa_buy_furniture(text),public.appa_place_furniture(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.appa_bathe(text),public.appa_buy_furniture(text),public.appa_place_furniture(text,text) TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_bath_rewards,public.appa_furniture;
ALTER TABLE public.private_spaces ADD COLUMN archived_at timestamptz;
CREATE TABLE public.space_departures (space_id uuid NOT NULL REFERENCES public.private_spaces(id), user_id uuid NOT NULL REFERENCES public.profiles(id), departed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(space_id,user_id));
GRANT SELECT ON public.space_departures TO authenticated; GRANT ALL ON public.space_departures TO service_role;
ALTER TABLE public.space_departures ENABLE ROW LEVEL SECURITY;
CREATE POLICY departure_own ON public.space_departures FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.space_confirmations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, space_id uuid NOT NULL, action text NOT NULL CHECK(action IN ('unlink','archive','restore')), expires_at timestamptz NOT NULL DEFAULT now()+interval '5 minutes');
GRANT ALL ON public.space_confirmations TO service_role;
ALTER TABLE public.space_confirmations ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.readable_space() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT space_id FROM public.user_roles WHERE user_id=auth.uid() $$;
REVOKE ALL ON FUNCTION public.readable_space() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.readable_space() TO authenticated;
CREATE OR REPLACE FUNCTION public.my_space() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT r.space_id FROM public.user_roles r JOIN public.private_spaces s ON s.id=r.space_id WHERE r.user_id=auth.uid() AND s.archived_at IS NULL $$;
CREATE OR REPLACE FUNCTION public.is_space_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.private_spaces s ON s.id=r.space_id WHERE r.user_id=auth.uid() AND r.role='admin' AND s.archived_at IS NULL) $$;
CREATE FUNCTION public.space_settings_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.readable_space(); BEGIN IF s IS NULL THEN RETURN NULL; END IF; RETURN (SELECT jsonb_build_object('archived_at',archived_at,'role',(SELECT role FROM public.user_roles WHERE user_id=auth.uid())) FROM public.private_spaces WHERE id=s); END $$;
CREATE FUNCTION public.begin_space_change(p_action text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.readable_space(); r text; token uuid; BEGIN SELECT role::text INTO r FROM public.user_roles WHERE user_id=auth.uid(); IF s IS NULL OR p_action NOT IN ('unlink','archive','restore') OR (p_action IN ('archive','restore') AND r<>'admin') THEN RAISE EXCEPTION 'No tienes permiso para este cambio'; END IF; IF p_action='unlink' AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=s AND role='member') THEN RAISE EXCEPTION 'No hay una segunda cuenta vinculada'; END IF; INSERT INTO public.space_confirmations(user_id,space_id,action) VALUES(auth.uid(),s,p_action) RETURNING id INTO token; RETURN token; END $$;
CREATE FUNCTION public.confirm_space_change(p_token uuid,p_phrase text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.space_confirmations; BEGIN SELECT * INTO c FROM public.space_confirmations WHERE id=p_token AND user_id=auth.uid() AND expires_at>now() FOR UPDATE; IF c.id IS NULL OR c.space_id IS DISTINCT FROM public.readable_space() OR p_phrase IS DISTINCT FROM 'CONFIRMAR' THEN RAISE EXCEPTION 'Confirmación no válida o vencida'; END IF; PERFORM pg_advisory_xact_lock(781235); IF c.action='unlink' THEN INSERT INTO public.space_departures(space_id,user_id) SELECT space_id,user_id FROM public.user_roles WHERE space_id=c.space_id AND role='member' ON CONFLICT DO NOTHING; DELETE FROM public.user_roles WHERE space_id=c.space_id AND role='member'; ELSIF c.action='archive' THEN IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Solo el administrador'; END IF; UPDATE public.private_spaces SET archived_at=now() WHERE id=c.space_id; ELSIF c.action='restore' THEN IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Solo el administrador'; END IF; UPDATE public.private_spaces SET archived_at=NULL WHERE id=c.space_id; END IF; UPDATE public.space_invites SET revoked_at=now() WHERE space_id=c.space_id AND used_at IS NULL AND revoked_at IS NULL; DELETE FROM public.space_confirmations WHERE id=c.id; END $$;
CREATE FUNCTION public.guard_closed_space() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF EXISTS(SELECT 1 FROM public.private_spaces WHERE id=NEW.space_id AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'El espacio está archivado'; END IF; IF TG_TABLE_NAME='user_roles' AND EXISTS(SELECT 1 FROM public.space_departures WHERE space_id=NEW.space_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Esta cuenta fue desvinculada; sus datos siguen conservados'; END IF; RETURN NEW; END $$;
CREATE TRIGGER roles_closed BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.guard_closed_space();
CREATE TRIGGER invites_closed BEFORE INSERT ON public.space_invites FOR EACH ROW EXECUTE FUNCTION public.guard_closed_space();
CREATE OR REPLACE FUNCTION public.purge_expired_archive() RETURNS SETOF text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN DELETE FROM public.journal_entries j WHERE archived_at<=now()-interval '30 days' AND EXISTS(SELECT 1 FROM public.private_spaces s WHERE s.id=j.space_id AND s.archived_at IS NULL) AND NOT EXISTS(SELECT 1 FROM public.space_departures d WHERE d.space_id=j.space_id); DELETE FROM public.special_dates j WHERE archived_at<=now()-interval '30 days' AND EXISTS(SELECT 1 FROM public.private_spaces s WHERE s.id=j.space_id AND s.archived_at IS NULL) AND NOT EXISTS(SELECT 1 FROM public.space_departures d WHERE d.space_id=j.space_id); RETURN QUERY DELETE FROM public.memories j WHERE archived_at<=now()-interval '30 days' AND EXISTS(SELECT 1 FROM public.private_spaces s WHERE s.id=j.space_id AND s.archived_at IS NULL) AND NOT EXISTS(SELECT 1 FROM public.space_departures d WHERE d.space_id=j.space_id) RETURNING photo_path; END $$;
CREATE TABLE public.time_capsules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), space_id uuid NOT NULL REFERENCES public.private_spaces(id), author_id uuid NOT NULL REFERENCES public.profiles(id), title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160), kind text NOT NULL CHECK(kind IN ('message','letter','photo')), opens_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.time_capsules TO authenticated; GRANT ALL ON public.time_capsules TO service_role;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
CREATE POLICY capsule_metadata_read ON public.time_capsules FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE TABLE public.capsule_contents (capsule_id uuid PRIMARY KEY REFERENCES public.time_capsules(id), content text NOT NULL DEFAULT '' CHECK(length(content)<=10000), photo_data text CHECK(length(photo_data)<=3000000));
GRANT SELECT ON public.capsule_contents TO authenticated; GRANT ALL ON public.capsule_contents TO service_role;
ALTER TABLE public.capsule_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY capsule_open_read ON public.capsule_contents FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.time_capsules c WHERE c.id=capsule_id AND c.space_id=public.my_space() AND c.opens_at<=now()));
CREATE FUNCTION public.seal_capsule(p_title text,p_kind text,p_opens_at timestamptz,p_content text,p_photo text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); id uuid; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'El espacio no está activo'; END IF; IF p_opens_at IS NULL OR p_opens_at<=now() THEN RAISE EXCEPTION 'Elige una fecha y hora futuras de Santo Domingo'; END IF; IF p_kind='photo' THEN IF p_photo IS NULL OR length(p_photo)>3000000 OR p_photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$' THEN RAISE EXCEPTION 'Foto no válida'; END IF; ELSE IF length(trim(coalesce(p_content,'')))=0 OR p_photo IS NOT NULL THEN RAISE EXCEPTION 'Escribe el mensaje o carta'; END IF; END IF; INSERT INTO public.time_capsules(space_id,author_id,title,kind,opens_at) VALUES(s,auth.uid(),trim(p_title),p_kind,p_opens_at) RETURNING time_capsules.id INTO id; INSERT INTO public.capsule_contents(capsule_id,content,photo_data) VALUES(id,coalesce(p_content,''),p_photo); RETURN id; END $$;
CREATE FUNCTION public.open_capsule(p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.time_capsules WHERE id=p_id AND space_id=public.my_space() AND opens_at<=now()) THEN RAISE EXCEPTION 'Esta cápsula sigue sellada o no pertenece a tu espacio'; END IF; RETURN (SELECT to_jsonb(c) FROM public.capsule_contents c WHERE capsule_id=p_id); END $$;
CREATE TABLE public.word_boards (space_id uuid NOT NULL REFERENCES public.private_spaces(id), day date NOT NULL, grid jsonb NOT NULL, words text[] NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(space_id,day));
GRANT SELECT ON public.word_boards TO authenticated; GRANT ALL ON public.word_boards TO service_role;
ALTER TABLE public.word_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_board_read ON public.word_boards FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE TABLE public.word_finds (space_id uuid NOT NULL, day date NOT NULL, word text NOT NULL, user_id uuid NOT NULL REFERENCES public.profiles(id), coins integer NOT NULL DEFAULT 1 CHECK(coins=1), exp integer NOT NULL DEFAULT 10 CHECK(exp=10), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(space_id,day,word), FOREIGN KEY(space_id,day) REFERENCES public.word_boards(space_id,day));
GRANT SELECT ON public.word_finds TO authenticated; GRANT ALL ON public.word_finds TO service_role;
ALTER TABLE public.word_finds ENABLE ROW LEVEL SECURITY;
CREATE POLICY word_finds_read ON public.word_finds FOR SELECT TO authenticated USING(space_id=public.my_space());
CREATE FUNCTION public.get_word_board() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); d date:=(now() AT TIME ZONE 'America/Santo_Domingo')::date; words text[]:=ARRAY['AMOR','JUNTOS','ABRAZO','CARINO','HOGAR','FE']; g jsonb:='[]'; row jsonb; w text; i int; j int; BEGIN IF s IS NULL THEN RAISE EXCEPTION 'El espacio no está activo'; END IF; PERFORM pg_advisory_xact_lock(hashtext('words:'||s::text)); IF NOT EXISTS(SELECT 1 FROM public.word_boards WHERE space_id=s AND day=d) THEN FOR i IN 1..8 LOOP row:='[]'; w:=coalesce(words[i],''); IF (extract(day FROM d)::int+i)%2=0 THEN w:=reverse(w); END IF; FOR j IN 1..8 LOOP row:=row||jsonb_build_array(CASE WHEN j<=length(w) THEN substr(w,j,1) ELSE substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ',1+floor(random()*26)::int,1) END); END LOOP; g:=g||jsonb_build_array(row); END LOOP; INSERT INTO public.word_boards(space_id,day,grid,words) VALUES(s,d,g,words); END IF; RETURN (SELECT to_jsonb(b) FROM public.word_boards b WHERE space_id=s AND day=d); END $$;
CREATE FUNCTION public.find_board_word(p_day date,p_start integer,p_end integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.my_space(); b public.word_boards; x int; y int; dx int; dy int; n int; i int; word text:=''; awarded boolean; BEGIN IF s IS NULL OR p_day IS DISTINCT FROM (now() AT TIME ZONE 'America/Santo_Domingo')::date THEN RAISE EXCEPTION 'Tablero no válido'; END IF; IF p_start IS NULL OR p_end IS NULL OR p_start NOT BETWEEN 0 AND 63 OR p_end NOT BETWEEN 0 AND 63 THEN RAISE EXCEPTION 'Selección no válida'; END IF; SELECT * INTO b FROM public.word_boards WHERE space_id=s AND day=p_day; IF b.space_id IS NULL THEN RAISE EXCEPTION 'Tablero no encontrado'; END IF; x:=p_start%8; y:=p_start/8; dx:=p_end%8-x; dy:=p_end/8-y; IF dx<>0 AND dy<>0 AND abs(dx)<>abs(dy) THEN RAISE EXCEPTION 'Selecciona una línea recta'; END IF; n:=greatest(abs(dx),abs(dy)); dx:=sign(dx); dy:=sign(dy); FOR i IN 0..n LOOP word:=word||(b.grid->(y+i*dy)->>(x+i*dx)); END LOOP; IF NOT (word=ANY(b.words)) THEN word:=reverse(word); END IF; IF NOT (word=ANY(b.words)) THEN RAISE EXCEPTION 'Esa palabra no está en el tablero'; END IF; PERFORM pg_advisory_xact_lock(hashtext('appa:'||s::text)); INSERT INTO public.word_finds(space_id,day,word,user_id) VALUES(s,p_day,word,auth.uid()) ON CONFLICT DO NOTHING; awarded:=FOUND; RETURN jsonb_build_object('word',word,'coins',CASE WHEN awarded THEN 1 ELSE 0 END,'exp',CASE WHEN awarded THEN 10 ELSE 0 END,'repeat',NOT awarded); END $$;
CREATE OR REPLACE FUNCTION public.appa_balance(p_space uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT (coalesce((SELECT sum(coins) FROM appa_interactions WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_game_results WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM appa_bath_rewards WHERE space_id=p_space),0)+coalesce((SELECT sum(coins) FROM word_finds WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_purchases WHERE space_id=p_space),0)-coalesce((SELECT sum(cost) FROM appa_furniture WHERE space_id=p_space),0))::integer $$;
CREATE FUNCTION public.export_space_copy() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.readable_space(); uid uuid:=auth.uid(); BEGIN IF s IS NULL THEN RETURN jsonb_build_object('exported_at',now(),'time_zone','America/Santo_Domingo','journals',coalesce((SELECT jsonb_agg(to_jsonb(j)) FROM public.journal_entries j WHERE j.author_id=uid AND j.kind='private'),'[]'::jsonb),'correspondence',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM public.correspondence c WHERE c.author_id=uid),'[]'::jsonb),'memories',coalesce((SELECT jsonb_agg(to_jsonb(m)-'photo_path') FROM public.memories m WHERE m.author_id=uid),'[]'::jsonb)); END IF; RETURN jsonb_build_object('exported_at',now(),'time_zone','America/Santo_Domingo','memories',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.memories m WHERE m.space_id=s),'[]'::jsonb),'correspondence',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM public.correspondence c WHERE c.space_id=s),'[]'::jsonb),'journals',coalesce((SELECT jsonb_agg(to_jsonb(j)) FROM public.journal_entries j WHERE j.space_id=s AND (j.kind='shared' OR j.author_id=uid)),'[]'::jsonb),'dates',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.special_dates d WHERE d.space_id=s),'[]'::jsonb),'capsules',coalesce((SELECT jsonb_agg(to_jsonb(c)||CASE WHEN c.opens_at<=now() THEN coalesce((SELECT to_jsonb(cc) FROM public.capsule_contents cc WHERE cc.capsule_id=c.id),'{}'::jsonb) ELSE '{}'::jsonb END) FROM public.time_capsules c WHERE c.space_id=s),'[]'::jsonb)); END $$;
CREATE POLICY memories_archived_export ON storage.objects FOR SELECT TO authenticated USING(bucket_id='memories' AND (storage.foldername(name))[1]=public.readable_space()::text);
REVOKE ALL ON FUNCTION public.space_settings_status(),public.begin_space_change(text),public.confirm_space_change(uuid,text),public.guard_closed_space(),public.seal_capsule(text,text,timestamptz,text,text),public.open_capsule(uuid),public.get_word_board(),public.find_board_word(date,integer,integer),public.export_space_copy() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.guard_closed_space() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.space_settings_status(),public.begin_space_change(text),public.confirm_space_change(uuid,text),public.seal_capsule(text,text,timestamptz,text,text),public.open_capsule(uuid),public.get_word_board(),public.find_board_word(date,integer,integer),public.export_space_copy() TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_capsules,public.word_finds,public.private_spaces,public.user_roles;
CREATE OR REPLACE FUNCTION public.begin_space_change(p_action text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.readable_space(); r text; token uuid; BEGIN SELECT role::text INTO r FROM public.user_roles WHERE user_id=auth.uid(); IF s IS NULL OR p_action IS NULL OR p_action NOT IN ('unlink','archive','restore') OR (p_action IN ('archive','restore') AND r<>'admin') THEN RAISE EXCEPTION 'No tienes permiso para este cambio'; END IF; IF p_action='unlink' AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE space_id=s AND role='member') THEN RAISE EXCEPTION 'No hay una segunda cuenta vinculada'; END IF; DELETE FROM public.space_confirmations WHERE user_id=auth.uid(); INSERT INTO public.space_confirmations(user_id,space_id,action) VALUES(auth.uid(),s,p_action) RETURNING id INTO token; RETURN token; END $$;
CREATE OR REPLACE FUNCTION public.publish_daily_messages() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s record; BEGIN FOR s IN SELECT id FROM public.private_spaces WHERE archived_at IS NULL LOOP PERFORM public.select_daily_for_space(s.id); END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.export_space_copy() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE s uuid:=public.readable_space(); uid uuid:=auth.uid(); BEGIN IF uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF; IF s IS NULL THEN RETURN jsonb_build_object('exported_at',now(),'time_zone','America/Santo_Domingo','journals',coalesce((SELECT jsonb_agg(to_jsonb(j)) FROM public.journal_entries j WHERE j.author_id=uid),'[]'::jsonb),'correspondence',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM public.correspondence c WHERE c.author_id=uid),'[]'::jsonb),'memories',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.memories m WHERE m.author_id=uid),'[]'::jsonb),'dates',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.special_dates d WHERE d.author_id=uid),'[]'::jsonb),'capsules',coalesce((SELECT jsonb_agg(to_jsonb(c)||CASE WHEN c.opens_at<=now() THEN coalesce((SELECT to_jsonb(cc) FROM public.capsule_contents cc WHERE cc.capsule_id=c.id),'{}'::jsonb) ELSE '{}'::jsonb END) FROM public.time_capsules c WHERE c.author_id=uid),'[]'::jsonb)); END IF; RETURN jsonb_build_object('exported_at',now(),'time_zone','America/Santo_Domingo','memories',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.memories m WHERE m.space_id=s),'[]'::jsonb),'correspondence',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM public.correspondence c WHERE c.space_id=s),'[]'::jsonb),'journals',coalesce((SELECT jsonb_agg(to_jsonb(j)) FROM public.journal_entries j WHERE j.space_id=s AND (j.kind='shared' OR j.author_id=uid)),'[]'::jsonb),'dates',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.special_dates d WHERE d.space_id=s),'[]'::jsonb),'capsules',coalesce((SELECT jsonb_agg(to_jsonb(c)||CASE WHEN c.opens_at<=now() THEN coalesce((SELECT to_jsonb(cc) FROM public.capsule_contents cc WHERE cc.capsule_id=c.id),'{}'::jsonb) ELSE '{}'::jsonb END) FROM public.time_capsules c WHERE c.space_id=s),'[]'::jsonb)); END $$;
CREATE POLICY memory_own_departure_export ON storage.objects FOR SELECT TO authenticated USING(bucket_id='memories' AND EXISTS(SELECT 1 FROM public.memories m WHERE m.photo_path=name AND m.author_id=auth.uid()));
CREATE POLICY memory_own_export_read ON public.memories FOR SELECT TO authenticated USING(author_id=auth.uid() AND EXISTS(SELECT 1 FROM public.space_departures d WHERE d.user_id=auth.uid() AND d.space_id=memories.space_id));
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
-- Migración 0022: Appa Mascota Viva (2D/2.5D), Posicionamiento, Personalización de Casa y Notas Sorpresa

-- 1. Coordenadas y postura para Appa como mascota viva
ALTER TABLE public.appa_state 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 10 AND 90),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 60 CHECK (pos_y BETWEEN 30 AND 85),
ADD COLUMN IF NOT EXISTS facing text NOT NULL DEFAULT 'right' CHECK (facing IN ('left', 'right')),
ADD COLUMN IF NOT EXISTS current_room text NOT NULL DEFAULT 'sala' CHECK (current_room IN ('sala', 'cocina', 'dormitorio', 'bano'));

-- 2. Coordenadas, rotación y variantes para muebles
ALTER TABLE public.appa_furniture 
ADD COLUMN IF NOT EXISTS pos_x numeric NOT NULL DEFAULT 50 CHECK (pos_x BETWEEN 5 AND 95),
ADD COLUMN IF NOT EXISTS pos_y numeric NOT NULL DEFAULT 60 CHECK (pos_y BETWEEN 20 AND 85),
ADD COLUMN IF NOT EXISTS flipped boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS variant text NOT NULL DEFAULT 'default';

-- 3. Notas adhesivas / Post-its románticos en las habitaciones
CREATE TABLE IF NOT EXISTS public.appa_house_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  room text NOT NULL CHECK (room IN ('sala', 'cocina', 'dormitorio', 'bano')),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz DEFAULT NULL
);

GRANT SELECT ON public.appa_house_notes TO authenticated;
GRANT ALL ON public.appa_house_notes TO service_role;
ALTER TABLE public.appa_house_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY house_notes_read ON public.appa_house_notes FOR SELECT TO authenticated
USING (space_id = public.my_space());

CREATE INDEX IF NOT EXISTS house_notes_space ON public.appa_house_notes(space_id, room, created_at DESC);

-- Función para actualizar posición y orientación de Appa en tiempo real
CREATE OR REPLACE FUNCTION public.appa_move(
  p_room text,
  p_pos_x numeric,
  p_pos_y numeric,
  p_facing text DEFAULT 'right'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  IF p_facing NOT IN ('left', 'right') THEN p_facing := 'right'; END IF;
  
  UPDATE public.appa_state 
  SET current_room = p_room,
      pos_x = greatest(10, least(90, p_pos_x)),
      pos_y = greatest(30, least(85, p_pos_y)),
      facing = p_facing,
      updated_at = now()
  WHERE space_id = s;
END $$;

REVOKE ALL ON FUNCTION public.appa_move(text, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_move(text, numeric, numeric, text) TO authenticated;

-- Función para guardar la distribución y posición de un mueble
CREATE OR REPLACE FUNCTION public.appa_save_furniture_layout(
  p_item text,
  p_room text,
  p_pos_x numeric,
  p_pos_y numeric,
  p_flipped boolean DEFAULT false,
  p_variant text DEFAULT 'default'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space();
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room IS NOT NULL AND p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  
  PERFORM pg_advisory_xact_lock(hashtext('appa:' || s::text));
  
  UPDATE public.appa_furniture
  SET room = p_room,
      pos_x = greatest(5, least(95, p_pos_x)),
      pos_y = greatest(20, least(85, p_pos_y)),
      flipped = coalesce(p_flipped, false),
      variant = coalesce(p_variant, 'default')
  WHERE space_id = s AND item = p_item;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Mueble no encontrado.'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_save_furniture_layout(text, text, numeric, numeric, boolean, text) TO authenticated;

-- Función para dejar una nota sorpresa en una habitación
CREATE OR REPLACE FUNCTION public.appa_leave_note(
  p_room text,
  p_content text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s uuid := public.my_space(); result_id uuid;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio.'; END IF;
  IF p_room NOT IN ('sala', 'cocina', 'dormitorio', 'bano') THEN RAISE EXCEPTION 'Habitación no válida.'; END IF;
  IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'La nota debe tener entre 1 y 500 caracteres.';
  END IF;
  
  INSERT INTO public.appa_house_notes(space_id, author_id, room, content)
  VALUES (s, auth.uid(), p_room, btrim(p_content))
  RETURNING id INTO result_id;
  
  RETURN result_id;
END $$;

REVOKE ALL ON FUNCTION public.appa_leave_note(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_leave_note(text, text) TO authenticated;

-- Función para marcar una nota sorpresa como leída
CREATE OR REPLACE FUNCTION public.appa_read_note(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acceso no autorizado.'; END IF;
  UPDATE public.appa_house_notes SET read_at = now() WHERE id = p_id AND space_id = public.my_space() AND read_at IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.appa_read_note(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.appa_read_note(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.appa_house_notes;
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
-- 0024: ¿Cuánto nos conocemos? (Couple Quiz with Secret Answers & Mutual Reveal)

CREATE TABLE IF NOT EXISTS public.couple_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  category text NOT NULL DEFAULT 'complicidad',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.couple_quiz_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.private_spaces(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.couple_quiz_questions(id) ON DELETE CASCADE,
  day date NOT NULL,
  revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couple_quiz_rounds_space_question_day_unique UNIQUE (space_id, question_id, day)
);

CREATE TABLE IF NOT EXISTS public.couple_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.couple_quiz_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  my_answer text NOT NULL,
  guess_partner_answer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couple_quiz_answers_round_user_unique UNIQUE (round_id, user_id)
);

GRANT SELECT ON public.couple_quiz_questions TO authenticated;
GRANT ALL ON public.couple_quiz_questions TO service_role;

GRANT SELECT ON public.couple_quiz_rounds TO authenticated;
GRANT ALL ON public.couple_quiz_rounds TO service_role;

GRANT SELECT ON public.couple_quiz_answers TO authenticated;
GRANT ALL ON public.couple_quiz_answers TO service_role;

ALTER TABLE public.couple_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_quiz_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_questions_read ON public.couple_quiz_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY quiz_rounds_read ON public.couple_quiz_rounds
  FOR SELECT TO authenticated USING (space_id = public.my_space());

-- Regla de oro de confidencialidad (secreto hasta revelación simultánea):
-- Cada usuario solo puede ver su propia respuesta hasta que la ronda esté revelada.
CREATE POLICY quiz_answers_read ON public.couple_quiz_answers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.couple_quiz_rounds r
      WHERE r.id = couple_quiz_answers.round_id
        AND r.space_id = public.my_space()
        AND r.revealed_at IS NOT NULL
    )
  );

-- Función segura para enviar respuesta y revelar mutuamente
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_question_id uuid,
  p_my_answer text,
  p_guess text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s uuid := public.my_space();
  today_date date := ((now() AT TIME ZONE 'America/Santo_Domingo'))::date;
  r_id uuid;
  ans_count integer;
  is_revealed boolean := false;
BEGIN
  IF s IS NULL THEN RAISE EXCEPTION 'Solo las cuentas del espacio pueden participar en el juego.'; END IF;
  IF trim(coalesce(p_my_answer, '')) = '' THEN RAISE EXCEPTION 'La respuesta no puede estar vacía.'; END IF;

  -- Obtener o crear la ronda de hoy para esta pregunta
  INSERT INTO public.couple_quiz_rounds (space_id, question_id, day)
  VALUES (s, p_question_id, today_date)
  ON CONFLICT (space_id, question_id, day) DO UPDATE SET space_id = excluded.space_id
  RETURNING id INTO r_id;

  -- Guardar o actualizar la respuesta secreta del usuario
  INSERT INTO public.couple_quiz_answers (round_id, user_id, my_answer, guess_partner_answer)
  VALUES (r_id, auth.uid(), trim(p_my_answer), trim(coalesce(p_guess, '')))
  ON CONFLICT (round_id, user_id) DO UPDATE SET
    my_answer = excluded.my_answer,
    guess_partner_answer = excluded.guess_partner_answer,
    created_at = now();

  -- Contar respuestas en esta ronda
  SELECT count(*) INTO ans_count FROM public.couple_quiz_answers WHERE round_id = r_id;

  -- Si ambos respondieron (o mínimo 2 respuestas en el espacio), revelar
  IF ans_count >= 2 THEN
    UPDATE public.couple_quiz_rounds
    SET revealed_at = now()
    WHERE id = r_id AND revealed_at IS NULL;
    is_revealed := true;

    -- Bonificación de 3 monedas y 25 EXP en la economía unificada
    PERFORM public.appa_care('play', NULL);
  END IF;

  RETURN jsonb_build_object(
    'round_id', r_id,
    'revealed', is_revealed,
    'answers_count', ans_count
  );
END $$;

REVOKE ALL ON FUNCTION public.submit_quiz_answer(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, text, text) TO authenticated;

-- Publicación Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_quiz_answers;

-- Banco inicial de 40 preguntas para Carlos & Mimie
INSERT INTO public.couple_quiz_questions (question, category, order_index) VALUES
('¿Cuál fue el momento exacto en el que te diste cuenta de que estabas completamente enamorado/a de mí?', 'recuerdos', 1),
('¿Qué pequeña manía o costumbre mía te parece tierna en secreto?', 'detalles', 2),
('Si tuviéramos un día libre entero para nosotros dos sin teléfonos, ¿cuál sería nuestro plan soñado?', 'futuro', 3),
('¿Cuál es mi mayor sueño que aún no he cumplido y que sueñas con ver hecho realidad?', 'profundo', 4),
('¿Qué comida te preparo o compramos cuando queremos alegrarnos el día por completo?', 'detalles', 5),
('¿Qué es lo que más te tranquiliza de mí cuando estás teniendo un día agotador?', 'profundo', 6),
('¿Qué viaje o escapada juntos recordarás por el resto de tu vida?', 'recuerdos', 7),
('¿Cuál consideras que es nuestra mayor fortaleza como pareja cuando las cosas se ponen difíciles?', 'complicidad', 8),
('¿Qué canción nos describe a la perfección cuando estamos solos?', 'detalles', 9),
('¿Cuál es tu recuerdo más gracioso o divertido que hemos vivido juntos?', 'recuerdos', 10),
('Si pudieras congelar un solo instante de nuestra historia para revivirlo mil veces, ¿cuál elegirías?', 'recuerdos', 11),
('¿En qué cosas crees que somos completamente opuestos, pero que encajamos como piezas exactas?', 'complicidad', 12),
('¿Qué es lo primero que pensaste sobre mí la primera vez que hablamos?', 'recuerdos', 13),
('¿Cuál es el abrazo o beso mío que más te recarga el alma?', 'detalles', 14),
('Si tuviéramos que adoptar otra mascota además de Appa en el mundo real, ¿cuál sería?', 'futuro', 15),
('¿Qué detalle simple que hago por ti te recuerda cuánto te amo sin necesidad de palabras?', 'detalles', 16),
('¿Cuál es nuestro rincón o espacio favorito en todo el mundo?', 'complicidad', 17),
('¿Qué virtud mía admiras profundamente en silencio?', 'profundo', 18),
('¿Qué palabra o apodo nuestro te hace sonreír cada vez que lo escuchas?', 'detalles', 19),
('¿Cómo imaginas nuestro hogar dentro de diez años?', 'futuro', 20),
('¿Qué es algo que aprendiste o empezaste a disfrutar gracias a mí?', 'complicidad', 21),
('¿Cuál ha sido la sorpresa que te he dado que más te ha tocado el corazón?', 'recuerdos', 22),
('¿Qué es lo que más te gusta de nuestras conversaciones a altas horas de la noche?', 'profundo', 23),
('Si me vieras triste, ¿cuál es tu fórmula infalible para sacarme una sonrisa?', 'detalles', 24),
('¿Qué película o serie juntos nos hizo reír o llorar más de la cuenta?', 'detalles', 25),
('¿Cuál es un secreto o pensamiento lindo sobre mí que nunca me habías confesado?', 'profundo', 26),
('¿Qué olor o fragancia te hace pensar inmediatamente en mí?', 'detalles', 27),
('¿Cuál es la promesa más bonita que nos hemos hecho mutuamente?', 'profundo', 28),
('¿Qué juego o reto tonto entre nosotros dos siempre te hace reír?', 'complicidad', 29),
('¿Qué foto nuestra de todas las que tenemos en el álbum es tu favorita absoluta y por qué?', 'recuerdos', 30),
('Si solo pudiéramos cenar una sola cosa juntos por el resto de nuestras vidas, ¿qué elegirías?', 'detalles', 31),
('¿Qué es lo que más agradeces a Dios cada noche sobre nuestra relación?', 'profundo', 32),
('¿Cómo describirías mi risa en una sola palabra poética?', 'detalles', 33),
('¿Qué aventura atrevida o divertida te gustaría que hagamos por primera vez este año?', 'futuro', 34),
('¿Cuál es el mejor consejo o frase de apoyo que te he dado en un momento decisivo?', 'recuerdos', 35),
('¿Qué pequeño ritual nuestro de todos los días extrañarías más si estuviéramos lejos?', 'complicidad', 36),
('¿Cuál es el regalo más significativo que te he dado?', 'recuerdos', 37),
('¿Qué es lo que más te enamora de mirarme a los ojos en silencio?', 'profundo', 38),
('Si nuestra historia de amor fuera un libro o una película, ¿cuál sería el título?', 'complicidad', 39),
('¿Por qué sabes que tú y yo fuimos hechos exactamente el uno para el otro?', 'profundo', 40);

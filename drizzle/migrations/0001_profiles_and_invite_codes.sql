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
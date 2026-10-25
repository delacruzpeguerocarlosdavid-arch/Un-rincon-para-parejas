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
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
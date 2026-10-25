REVOKE ALL ON public.daily_emotions FROM anon,authenticated;
GRANT SELECT ON public.daily_emotions TO authenticated;
GRANT ALL ON public.daily_emotions TO service_role;
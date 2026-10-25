REVOKE ALL ON public.correspondence, public.correspondence_reads, public.word_favorites FROM anon, authenticated;
GRANT SELECT ON public.correspondence, public.correspondence_reads, public.word_favorites TO authenticated;
GRANT ALL ON public.correspondence, public.correspondence_reads, public.word_favorites TO service_role;
DO $$ BEGIN
 PERFORM cron.schedule('shared-daily-message-santo-domingo', '0 4 * * *', 'SELECT public.publish_daily_messages()');
END $$;
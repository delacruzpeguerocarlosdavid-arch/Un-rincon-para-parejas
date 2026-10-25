import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
export const Route = createFileRoute('/api/public/jobs/daily-message')({ server: { handlers: {
  POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request);
    if (failure) return failure;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.rpc('publish_daily_messages');
    if (error) return Response.json({ error: 'No se pudo publicar el mensaje diario' }, { status: 500 });
    return Response.json({ ok: true });
  },
} } });
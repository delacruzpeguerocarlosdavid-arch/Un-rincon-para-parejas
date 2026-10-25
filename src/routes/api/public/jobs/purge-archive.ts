import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

export const Route = createFileRoute('/api/public/jobs/purge-archive')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin.rpc('purge_expired_archive');
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const paths = (data ?? []) as string[];
        if (paths.length) {
          const removed = await supabaseAdmin.storage.from('memories').remove(paths);
          if (removed.error) return Response.json({ error: removed.error.message }, { status: 500 });
        }
        return Response.json({ success: true, photos: paths.length });
      },
    },
  },
});

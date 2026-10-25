import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { DailyMessage } from '@/components/DailyMessage';
import { PageHeader } from '@/components/AppShell';

export const Route = createFileRoute('/mensaje-diario')({
  head: () => ({ meta: [
    { title: 'Mensaje Diario · Un lugar para nosotros dos' },
    { name: 'description', content: 'El mensaje de hoy, elegido para nuestro espacio compartido.' },
    { property: 'og:title', content: 'Mensaje Diario · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Nuestras palabras para acompañar este día.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: DailyPage,
});
function DailyPage() {
  return <><PageHeader title="Mensaje Diario" /><ClientOnly fallback={<p>Un momento…</p>}><DailyMessage /></ClientOnly></>;
}
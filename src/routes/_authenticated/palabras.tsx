import { createFileRoute } from '@tanstack/react-router';
import { Correspondence } from '@/components/Correspondence';
import { folders } from '@/lib/correspondence';
export const Route = createFileRoute('/_authenticated/palabras')({
  validateSearch: (search: Record<string, unknown>): { folder?: string; partner?: boolean } => ({ folder: typeof search['folder'] === 'string' && folders.some(f => f === search['folder']) ? search['folder'] : '', partner: search['partner'] === true || search['partner'] === 'true' }),
  head: () => ({ meta: [
    { title: 'Mis palabras para ti · Un lugar para nosotros dos' },
    { name: 'description', content: 'Palabras personales para cada emoción, guardadas en nuestro espacio privado.' },
    { property: 'og:title', content: 'Mis palabras para ti · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Nuestra biblioteca de palabras, favoritos y lecturas recientes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Library,
});
function Library() { const { folder, partner } = Route.useSearch(); return <Correspondence key={`${folder}-${partner}`} library initialFolder={folder ?? ''} partnerOnly={partner ?? false} />; }
import { createFileRoute } from '@tanstack/react-router';
import { Correspondence } from '@/components/Correspondence';
export const Route = createFileRoute('/_authenticated/conversacion')({
  head: () => ({ meta: [
    { title: 'Entre nosotros · Un lugar para nosotros dos' },
    { name: 'description', content: 'Nuestra conversación privada, cartas y pequeñas notas.' },
    { property: 'og:title', content: 'Entre nosotros · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Un espacio privado para nuestras cartas y conversaciones.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Conversation,
});
function Conversation() { return <Correspondence />; }
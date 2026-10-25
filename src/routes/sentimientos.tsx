import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Emotions } from '@/components/Emotions';

export const Route = createFileRoute("/sentimientos")({
  head: () => ({
    meta: [
      { title: "Cómo te sientes · Un lugar para nosotros dos" },
      { name: "description", content: "Cuéntame cómo te sientes hoy." },
      { property: "og:title", content: "Cómo te sientes" },
      { property: "og:description", content: "Cuéntame cómo te sientes hoy." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Sentimientos,
});

function Sentimientos() {
  return (
    <div>
      <PageHeader title="Cómo te sientes" subtitle="No hay respuestas incorrectas, solo tú." />
      <ClientOnly fallback={<p>Un momento…</p>}><Emotions /></ClientOnly>
    </div>
  );
}

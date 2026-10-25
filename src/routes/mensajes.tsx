import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBadge, PageHeader } from "@/components/AppShell";
import { Button } from '@/components/ui/button';
import { BookHeart, MessageCircle, Mail, Gift } from 'lucide-react';

export const Route = createFileRoute("/mensajes")({
  head: () => ({
    meta: [
      { title: "Nuestros mensajes · Un lugar para nosotros dos" },
      { name: "description", content: "Palabras que nos escribimos." },
      { property: "og:title", content: "Nuestros mensajes" },
      { property: "og:description", content: "Palabras que nos escribimos." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Mensajes,
});

const demo = [
  { de: "Él", texto: "Gracias por hacer mis días más suaves.", fecha: "Ejemplo · hoy" },
  { de: "Ella", texto: "Te guardé un abrazo para esta noche.", fecha: "Ejemplo · ayer" },
  { de: "Él", texto: "Contigo todo tiene sentido.", fecha: "Ejemplo · lunes" },
];

function Mensajes() {
  return (
    <div>
      <PageHeader title="Nuestros mensajes" subtitle="Palabras para guardar en el corazón." />
      <div className="mb-6 space-y-2">
        <Button asChild className="w-full justify-start"><Link to="/conversacion"><MessageCircle />Chat, cartas y notas</Link></Button>
        <Button asChild variant="outline" className="w-full justify-start"><Link to="/regalos"><Gift />Regalos de honor (Estilo Levi)</Link></Button>
        <Button asChild variant="outline" className="w-full justify-start"><Link to="/palabras"><BookHeart />Mis palabras para ti</Link></Button>
        <Button asChild variant="ghost" className="w-full justify-start"><Link to="/banco"><Mail />Banco del mensaje del día</Link></Button>
      </div>
      <div className="mb-4"><DemoBadge /></div>
      <ul className="space-y-3">
        {demo.map((m, i) => (
          <li key={i} className={i % 2 ? "card-blush p-4" : "card-soft p-4"}>
            <p className="font-serif text-lg leading-snug">{m.texto}</p>
            <p className="mt-2 text-xs text-muted-foreground">{m.de} · {m.fecha}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted-foreground">Por ahora los mensajes son de ejemplo y no se guardan.</p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarHeart, Images } from "lucide-react";
import { DemoBadge, PageHeader } from "@/components/AppShell";
import lirios from "@/assets/lirios.png";

export const Route = createFileRoute("/recuerdos")({
  head: () => ({
    meta: [
      { title: "Nuestros recuerdos · Un lugar para nosotros dos" },
      { name: "description", content: "Momentos que vivimos juntos." },
      { property: "og:title", content: "Nuestros recuerdos" },
      { property: "og:description", content: "Momentos que vivimos juntos." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Recuerdos,
});

const demo = [
  { t: "Nuestra primera cita", f: "Fecha de ejemplo" },
  { t: "Paseo al atardecer", f: "Fecha de ejemplo" },
  { t: "Domingo en la iglesia", f: "Fecha de ejemplo" },
  { t: "Cena de aniversario", f: "Fecha de ejemplo" },
];

function Recuerdos() {
  return (
    <div>
      <PageHeader title="Nuestros recuerdos" subtitle="Pequeños tesoros de nuestra historia." />
      <div className="mb-6 space-y-2">
        <Button asChild className="w-full justify-start"><Link to="/album"><Images />Nuestro álbum privado</Link></Button>
        <Button asChild variant="outline" className="w-full justify-start"><Link to="/diario"><BookOpen />Diarios</Link></Button>
        <Button asChild variant="ghost" className="w-full justify-start"><Link to="/fechas"><CalendarHeart />Fechas especiales</Link></Button>
      </div>
      <div className="mb-4"><DemoBadge /></div>
      <div className="grid grid-cols-2 gap-3">
        {demo.map((r) => (
          <figure key={r.t} className="card-blush overflow-hidden p-3">
            <img src={lirios} alt="" loading="lazy" width={1024} height={768} className="aspect-square w-full rounded-xl bg-card object-cover" />
            <figcaption className="mt-2">
              <span className="block font-serif text-base font-semibold leading-tight">{r.t}</span>
              <span className="text-[11px] text-muted-foreground">{r.f}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

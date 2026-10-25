import { Link } from '@tanstack/react-router';
import { Heart, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCouple } from '@/lib/couple-context';

export function WelcomeMessage() {
  const { couple, daysTogether } = useCouple();

  return (
    <section aria-label="Bienvenida de amor" className="border-y border-border/60 py-5 my-2">
      <div className="mb-2 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />
        <h2 className="font-serif text-2xl font-semibold tracking-wide text-foreground">
          Nuestro Santuario
        </h2>
      </div>
      <p className="whitespace-pre-wrap break-words font-serif text-lg leading-relaxed text-foreground/90 italic">
        “Cada día a tu lado es una bendición que atesoro en el alma. Gracias por construir este rincón de paz, ternura y amor conmigo.”
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground font-serif">
        <span>Para {couple.partner2} · De {couple.partner1}</span>
        <span className="font-sans text-[11px] font-medium text-primary">
          {daysTogether} días juntos ✨
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button asChild variant="link" className="px-0 text-xs font-serif text-primary hover:underline">
          <Link to="/sentimientos">
            <Heart className="w-3.5 h-3.5 mr-1 text-rose-500" />
            Compartir cómo me siento hoy
          </Link>
        </Button>
        <Button asChild variant="link" className="px-0 text-xs font-serif text-primary hover:underline">
          <Link to="/mensajes">
            <Mail className="w-3.5 h-3.5 mr-1 text-primary" />
            Escribir carta de amor
          </Link>
        </Button>
      </div>
    </section>
  );
}

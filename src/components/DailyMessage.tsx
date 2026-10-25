import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, Sparkles, LogIn } from 'lucide-react';
import { dailyOptions, membershipOptions } from '@/lib/message-bank';
import { Button } from '@/components/ui/button';
import { ScratchDailyCard } from '@/components/ScratchDailyCard';

export function DailyMessage() {
  const member = useQuery(membershipOptions);
  const daily = useQuery({ ...dailyOptions, enabled: Boolean(member.data) });

  if (member.isPending || (member.data && daily.isPending)) {
    return (
      <div className="rounded-3xl border border-white/60 bg-card/60 p-6 backdrop-blur-md text-center">
        <Sparkles className="w-5 h-5 text-primary mx-auto animate-spin" />
        <p className="mt-3 font-serif text-sm text-muted-foreground">Preparando nuestro momento...</p>
      </div>
    );
  }

  // Si no ha iniciado sesión, mostrar invitación cálida en vez de error
  if (!member.data) {
    return (
      <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-card/90 via-card/80 to-accent/20 p-6 shadow-lg backdrop-blur-md text-center">
        <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500 mb-3 shadow-inner">
          <Heart className="h-6 w-6 fill-rose-400" />
        </span>
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Un mensaje solo para nosotros dos
        </h2>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          Inicia sesión para descubrir las palabras de amor preparadas para el día de hoy.
        </p>
        <Button asChild className="mt-4 rounded-full px-6 shadow-md" size="sm">
          <Link to="/auth">
            <LogIn className="w-3.5 h-3.5 mr-1.5" /> Entrar a nuestro espacio
          </Link>
        </Button>
      </article>
    );
  }

  if (daily.data) {
    return (
      <ScratchDailyCard
        content={daily.data.content}
        category={daily.data.category}
        day={daily.data.day}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-white/60 bg-card/70 p-6 backdrop-blur-md text-center">
      <Heart className="mx-auto mb-3 h-7 w-7 text-primary animate-pulse" strokeWidth={1} />
      <p className="font-serif text-2xl leading-snug">Estamos preparando algo especial para ti</p>
      <p className="mt-2 text-xs text-muted-foreground">Cada día una nueva sorpresa de amor</p>
    </div>
  );
}

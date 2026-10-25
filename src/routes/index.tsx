import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { Mail, Heart, Images, ChevronRight, HelpCircle, Gift, Sparkles, BookOpen } from "lucide-react";
import { DemoBadge } from "@/components/AppShell";
import { DailyMessage } from '@/components/DailyMessage';
import { Emotions } from '@/components/Emotions';
import { WelcomeMessage } from '@/components/WelcomeMessage';
import { DailyRitual } from '@/components/DailyRitual';
import { dailyVerse } from '@/lib/bible-verses';
import { dominicanToday } from '@/lib/stage3';
import { LiveHeartbeat } from '@/components/LiveHeartbeat';
import { PolaroidHero } from '@/components/PolaroidHero';
import { LoveCounterWidget } from '@/components/LoveCounterWidget';
import { useAtmosphereGreeting } from '@/components/DynamicAtmosphere';
import { DailyCoupleQuiz } from '@/components/DailyCoupleQuiz';
import { RomanticBookExporter } from '@/components/RomanticBookExporter';
import { useCouple } from '@/lib/couple-context';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Un lugar para nosotros dos" },
      { name: "description", content: "Nuestro rincón mágico: mensajes, recuerdos y un momento con Dios." },
      { property: "og:title", content: "Un lugar para nosotros dos" },
      { property: "og:description", content: "Nuestro rincón: mensajes, recuerdos y un momento con Dios." },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

export function Index() {
  const today = dominicanToday();
  const verse = dailyVerse(today);
  const { greeting } = useAtmosphereGreeting();
  const { couple, daysTogether } = useCouple();

  return (
    <div className="space-y-6 pb-6">
      {/* Cabecera poética y saludo en tiempo real */}
      <section className="relative text-center pt-2">
        <p className="font-serif text-sm italic tracking-widest text-primary/90 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {greeting}
        </p>
        <h1 className="mt-1 font-serif text-4xl sm:text-5xl font-semibold leading-tight text-foreground tracking-tight">
          Un Rincón Para Parejas
        </h1>
        <p className="mt-1.5 font-sans text-xs text-muted-foreground tracking-wide">
          El santuario privado para {couple.partner1} & {couple.partner2} · {daysTogether} días de amor.
        </p>
      </section>

      {/* Botón de latido interactivo en tiempo real */}
      <ClientOnly>
        <LiveHeartbeat />
      </ClientOnly>

      {/* Foto estilo Polaroid analógica con cinta washi tape */}
      <PolaroidHero
        caption={`${couple.partner1} & ${couple.partner2}`}
        date="Nuestro amor bendecido"
      />

      {/* Contador de amor en vivo (días, horas, minutos, segundos) */}
      <ClientOnly>
        <LoveCounterWidget />
      </ClientOnly>

      {/* Bienvenida y Mensaje diario con tarjeta para rascar (Scratch card) */}
      <ClientOnly>
        <WelcomeMessage />
      </ClientOnly>

      <ClientOnly fallback={<div className="p-6 rounded-3xl bg-card/60 backdrop-blur-md text-center"><p className="font-serif text-sm">Cargando nuestro mensaje...</p></div>}>
        <DailyMessage />
      </ClientOnly>

      <ClientOnly>
        <DailyRitual />
      </ClientOnly>

      {/* Cómo te sientes */}
      <ClientOnly>
        <Emotions compact />
      </ClientOnly>

      {/* Pregunta del Día - Conexión de Pareja con Sello de Cera (Gottman Blind Reveal) */}
      <ClientOnly>
        <DailyCoupleQuiz />
      </ClientOnly>

      {/* Un momento con Dios (NTV) estilizado como manuscrito sagrado */}
      <article className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-card/90 via-card/80 to-amber-100/20 dark:to-amber-950/20 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-amber-200/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <BookOpen className="h-4 w-4" />
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-foreground">
              Un momento con Dios
            </h2>
          </div>
          <span className="rounded-full bg-amber-200/30 px-3 py-0.5 font-serif text-[11px] font-medium text-amber-800 dark:text-amber-200">
            {verse.category}
          </span>
        </div>

        <p className="mt-4 font-serif text-xl italic leading-relaxed text-foreground/90 selection:bg-amber-100">
          “{verse.text}”
        </p>
        <p className="mt-2 text-xs font-sans text-muted-foreground flex items-center gap-1.5">
          <span className="font-semibold text-foreground/80">{verse.reference}</span> · Nueva Traducción Viviente (NTV)
        </p>

        <p className="mt-4 text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3">
          Señor, cuida de nosotros hoy, bendice nuestro amor y guía nuestros pasos juntos.
        </p>

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <DemoBadge />
          <Link to="/espiritual" className="text-xs font-serif text-primary hover:underline flex items-center gap-1">
            <span>Nuestro rincón de oración</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </article>

      {/* Portales a las experiencias especiales (Quiz, Levi, Appa, Lirio, Mensajes) */}
      <section className="space-y-3 pt-2">
        <h3 className="font-serif text-lg font-medium text-muted-foreground px-1">
          Nuestros rincones especiales
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Santuario de Mascota */}
          <Link
            to="/appa"
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-card/90 to-amber-100/30 dark:to-amber-950/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-serif text-lg font-semibold text-foreground truncate">
                  Nuestra Mascota
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  12 adorables mascotas para criar juntos
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Cuestionario de pareja */}
          <Link
            to="/quiz"
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-card/90 to-rose-100/30 dark:to-rose-950/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-serif text-lg font-semibold text-foreground truncate">
                  Juegos & Ruleta de Citas
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  Momentos para reír y conectar juntos
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Salón de detalles románticos */}
          <Link
            to="/mensajes"
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-card/90 to-emerald-100/30 dark:to-emerald-950/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Gift className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-serif text-lg font-semibold text-foreground truncate">
                  Buzón de Cartas
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  Cartas selladas con cera para los dos
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Cultivo del Lirio y El Valle del Río */}
          <Link
            to="/lirio"
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-card/90 via-pink-100/30 to-cyan-100/30 dark:to-cyan-950/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-serif text-lg font-semibold text-foreground truncate">
                  Valle del Río & Flores
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  Margaritas, lirios, barquitos y susurros
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Banco de mensajes y cartas confidenciales */}
          <Link
            to="/mensajes"
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-card/90 to-amber-100/30 dark:to-amber-950/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-serif text-lg font-semibold text-foreground truncate">
                  Cartas y mensajes
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  Cartas con sello de cera de L y notas
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Álbum de recuerdos y Libro de Colección */}
      <section className="pt-1 space-y-3">
        <Link
          to="/recuerdos"
          className="group flex items-center justify-between rounded-2xl border border-white/50 bg-card/60 p-4 shadow-sm backdrop-blur-md hover:bg-card/90 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500 group-hover:scale-110 transition-transform">
              <Images className="h-5 w-5" />
            </span>
            <div>
              <span className="font-serif text-base font-semibold text-foreground block">
                Nuestros recuerdos
              </span>
              <span className="text-xs text-muted-foreground block">
                Fotos, anécdotas y momentos inolvidables
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Generador y Exportador de Fotolibro en PDF */}
        <ClientOnly>
          <RomanticBookExporter />
        </ClientOnly>
      </section>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Home, Mail, Heart, Dices, Flower2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { soundFx } from "@/lib/sound-atmosphere";
import { SoundAtmospherePlayer } from "@/components/SoundAtmospherePlayer";
import { ThinkingOfYouModal } from "@/components/ThinkingOfYouModal";
import { PremiumPassModal } from "@/components/PremiumPassModal";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/appa", label: "Mascota", icon: Sparkles },
  { to: "/quiz", label: "Juegos", icon: Dices },
  { to: "/lirio", label: "Valle", icon: Flower2 },
  { to: "/mensajes", label: "Cartas", icon: Mail },
  { to: "/espacio", label: "Nosotros", icon: Heart },
] as const;

export function DemoBadge() {
  return (
    <span className="inline-block rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground font-sans">
      Contenido protegido
    </span>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5 pt-1 text-center sm:text-left">
      <h1 className="text-3xl sm:text-4xl font-serif font-medium text-foreground tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground font-sans">{subtitle}</p>}
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md pb-28 relative z-10 selection:bg-rose-200">
      {/* Barra superior de micro-servicios de amor: VIP Pass, Pensando en ti y Música Lo-Fi */}
      <header className="sticky top-0 z-40 mx-auto max-w-md px-3 pt-2.5 pb-2 flex items-center justify-between pointer-events-none backdrop-blur-md bg-background/70 border-b border-border/30">
        <div className="pointer-events-auto flex items-center gap-1.5">
          <PremiumPassModal />
          <ThinkingOfYouModal />
        </div>
        <div className="pointer-events-auto">
          <SoundAtmospherePlayer />
        </div>
      </header>

      <main className="px-4 sm:px-5 pt-2">{children}</main>

      {/* Barra de navegación inferior flotante tipo iOS Glass Dock */}
      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-4 pointer-events-none">
        <ul className="pointer-events-auto rounded-full border border-white/60 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 p-1.5 shadow-2xl backdrop-blur-xl flex justify-around items-center">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === '/' }}
                onClick={() => soundFx.playChime(1.1)}
                className="flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 px-2 text-center text-[10px] font-serif leading-tight text-muted-foreground transition-all duration-300 hover:text-foreground data-[status=active]:bg-primary/20 data-[status=active]:text-primary data-[status=active]:font-semibold data-[status=active]:scale-105 active:scale-95"
              >
                <Icon className="h-5 w-5 transition-transform duration-300" strokeWidth={1.75} />
                <span className="tracking-wide">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

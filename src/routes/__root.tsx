import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "../components/AppShell";
import { supabase } from '@/integrations/supabase/client';
import { AccountLink } from '@/components/AccountLink';
import { LocalReminders } from '@/components/LocalReminders';
import { DynamicAtmosphere } from '@/components/DynamicAtmosphere';
import { SoundToggle } from '@/components/SoundToggle';
import { CoupleProvider } from '@/lib/couple-context';
import { CoupleOnboardingModal } from '@/components/CoupleOnboardingModal';

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl mb-3">🕊️</span>
      <h1 className="font-serif text-3xl font-semibold text-foreground">Rincón no encontrado</h1>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs">
        Este rincón no existe o se ha movido. Regresa a nuestro santuario de amor.
      </p>
      <div className="mt-5">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-serif font-medium text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error('[App Error]', error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Un Rincón Para Parejas · El santuario privado para dos" },
      { name: "description", content: "El santuario privado para parejas: cuiden a su mascota virtual, respondan la pregunta del día y guarden sus memorias para siempre." },
      { property: "og:title", content: "Un Rincón Para Parejas" },
      { property: "og:description", content: "El santuario privado para parejas: mascota virtual, cartas en el río y conexión diaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F7F0E6" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Un Rincón" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Karla:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY'].includes(event)) return;
      if (event === 'SIGNED_OUT') { queryClient.clear(); void router.navigate({ to: '/auth', replace: true }); }
      else { void queryClient.invalidateQueries(); }
      void router.invalidate();
    });
    const channel = supabase.channel(`bank-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_capsules' }, () => { void queryClient.invalidateQueries({ queryKey: ['capsules'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lily_plant' }, () => { void queryClient.invalidateQueries({ queryKey: ['lily'] }); void queryClient.invalidateQueries({ queryKey: ['ritual'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_rituals' }, () => { void queryClient.invalidateQueries({ queryKey: ['ritual'] }); void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_outfits' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_finds' }, () => { void queryClient.invalidateQueries({ queryKey: ['word-board'] }); void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_level_finds' }, () => { void queryClient.invalidateQueries({ queryKey: ['word-board'] }); void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_level_completions' }, () => { void queryClient.invalidateQueries({ queryKey: ['word-board'] }); void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_spaces' }, () => { void queryClient.cancelQueries().then(() => { queryClient.clear(); void router.invalidate(); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => { void queryClient.cancelQueries().then(() => { queryClient.clear(); void router.invalidate(); }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_messages' }, () => { void queryClient.invalidateQueries({ queryKey: ['bank'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_history' }, () => { void queryClient.invalidateQueries({ queryKey: ['daily'] }); void queryClient.invalidateQueries({ queryKey: ['bank'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correspondence' }, () => { void queryClient.invalidateQueries({ queryKey: ['correspondence'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'correspondence_reads' }, () => { void queryClient.invalidateQueries({ queryKey: ['correspondence'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_favorites' }, () => { void queryClient.invalidateQueries({ queryKey: ['correspondence'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories' }, () => { void queryClient.invalidateQueries({ queryKey: ['stage3'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => { void queryClient.invalidateQueries({ queryKey: ['stage3'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'special_dates' }, () => { void queryClient.invalidateQueries({ queryKey: ['stage3'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_comments' }, () => { void queryClient.invalidateQueries({ queryKey: ['stage3'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_reactions' }, () => { void queryClient.invalidateQueries({ queryKey: ['stage3'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spiritual_items' }, () => { void queryClient.invalidateQueries({ queryKey: ['spiritual'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spiritual_checkins' }, () => { void queryClient.invalidateQueries({ queryKey: ['spiritual'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_state' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_bath_rewards' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_furniture' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_purchases' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_game_results' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_interactions' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appa_house_notes' }, () => { void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_emotions' }, () => { void queryClient.invalidateQueries({ queryKey: ['emotions'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_gifts' }, () => { void queryClient.invalidateQueries({ queryKey: ['gifts'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_quiz_rounds' }, () => { void queryClient.invalidateQueries({ queryKey: ['couple_quiz'] }); void queryClient.invalidateQueries({ queryKey: ['appa'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_quiz_answers' }, () => { void queryClient.invalidateQueries({ queryKey: ['couple_quiz'] }); })
      .subscribe();
    return () => { data.subscription.unsubscribe(); void supabase.removeChannel(channel); };
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <CoupleProvider>
        <DynamicAtmosphere />
        <SoundToggle />
        <CoupleOnboardingModal />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <AppShell>
          <AccountLink />
          <LocalReminders />
          <Outlet />
        </AppShell>
      </CoupleProvider>
    </QueryClientProvider>
  );
}

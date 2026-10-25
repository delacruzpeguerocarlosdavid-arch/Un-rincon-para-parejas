import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Gate, Notice } from '@/components/Stage3Parts';
import { LilyScene, lilyStage, stageNames } from '@/components/LilyScene';
import { RiverMeadowScene } from '@/components/RiverMeadowScene';
import { membershipOptions } from '@/lib/message-bank';
import { appaOptions } from '@/lib/appa';
import { soundFx } from '@/lib/sound-atmosphere';
import { Flower2, Waves, ChevronLeft } from 'lucide-react';
import {
  analyzeLilyStress,
  calculateDrainage,
  calculateSoilMoisture,
  lilyMood,
  lilyOptions,
  needLevel,
  type LilyAction,
  type LilyNeed,
} from '@/lib/lily';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/lirio')({
  head: () => ({
    meta: [
      { title: 'Santuario Botánico · Un lugar para nosotros dos' },
      { name: 'description', content: 'Cultivo de lirios, campo de margaritas, río con barquitos de papel y caracola de susurros.' },
      { property: 'og:title', content: 'Santuario Botánico · Flores y Río' },
      { property: 'og:description', content: 'Margaritas, lirios, agua viva y cartas en el río para Carlos y Mimie.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Lily,
});

const bars = [
  { key: 'sun' as LilyNeed, field: 'sun_at' as const, bar: '☀️ Sol y luz' },
  { key: 'water' as LilyNeed, field: 'water_at' as const, bar: '💧 Agua' },
  { key: 'drain' as LilyNeed, field: 'drain_at' as const, bar: '🪴 Drenaje del sustrato' },
  { key: 'prune' as LilyNeed, field: 'prune_at' as const, bar: '🍃 Ramas sanas' },
  { key: 'feed' as LilyNeed, field: 'feed_at' as const, bar: '🌱 Abono y nutrientes' },
  { key: 'pests' as LilyNeed, field: 'pests_at' as const, bar: '🐞 Sin bichitos' },
] as const;

const done: Record<LilyAction, string> = {
  sun: 'Nuestro lirio está tomando sol ☀️',
  water: 'Agua fresca para el lirio 💧',
  prune: 'Ramas malas cortadas con cuidado ✂️',
  feed: 'Abono fresco: el lirio está más fuerte 🌱',
  pests: '¡Adiós bichitos! 🐞',
  song: 'El lirio y Appa bailaron con tu canción 🎶',
  drain: 'Sustrato aireado con amor y drenaje óptimo 🪴',
};

const next = [3, 8, 15, 30];

function Lily() {
  const member = useQuery(membershipOptions);
  const q = useQuery({ ...lilyOptions, enabled: Boolean(member.data) });
  const appaQuery = useQuery({ ...appaOptions, enabled: Boolean(member.data) });
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'valle' | 'lirio'>('valle');
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const equippedAccessory = appaQuery.data?.outfits?.find(x => x.equipped)?.item;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const levelsMap: Record<LilyNeed, number> = {
    sun: needLevel(q.data?.sun_at, 'sun', now),
    water: needLevel(q.data?.water_at, 'water', now),
    drain: needLevel(q.data?.drain_at ?? q.data?.prune_at, 'drain', now),
    prune: needLevel(q.data?.prune_at, 'prune', now),
    feed: needLevel(q.data?.feed_at, 'feed', now),
    pests: needLevel(q.data?.pests_at, 'pests', now),
  };

  const moisture = calculateSoilMoisture(q.data, now);
  const drainage = calculateDrainage(q.data, now);
  const stress = analyzeLilyStress(q.data, now);
  const health = Math.min(...Object.values(levelsMap));

  const count = q.data?.care_count ?? 0;
  const stage = lilyStage(count);
  const goal = next[stage];

  const care = async (a: LilyAction) => {
    setBusy(true);
    setNotice('');
    const before = stage;
    const r = await supabase.rpc('lily_care', { p_action: a });
    if (r.error) {
      setNotice('No pudimos cuidar el lirio ahora. Inténtalo de nuevo.');
    } else {
      await qc.invalidateQueries({ queryKey: ['lily'] });
      setNotice(
        lilyStage(count + 1) > before
          ? `¡Nuestro lirio creció! Ahora es: ${stageNames[lilyStage(count + 1)]} 🌸`
          : done[a],
      );
    }
    setBusy(false);
    return !r.error;
  };

  return (
    <div className="space-y-4 pb-6">
      <Button asChild variant="ghost" size="sm" className="mb-0">
        <Link to="/espacio">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Nuestro espacio
        </Link>
      </Button>

      <PageHeader
        title="Santuario Botánico"
        subtitle="Margaritas, lirios, agua viva y cartas en el río para nosotros dos."
      />

      {/* Selector de pestañas táctil: Valle del Río vs Maceta del Lirio */}
      <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-card/85 border border-white/60 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundFx.playChime(1.1);
            setActiveTab('valle');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all font-serif text-xs ${
            activeTab === 'valle'
              ? 'bg-cyan-600 text-white shadow-md font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>El Valle del Río</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playChime(1.1);
            setActiveTab('lirio');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all font-serif text-xs ${
            activeTab === 'lirio'
              ? 'bg-rose-500 text-white shadow-md font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Flower2 className="w-4 h-4" />
          <span>Nuestro Lirio</span>
        </button>
      </div>

      {activeTab === 'valle' && (
        <RiverMeadowScene
          equippedAccessory={equippedAccessory}
          currentUser={member.data?.partnerEmail ? 'carlos' : 'carlos'}
        />
      )}

      {activeTab === 'lirio' && (
        <Gate member={member} query={q}>
          <Notice text={notice} />
          <div className="card-soft p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-serif text-2xl">{stageNames[stage]}</p>
              <p className="text-sm text-muted-foreground">Está {lilyMood(health, stress)}</p>
            </div>

            <LilyScene
              levels={levelsMap}
              moisture={moisture}
              drainage={drainage}
              stress={stress}
              careCount={count}
              busy={busy}
              onCare={care}
            />

            <div className="mt-4 space-y-2.5">
              <h3 className="font-serif text-sm font-semibold">Parámetros de cultivo</h3>
              {bars.map(a => (
                <div key={a.key}>
                  <div className="flex justify-between text-xs">
                    <span>{a.bar}</span>
                    <span className="tabular-nums text-muted-foreground">{levelsMap[a.key]}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${levelsMap[a.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground font-serif">
              {goal
                ? `${count} cuidados juntos · ${goal - count} más para que florezca a la siguiente fase`
                : `${count} cuidados juntos · ¡un jardín florecido y eterno! 🌷`}
            </p>
          </div>

          <div className="card-soft mt-3 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">🌱 Filosofía botánica compartida:</p>
            <p>
              El lirio nunca muere ni se marchita por completo. Si el agua o el sol bajan, mostrará sutiles señales
              de sed o exceso para que cualquiera de los dos pueda mimarlo. Lo que uno haga se refleja en vivo en la pantalla del otro.
            </p>
          </div>
        </Gate>
      )}
    </div>
  );
}

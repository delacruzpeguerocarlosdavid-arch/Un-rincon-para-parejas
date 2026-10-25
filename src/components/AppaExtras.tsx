import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { outfitCatalog } from '@/lib/appa';
import { soundFx } from '@/lib/sound-atmosphere';

type Data = { games: { game: string; score: number }[]; baths: unknown[]; furniture: unknown[]; words: unknown[]; rituals: unknown[]; outfits: { item: string; equipped: boolean }[]; purchases: { consumed_at: string | null }[] };

export const equippedEmoji = (outfits: { item: string; equipped: boolean }[]) => outfitCatalog.find(o => outfits.some(x => x.equipped && x.item === o.id))?.emoji;

/** Shared goals computed from the couple's history. */
export function appaGoals(d: Data, level: number) {
  const games = new Set(d.games.map(g => g.game)).size, points = d.games.reduce((n, g) => n + g.score, 0), fed = d.purchases.filter(p => p.consumed_at).length;
  return [
    { icon: '🫧', name: 'Siempre limpito', desc: 'Bañen a Appa 10 veces', n: d.baths.length, goal: 10 },
    { icon: '🍎', name: 'Barriguita llena', desc: 'Denle de comer 15 veces', n: fed, goal: 15 },
    { icon: '🎮', name: 'Probadores de juegos', desc: 'Jueguen los 8 minijuegos', n: games, goal: 8 },
    { icon: '⭐', name: 'Campeones', desc: 'Sumen 300 puntos en juegos', n: points, goal: 300 },
    { icon: '🔤', name: 'Buscadores de palabras', desc: 'Encuentren 20 palabras', n: d.words.length, goal: 20 },
    { icon: '🔥', name: 'Una semana juntos', desc: 'Completen el ritual 7 días', n: d.rituals.length, goal: 7 },
    { icon: '🌙', name: 'Un mes de amor', desc: 'Completen el ritual 30 días', n: d.rituals.length, goal: 30 },
    { icon: '🛋️', name: 'Nuestro hogar', desc: 'Compren 5 muebles', n: d.furniture.length, goal: 5 },
    { icon: '👑', name: 'Appa a la moda', desc: 'Consigan 4 accesorios', n: d.outfits.length, goal: 4 },
    { icon: '🏅', name: 'Appa crece', desc: 'Lleguen al nivel 5', n: level, goal: 5 },
    { icon: '🏆', name: 'Leyenda', desc: 'Lleguen al nivel 10', n: level, goal: 10 },
  ];
}

export function Goals({ d, level }: { d: Data; level: number }) {
  const goals = appaGoals(d, level), done = goals.filter(g => g.n >= g.goal).length;
  return <div className="space-y-3"><p className="text-center font-serif text-xl">{done} de {goals.length} metas logradas</p>
    <ul className="grid gap-2">{goals.map(g => { const ok = g.n >= g.goal; return <li key={g.name} className={`card-soft flex items-center gap-3 p-3 ${ok ? '' : 'opacity-90'}`}>
      <span className={`text-3xl ${ok ? '' : 'grayscale'}`}>{g.icon}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="font-semibold">{g.name}</p><p className="text-xs tabular-nums text-muted-foreground">{Math.min(g.n, g.goal)}/{g.goal}</p></div>
      <p className="text-xs text-muted-foreground">{ok ? '¡Logrado! 🎉' : g.desc}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, g.n / g.goal * 100)}%` }} /></div></div></li>; })}</ul></div>;
}

export function Wardrobe({ d, coins, busy, buy, wear }: { d: Data; coins: number; busy: boolean; buy: (id: string) => void; wear: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('todos');

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'cabeza', label: '👑 Cabecita' },
    { id: 'cara', label: '👓 Carita' },
    { id: 'cuerpo', label: '🎀 Cuerpo' },
    { id: 'aura', label: '✨ Auras' },
  ];

  const filtered = outfitCatalog.filter(o => {
    if (filter === 'todos') return true;
    return (o as { category?: string }).category === filter;
  });

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-muted-foreground">
        Vistan a Appa con accesorios ganados cuidándolo y jugando juntos.
      </p>

      {/* Selector de categorías */}
      <div className="flex justify-center gap-1 overflow-x-auto pb-1">
        {categories.map(c => (
          <Button
            key={c.id}
            size="sm"
            variant={filter === c.id ? 'default' : 'ghost'}
            className="h-8 px-2.5 text-xs rounded-xl"
            onClick={() => {
              soundFx.playChime(1.1);
              setFilter(c.id);
            }}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
        {filtered.map(o => {
          const own = d.outfits.find(x => x.item === o.id);
          return (
            <li key={o.id} className="card-soft p-3 text-center flex flex-col justify-between">
              <div>
                <span className="block text-4xl mb-1 filter drop-shadow">{o.emoji}</span>
                <p className="text-xs font-semibold leading-tight line-clamp-1">{o.name}</p>
              </div>
              {own ? (
                <Button
                  size="sm"
                  variant={own.equipped ? 'default' : 'outline'}
                  disabled={busy}
                  className="mt-2.5 w-full text-xs h-8 rounded-xl"
                  onClick={() => {
                    soundFx.playChime(1.2);
                    wear(o.id);
                  }}
                >
                  {own.equipped ? '✓ Puesto' : 'Ponérselo'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || coins < o.cost}
                  className="mt-2.5 w-full text-xs h-8 rounded-xl border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                  onClick={() => {
                    soundFx.playChime(1.3);
                    buy(o.id);
                  }}
                >
                  🪙 {o.cost}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const lines = { happy: ['¡Los quiero mucho! 💕', '¿Jugamos algo?', 'Hoy es un buen día 🌷', '¡Abrazo de nube!'], hungry: ['Tengo hambrecita… 🍎', '¿Hay algo rico en la cocina?'], tired: ['Tengo sueñito… 😴', 'Una siesta me vendría bien'], dirty: ['Creo que necesito un baño 🫧'], idle: ['¿Cómo está el lirio?', 'Me gusta cuando están los dos aquí', 'Acaríciame 🤍'] };
export function appaLine(s: { hunger: number; energy: number; hygiene: number; happiness: number }, seed: number) {
  const pool = s.hunger < 35 ? lines.hungry : s.energy < 30 ? lines.tired : s.hygiene < 35 ? lines.dirty : s.happiness > 70 ? lines.happy : lines.idle;
  return pool[seed % pool.length]!;
}

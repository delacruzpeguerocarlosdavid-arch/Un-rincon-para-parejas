import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BatteryMedium, Coins, Drumstick, Moon, Smile, Sparkles, Sun, Droplets, ShowerHead, Lamp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { CloudGame, FoodGame, MemoryGame } from '@/components/AppaGames';
import { Goals, Wardrobe, appaLine, equippedEmoji } from '@/components/AppaExtras';
import { BubbleGame, BugGame, HeartGame, ReflexGame, SimonGame } from '@/components/AppaGames2';
import { supabase } from '@/integrations/supabase/client';
import { Gate, Notice, useStage3 } from '@/components/Stage3Parts';
import { dominicanToday } from '@/lib/stage3';
import { FOOD_HUNGER, appaFoods, appaLook, appaOptions, coinBalance, decayStats, levelFor, totalExp } from '@/lib/appa';
import { AppaSprite } from '@/components/AppaSprite';
import { AppaPouInteractive } from '@/components/AppaPouInteractive';
import { AppaRoom } from '@/components/AppaRoom';
import { BATH_REWARD, furnitureCatalog, hygieneValue, rooms, type Room } from '@/lib/appa-home';
import { WordSearch } from '@/components/WordSearch';

export const Route = createFileRoute('/_authenticated/appa')({
  head: () => ({ meta: [
    { title: 'Appa · Un lugar para nosotros dos' },
    { name: 'description', content: 'Cuiden juntos a Appa: acarícienlo, denle de comer, pónganlo a dormir y jueguen.' },
    { property: 'og:title', content: 'Appa · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Nuestra mascota virtual compartida.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AppaPage,
});

type Tab = 'cuidar' | 'tienda' | 'juegos' | 'decorar' | 'armario' | 'metas';
type GameId = 'nubes' | 'memoria' | 'comida' | 'burbujas' | 'simon' | 'bichos' | 'corazones' | 'reflejos';
type Fx = { id: number; x: number; y: number; t: string };

function Bar({ icon: Icon, label, value }: { icon: typeof Smile; label: string; value: number }) {
  return <div className="flex items-center gap-2 text-xs">
    <Icon className="h-4 w-4 shrink-0 text-primary" /><span className="w-16 shrink-0">{label}</span>
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ${value < 35 ? 'bg-destructive/70' : 'bg-primary'}`} style={{ width: `${value}%` }} />
    </div><span className="w-8 text-right tabular-nums">{value}</span>
  </div>;
}

function AppaPage() {
  const ctx = useStage3();
  const qc = useQueryClient();
  const q = useQuery({ ...appaOptions, enabled: Boolean(ctx.member.data), refetchInterval: 60_000 });
  const [tab, setTab] = useState<Tab>('cuidar');
  const [room, setRoom] = useState<Room>('sala');
  const [bathTool, setBathTool] = useState<'soap' | 'rinse' | 'dry'>('soap');
  const bathStroke = useRef(0);
  const bathSending = useRef(false);
  const [bathMotion, setBathMotion] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [react, setReact] = useState<'' | 'appa-wiggle' | 'appa-chomp'>('');
  const [fx, setFx] = useState<Fx[]>([]);
  const [eating, setEating] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; e: string; x: number; y: number; sx: number; sy: number } | null>(null);
  const [, tick] = useState(0);
  const petArea = useRef<HTMLDivElement>(null);
  const stroke = useRef({ down: false, dist: 0, lx: 0, ly: 0, lastSent: 0 });
  const seq = useRef(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30_000); return () => clearInterval(t); }, []);

  const today = dominicanToday();
  const d: NonNullable<typeof q.data> = q.data ?? { interactions: [], purchases: [], games: [], state: null, baths: [], furniture: [], words: [], rituals: [], outfits: [] };
  const stats = decayStats(d.state);
  const look = appaLook(stats);
  const balance = coinBalance(d);
  const lv = levelFor(totalExp(d));
  const pantry = d.purchases.filter(p => !p.consumed_at);
  const wearing = equippedEmoji(d.outfits);
  const prevLv = useRef(0);
  useEffect(() => { if (prevLv.current && lv.level > prevLv.current) { setReply(`¡Appa subió a nivel ${lv.level}! 🎉`); ['🎉', '⭐', '💖', '✨'].forEach((t, i) => setTimeout(() => burst(t, 20 + i * 20, 30), i * 150)); } if (q.data) prevLv.current = lv.level; }, [lv.level, q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const hygiene = hygieneValue(d.state);
  const bathStage = d.state?.bath_stage ?? 'dirty';
  const playedToday = (g: string) => d.games.some(r => r.day === today && r.user_id === ctx.uid && r.game === g);

  function burst(t: string, x = 50, y = 40) {
    const f = { id: ++seq.current, x, y, t }; setFx(l => [...l.slice(-12), f]); setTimeout(() => setFx(l => l.filter(i => i.id !== f.id)), 1000);
  }
  function animate(cls: 'appa-wiggle' | 'appa-chomp') { setReact(''); requestAnimationFrame(() => setReact(cls)); setTimeout(() => setReact(''), 1100); }
  async function rpc<T>(fn: () => PromiseLike<{ data: T; error: { message: string } | null }>) {
    setBusy(true); setNotice('');
    try {
      const { data, error } = await fn();
      if (error) { setNotice(error.message); return null; }
      await qc.invalidateQueries({ queryKey: ['appa'] });
      return data;
    } catch { setNotice('No pudimos guardar el cambio. Inténtalo de nuevo.'); return null; }
    finally { setBusy(false); }
  }
  const care = (kind: string, purchase?: string) => rpc(() => supabase.rpc('appa_care', { p_kind: kind, ...(purchase ? { p_purchase: purchase } : {}) }));
  async function bathe() {
    if (bathSending.current || busy || stats.sleeping) return;
    bathSending.current = true;
    setBathMotion(bathTool); animate('appa-wiggle');
    try {
      const r = await rpc(() => supabase.rpc('appa_bathe', { p_step: bathTool })) as { rewarded: boolean } | null;
      if (r) {
        if (bathTool === 'soap') { setBathTool('rinse'); setReply('Appa está cubierto de espuma.'); }
        if (bathTool === 'rinse') { setBathTool('dry'); setReply('Appa sacude las gotitas.'); }
        if (bathTool === 'dry') { setBathTool('soap'); burst('✨'); setReply(r.rewarded ? `¡Limpio y esponjoso! +${BATH_REWARD.coins} monedas · +${BATH_REWARD.exp} EXP` : '¡Limpio y esponjoso! El premio de hoy ya está guardado.'); }
      }
    } finally { bathSending.current = false; setTimeout(() => setBathMotion(''), 1200); }
  }

  // Stroking: drag a finger over Appa; hearts follow and he reacts.
  function onPetMove(e: React.PointerEvent) {
    const s = stroke.current; if (!s.down || stats.sleeping) return;
    const r = petArea.current?.getBoundingClientRect(); if (!r) return;
    s.dist += Math.hypot(e.clientX - s.lx, e.clientY - s.ly); s.lx = e.clientX; s.ly = e.clientY;
    if (room === 'bano') {
      bathStroke.current += Math.hypot(e.movementX, e.movementY);
      if (s.dist > 15) burst(bathTool === 'soap' ? '🫧' : bathTool === 'rinse' ? '💧' : '✨', ((e.clientX-r.left)/r.width)*100, ((e.clientY-r.top)/r.height)*100);
      if (s.dist > 150) { s.dist = 0; void bathe(); }
      return;
    }
    if (s.dist > 120) {
      s.dist = 0; animate('appa-wiggle');
      burst(['💗', '🤍', '✨'][Math.floor(Math.random() * 3)] ?? '🤍', ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
      if (Date.now() - s.lastSent > 2500) { s.lastSent = Date.now(); setReply('Appa ronronea y se acurruca en tu mano.'); void care('pet'); }
    }
  }

  async function feed(id: string, food: string) {
    if (stats.sleeping) { setNotice('Appa está durmiendo. Despiértalo primero.'); return; }
    const f = appaFoods.find(x => x.id === food);
    setEating(f?.emoji ?? '🍎'); animate('appa-chomp');
    const r = await care('feed', id);
    setTimeout(() => setEating(null), 1100);
    if (r) { burst('¡Ñam!'); setReply(stats.hunger > 90 ? 'Appa está llenito, pero lo disfrutó igual.' : `Appa saborea ${f?.label.toLowerCase()} ${f?.emoji} y se lame los bigotes.`); }
  }
  function onDragEnd(e: React.PointerEvent) {
    if (!drag) return;
    const r = petArea.current?.getBoundingClientRect();
    const tap = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 10;
    const hit = tap || (r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
    const item = pantry.find(p => p.id === drag.id); setDrag(null);
    if (hit && item) void feed(item.id, item.food);
  }
  const finish = (game: GameId) => async (score: number) => {
    const r = await rpc(() => supabase.rpc('appa_finish_game', { p_game: game, p_score: score })) as { coins: number; exp: number; repeat: boolean } | null;
    if (r) setReply(r.repeat ? `¡${score} puntos! Ya ganaste premio en este juego hoy, pero Appa se divirtió.` : `¡${score} puntos! +${r.coins} monedas y +${r.exp} EXP`);
  };

  return <div onPointerMove={e => drag && setDrag({ ...drag, x: e.clientX, y: e.clientY })} onPointerUp={onDragEnd}>
    <PageHeader title="La casa de Appa" subtitle="Un hogar que cuidamos juntos." />
    <Gate member={ctx.member} query={q}>
      <Notice text={notice} />
      <section className="mb-4">
        <div className="flex justify-center gap-2 text-sm font-semibold flex-wrap">
          <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1 shadow-sm"><Coins className="h-4 w-4 text-primary" />{balance}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1 shadow-sm"><Sparkles className="h-4 w-4 text-primary" />Nivel {lv.level} · {lv.into}/{lv.needed}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-900 dark:text-amber-200 px-3 py-1 text-xs font-serif font-bold shadow-sm">
            {lv.level < 6 ? '🐾 Appa Bebé' : lv.level < 16 ? '🍃 Explorador Ágil' : lv.level < 30 ? '☁️ Bisonte Volador' : '👑 Guardián Legendario'}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          <Bar icon={Drumstick} label="Comida" value={stats.hunger} />
          <Bar icon={Smile} label="Felicidad" value={stats.happiness} />
          <Bar icon={BatteryMedium} label="Energía" value={stats.energy} />
          <Bar icon={Droplets} label="Higiene" value={hygiene} />
        </div>
        <div className="my-4 grid grid-cols-4 gap-1" role="tablist" aria-label="Habitaciones">{rooms.map(r => <Button key={r.id} role="tab" aria-selected={room === r.id} variant={room === r.id ? 'default' : 'ghost'} className="h-14 min-w-0 flex-col gap-1 px-0 text-[11px]" onClick={() => { setRoom(r.id); setTab('cuidar'); }}><span className="text-xl">{r.emoji}</span>{r.label}</Button>)}</div>
        <AppaRoom room={room} sleeping={stats.sleeping} furniture={d.furniture}>
          {room === 'dormitorio' && <Button className="room-switch" size="icon" variant="outline" aria-label={stats.sleeping ? 'Encender luz y despertar' : 'Apagar luz y arropar'} disabled={busy} onClick={() => care(stats.sleeping ? 'wake' : 'sleep')}><Lamp /></Button>}
          <div className="room-pet">
            <AppaPouInteractive
              mood={eating ? 'eating' : react === 'appa-wiggle' ? 'petted' : look.pose}
              sleeping={stats.sleeping}
              hygiene={hygiene}
              accessory={d.outfits.find(x => x.equipped)?.item}
              bathTool={bathTool}
              activeRoom={room}
              draggedFood={drag ? { id: drag.id, emoji: drag.e, x: drag.x, y: drag.y } : null}
              onFeedComplete={(foodId) => {
                const item = pantry.find(p => p.id === foodId);
                if (item) void feed(item.id, item.food);
              }}
              onBatheComplete={() => void bathe()}
              onPetCare={() => {
                soundFx.playChime(1.15);
                void care('pet');
              }}
            />
            {!stats.sleeping && !reply && (
              <span className="pointer-events-none absolute -top-4 left-1/2 max-w-[14rem] -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-card/90 px-3 py-1 text-xs shadow-md backdrop-blur-sm z-30 font-serif">
                {appaLine({ ...stats, hygiene }, Math.floor(Date.now() / 30000))}
              </span>
            )}
            {stats.sleeping && (
              <>
                {[0, 0.8, 1.6].map(delay => (
                  <span
                    key={delay}
                    className="zzz pointer-events-none absolute right-8 top-6 font-serif text-2xl text-muted-foreground"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    z
                  </span>
                ))}
              </>
            )}
          </div>
        </AppaRoom>
        <p className="text-center font-serif text-2xl">{look.face} {look.text}</p>
        <p role="status" className="mt-1 min-h-5 text-center text-sm">{reply || (stats.sleeping ? 'Shh… está soñando con nubes.' : 'Appa está en casa. 🤍')}</p>
      </section>

      <div className="mb-4 flex flex-wrap gap-1">{(['cuidar', 'tienda', 'juegos', 'decorar', 'armario', 'metas'] as const).map(t => <Button key={t} size="sm" variant={tab === t ? 'default' : 'ghost'} onClick={() => setTab(t)} className="capitalize">{t === 'decorar' ? 'Diseñar' : t}</Button>)}</div>

      {tab === 'cuidar' && <div className="space-y-4">
        {room === 'bano' && <div className="grid grid-cols-3 gap-2">{([['soap','🧼','Jabón'],['rinse','🚿','Enjuagar'],['dry','🧺','Secar']] as const).map(([step,emoji,label]) => <Button key={step} variant={bathTool === step ? 'default' : 'outline'} disabled={busy || stats.sleeping || (step === 'rinse' && bathStage !== 'soapy') || (step === 'dry' && bathStage !== 'rinsed')} onClick={() => { setBathTool(step); }} onDoubleClick={() => void bathe()} className="h-16 flex-col"><span className="text-2xl">{emoji}</span>{label}</Button>)}<Button className="col-span-3" disabled={busy || stats.sleeping} onClick={() => void bathe()}><ShowerHead />{bathTool === 'soap' ? 'Frotar con jabón' : bathTool === 'rinse' ? 'Abrir la ducha' : 'Secar con toalla'}</Button></div>}
        {room === 'dormitorio' && <Button className="w-full" variant="outline" disabled={busy} onClick={() => care(stats.sleeping ? 'wake' : 'sleep')}><Lamp />{stats.sleeping ? 'Encender luz y despertar' : 'Apagar luz y arropar'}</Button>}
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={busy || stats.sleeping} onClick={async () => { animate('appa-wiggle'); burst('🫂'); if (await care('hug')) setReply('Appa te devuelve un abrazo enorme.'); }}><Heart />Abrazar</Button>
          {stats.sleeping
            ? <Button variant="outline" disabled={busy} onClick={async () => { if (await care('wake')) setReply('Appa bosteza y estira sus patitas. ¡Buenos días!'); }}><Sun />Despertar</Button>
            : <Button variant="outline" disabled={busy} onClick={async () => { if (await care('sleep')) setReply('Appa se acurruca y cierra los ojitos…'); }}><Moon />Dormir</Button>}
        </div>
        {room === 'cocina' && <section className="p-4">
          <h2 className="text-xl font-semibold">Despensa</h2>
          <p className="mb-3 text-xs text-muted-foreground">Arrastra la comida hasta Appa (o tócala) para dársela.</p>
          {!pantry.length ? <p className="text-sm text-muted-foreground">La despensa está vacía. Compren algo en la tienda.</p> :
            <div className="flex flex-wrap gap-2">{pantry.map(p => { const f = appaFoods.find(x => x.id === p.food); return <Button key={p.id} disabled={busy} variant="secondary" className="h-14 touch-none px-3 py-2 text-3xl active:scale-95"
              aria-label={`Dar ${f?.label ?? p.food}`} title={`${f?.label} · +${FOOD_HUNGER[p.food]} comida`}
              onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ id: p.id, e: f?.emoji ?? '🍎', x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY }); }}
              onPointerCancel={() => setDrag(null)}
              onClick={e => { if (e.detail === 0) void feed(p.id, p.food); }}>{f?.emoji}</Button>; })}</div>}
        </section>}
        <p className="text-center text-xs text-muted-foreground">Acariciar, abrazar, dar de comer y jugar dan monedas una vez al día a cada uno (hora de Santo Domingo). Las barras bajan despacio y nunca de 10.</p>
      </div>}
      {tab === 'decorar' && <div><h2 className="mb-3 text-2xl">Nuestro hogar · {rooms.find(r => r.id === room)?.label}</h2><ul className="grid grid-cols-2 gap-3">{furnitureCatalog.map(f => {
        const owned = d.furniture.find(i => i.item === f.id);
        return <li className="card-soft flex flex-col gap-2 p-3" key={f.id}><span className="text-4xl">{f.emoji}</span><h3 className="text-lg">{f.label}</h3>{owned ? <><span className="text-xs text-muted-foreground">{owned.room ? rooms.find(r => r.id === owned.room)?.label : 'Guardado'}</span><Button size="sm" variant="outline" disabled={busy} onClick={async () => { await rpc(() => supabase.rpc('appa_place_furniture', { p_item: f.id, ...(owned.room === room ? {} : { p_room: room }) })); }}>{owned.room === room ? 'Guardar' : 'Colocar aquí'}</Button></> : <Button size="sm" disabled={busy || balance < f.cost} onClick={() => rpc(() => supabase.rpc('appa_buy_furniture', { p_item: f.id }))}><Coins />{f.cost}</Button>}</li>;
      })}</ul></div>}

      {tab === 'tienda' && <ul className="space-y-3">{appaFoods.map(f => <li key={f.id} className="card-soft flex items-center gap-3 p-4">
        <span className="text-3xl">{f.emoji}</span>
        <span className="flex-1"><span className="block font-serif text-lg font-semibold">{f.label}</span><span className="text-xs text-muted-foreground">+{FOOD_HUNGER[f.id]} comida · +{f.exp} EXP</span></span>
        <Button size="sm" disabled={busy || balance < f.cost} onClick={async () => { if (await rpc(() => supabase.rpc('appa_buy_food', { p_food: f.id }))) setReply(`${f.label} ${f.emoji} guardada en la despensa.`); }}><Coins />{f.cost}</Button>
      </li>)}<p className="text-center text-xs text-muted-foreground">Las monedas son de los dos y solo se ganan jugando y cuidando a Appa; no hay compras con dinero real.</p></ul>}

      {tab === 'metas' && <Goals d={d} level={lv.level} />}
      {tab === 'armario' && <Wardrobe d={d} coins={balance} busy={busy} buy={async id => { if (await rpc(async () => { const r = await supabase.rpc('appa_buy_outfit', { p_item: id }); return { data: true, error: r.error }; })) { setReply('¡Nuevo accesorio para Appa! ✨'); animate('appa-wiggle'); } }} wear={async id => { await rpc(() => supabase.rpc('appa_wear_outfit', { p_item: id })); animate('appa-wiggle'); }} />}
      {tab === 'juegos' && <div className="space-y-4">
        <WordSearch />
        {stats.sleeping && <p className="card-soft p-3 text-sm">Appa está durmiendo. Despiértalo para jugar.</p>}
        {stats.energy < 25 && !stats.sleeping && <p className="card-soft p-3 text-sm">Appa está cansadito; pueden jugar, pero una siesta le vendría bien.</p>}
        {([['comida', 'Atrapa la comida', 'Mueve a Appa para atrapar la fruta que cae; las estrellas valen 3.', FoodGame], ['nubes', 'Explota las nubes', 'Toca las nubes antes de que se vayan; las doradas valen 3 y los toques rápidos hacen combo.', CloudGame], ['memoria', 'Memoria de Appa', 'Encuentra las parejas con pocos intentos.', MemoryGame], ['burbujas', 'Burbujas de jabón', 'Explota burbujas; las arcoíris valen 3, evita las bombas.', BubbleGame], ['simon', 'Sigue a Appa', 'Memoriza y repite la secuencia de flores.', SimonGame], ['bichos', 'Protege el lirio', 'Atrapa a los bichitos, pero no toques a las abejas amigas.', BugGame], ['corazones', 'Latidos de amor', 'Juego de ritmo: toca justo cuando el corazón llegue al círculo.', HeartGame], ['reflejos', '¿Dónde está Appa?', 'Reflejos: toca en cuanto Appa salga de las flores.', ReflexGame]] as const).map(([id, title, desc, Game]) =>
          <section key={id} className="card-soft p-4"><h2 className="text-xl font-semibold">{title}</h2>
            <p className="mb-3 text-xs text-muted-foreground">{desc} {playedToday(id) ? 'Hoy ya ganaste premio aquí; sigue jugando por diversión.' : 'Premio diario: hasta 5 monedas y 50 EXP.'}</p>
            <Game onFinish={finish(id)} disabled={busy || stats.sleeping} /></section>)}
      </div>}
      {drag && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) >= 10 && <span className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 text-5xl" style={{ left: drag.x, top: drag.y }}>{drag.e}</span>}
    </Gate>
  </div>;
}

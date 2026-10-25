import { useEffect, useRef, useState } from 'react';
import type { LilyAction, LilyStress } from '@/lib/lily';
import bloom from '@/assets/lily-bloom.png';
import bud from '@/assets/lily-bud.png';

type Props = {
  levels: Record<'sun' | 'water' | 'prune' | 'feed' | 'pests' | 'drain', number>;
  moisture: number;
  drainage: number;
  stress: LilyStress;
  careCount: number;
  busy: boolean;
  onCare: (a: LilyAction) => Promise<boolean>;
};

type Fx = { id: number; x: number; y: number; t: string; cls: string };

/** Growth stage from shared care count: brote → tallo → capullo → flor → jardín. */
export function lilyStage(count: number) {
  return count < 3 ? 0 : count < 8 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
}
export const stageNames = ['Brote', 'Tallo joven', 'Capullo', 'Flor abierta', 'Jardín de lirios'];

const leafSpots = [[30, 62], [68, 55], [38, 44]];
const bugSpots = [[44, 36], [60, 46], [34, 52], [56, 30]];

export function LilyScene({ levels, moisture, drainage, stress, careCount, busy, onCare }: Props) {
  const health = Math.min(...Object.values(levels));
  const stage = lilyStage(careCount);
  const box = useRef<HTMLDivElement>(null);
  const id = useRef(0);
  const pourT = useRef<number | null>(null);

  const [fx, setFx] = useState<Fx[]>([]);
  const [sunPos, setSunPos] = useState<{ x: number; y: number } | null>(null);
  const [pour, setPour] = useState(0);
  const [shake, setShake] = useState(0);
  const [sway, setSway] = useState(false);

  const dry = levels.prune < 50 ? 3 : levels.prune < 85 ? 2 : levels.prune < 98 ? 1 : 0;
  const bugs = levels.pests < 40 ? 4 : levels.pests < 75 ? 2 : levels.pests < 97 ? 1 : 0;
  const [cut, setCut] = useState<number[]>([]);
  const [squashed, setSquashed] = useState<number[]>([]);

  useEffect(() => setCut([]), [dry]);
  useEffect(() => setSquashed([]), [bugs]);
  useEffect(() => () => { if (pourT.current) clearInterval(pourT.current); }, []);

  const hour = Number(
    new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo', hour: 'numeric', hour12: false }),
  );
  const night = hour < 6 || hour >= 19;

  const burst = (t: string, n: number, x0 = 50, y0 = 40, cls = 'lily-float') => {
    const add = Array.from({ length: n }, () => ({
      id: id.current++,
      x: x0 + (Math.random() - 0.5) * 30,
      y: y0 + (Math.random() - 0.5) * 16,
      t,
      cls,
    }));
    setFx(f => [...f, ...add]);
    setTimeout(() => setFx(f => f.filter(e => !add.includes(e))), 2200);
  };

  const pct = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };

  const care = async (a: LilyAction, t: string) => {
    if (await onCare(a)) {
      burst(t, 7);
      setSway(true);
      setTimeout(() => setSway(false), 900);
    }
  };

  const startPour = () => {
    if (busy || pourT.current) return;
    let p = 0;
    pourT.current = window.setInterval(() => {
      p += 4;
      setPour(p);
      if (p % 8 === 0) burst('💧', 1, 70, 22, 'lily-drop');
      if (p >= 100) {
        stopPour();
        void care('water', '🌈');
      }
    }, 60);
  };

  const stopPour = () => {
    if (pourT.current) clearInterval(pourT.current);
    pourT.current = null;
    setTimeout(() => setPour(0), 250);
  };

  const img = stage >= 3 ? bloom : bud;
  const scale = [0.55, 0.7, 0.85, 1, 0.92][stage]!;

  // Filtros de estrés botánico (respetuosos, no destructivos)
  const isThirsty = stress.type === 'thirsty';
  const isOverwatered = stress.type === 'overwatered';
  const isLowLight = stress.type === 'low_light';

  const filterStyle = [
    `saturate(${0.4 + health / 130})`,
    `brightness(${isLowLight ? 0.75 : 0.85 + health / 500})`,
    isThirsty ? 'sepia(0.35)' : '',
    isOverwatered ? 'hue-rotate(20deg)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="select-none">
      {/* Insignia de estado biológico amigable */}
      <div className="mb-2 flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <span>{stress.icon}</span>
          <span className={stress.colorClass}>{stress.title}</span>
        </span>
        <span className="text-[11px] text-muted-foreground">{stress.recommendation}</span>
      </div>

      <div
        ref={box}
        className={`relative aspect-[3/4] w-full touch-none overflow-hidden rounded-2xl ${
          night ? 'lily-sky-night' : 'lily-sky-day'
        }`}
        onPointerMove={e => sunPos && setSunPos(pct(e))}
        onPointerUp={() => {
          if (!sunPos) return;
          const near = Math.hypot(sunPos.x - 50, sunPos.y - 40) < 25;
          setSunPos(null);
          if (near && !busy) void care('sun', '✨');
        }}
      >
        {/* Haz de luz natural del sol */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: levels.sun / 140,
            background:
              'radial-gradient(circle at 15% 12%, oklch(0.97 0.08 90 / .9), transparent 55%)',
          }}
        />

        {/* Rayos de sol volumétricos y polvo de luz */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-72 h-80 opacity-40 z-1"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(254, 240, 138, 0.45) 0%, rgba(253, 224, 71, 0.15) 45%, transparent 75%)',
          }}
        />

        {/* Maceta de cerámica artesanal 3D y tierra viva */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[82%] h-[22%] z-10 flex flex-col items-center select-none pointer-events-none">
          {/* Superficie de tierra orgánica viva */}
          <div
            className="w-[92%] h-7 rounded-[50%] transition-colors duration-700 -mb-3 z-12 shadow-inner border border-amber-950/40"
            style={{
              background:
                moisture > 70
                  ? 'radial-gradient(ellipse at center, #2e1065 0%, #3b1d11 60%, #1c0d07 100%)'
                  : moisture < 35
                  ? 'radial-gradient(ellipse at center, #a16207 0%, #78350f 70%, #451a03 100%)'
                  : 'radial-gradient(ellipse at center, #5a2e17 0%, #451a03 70%, #290f02 100%)',
            }}
          >
            {/* Gotitas de rocío sobre la tierra húmeda */}
            {moisture > 50 && (
              <div className="flex justify-around items-center h-full px-4 opacity-75">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-ping" />
                <span className="w-1 h-1 rounded-full bg-cyan-100 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-ping delay-500" />
              </div>
            )}
          </div>

          {/* Borde superior de terracota */}
          <div className="w-full h-5 rounded-full bg-gradient-to-r from-[#9a3412] via-[#ea580c] to-[#7c2d12] shadow-lg border-b border-black/30 z-11" />

          {/* Cuerpo cónico de la maceta de terracota con sombra */}
          <div
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 84% 100%, 16% 100%)' }}
            className="w-[94%] flex-1 bg-gradient-to-b from-[#c2410c] via-[#9a3412] to-[#7c2d12] shadow-2xl flex flex-col justify-end pb-2 pt-1 px-4 text-center"
          >
            <div className="flex items-center justify-between text-[10px] text-amber-100 font-serif font-medium">
              <span className="flex items-center gap-1 filter drop-shadow">
                <span>💧 Humedad:</span>
                <strong className="tabular-nums font-bold">{moisture}%</strong>
              </span>
              <span className="flex items-center gap-1 filter drop-shadow">
                <span>🪴 Drenaje:</span>
                <strong className="tabular-nums font-bold">{drainage}%</strong>
              </span>
            </div>
            <span className="text-[9px] font-serif text-amber-200/80 tracking-widest italic -mt-0.5 filter drop-shadow">
              Lirio de Amor · Carlos & Mimie
            </span>
          </div>

          {/* Sombra de la maceta en la mesa */}
          <div className="w-[70%] h-3 rounded-[50%] bg-black/40 blur-sm -mt-1.5" />
        </div>

        {/* Plantas del jardín si está en etapa máxima */}
        {stage === 4 && (
          <>
            <img
              src={bloom}
              alt=""
              className="lily-sway absolute bottom-[9%] left-[-8%] w-[45%] opacity-90"
              style={{ filter: `saturate(${0.4 + health / 140})` }}
            />
            <img
              src={bud}
              alt=""
              className="lily-sway absolute bottom-[9%] right-[-8%] w-[42%]"
              style={{ filter: `saturate(${0.4 + health / 140})`, animationDelay: '1s' }}
            />
          </>
        )}

        {/* Lirio principal */}
        <div
          className="absolute bottom-[7%] left-[11%] w-[78%]"
          style={{
            transform: `scale(${scale}) rotate(${isThirsty ? -5 : 0}deg)`,
            transformOrigin: '50% 100%',
            transition: 'transform .7s',
          }}
        >
          <img
            src={img}
            alt={`Nuestro lirio rosa: ${stageNames[stage]}`}
            width={768}
            height={1024}
            draggable={false}
            onPointerDown={() => {
              burst(['💗', '🌸', '💕'][Math.floor(Math.random() * 3)]!, 5);
              setSway(true);
              setTimeout(() => setSway(false), 900);
            }}
            className={`w-full cursor-pointer ${sway ? 'lily-sway-strong' : 'lily-sway'}`}
            style={{
              transformOrigin: '50% 100%',
              transformBox: 'border-box',
              filter: filterStyle,
              transition: 'filter 1s',
            }}
          />
        </div>

        {/* Hojas secas por podar */}
        {leafSpots.slice(0, dry).map(
          ([x, y], i) =>
            !cut.includes(i) && (
              <button
                key={`l${i}`}
                aria-label="Cortar hoja seca"
                className="lily-pulse absolute -translate-x-1/2 -translate-y-1/2 text-3xl"
                style={{ left: `${x}%`, top: `${y}%` }}
                onPointerDown={e => {
                  e.stopPropagation();
                  if (busy) return;
                  const n = [...cut, i];
                  setCut(n);
                  burst('✂️', 1, x!, y!, 'lily-fall');
                  if (n.length === dry) void care('prune', '🍃');
                }}
              >
                🍂
              </button>
            ),
        )}

        {/* Bichitos */}
        {bugSpots.slice(0, bugs).map(
          ([x, y], i) =>
            !squashed.includes(i) && (
              <button
                key={`b${i}`}
                aria-label="Quitar bichito"
                className="lily-crawl absolute text-2xl"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.7}s` }}
                onPointerDown={e => {
                  e.stopPropagation();
                  if (busy) return;
                  const n = [...squashed, i];
                  setSquashed(n);
                  burst('💨', 1, x!, y!);
                  if (n.length === bugs) void care('pests', '🐞');
                }}
              >
                {i % 2 ? '🐛' : '🐜'}
              </button>
            ),
        )}

        {/* Sol / Luna interactivo */}
        <button
          aria-label="Arrastra el astro hasta el lirio"
          className="absolute -translate-x-1/2 -translate-y-1/2 text-5xl"
          style={{
            left: `${sunPos?.x ?? 15}%`,
            top: `${sunPos?.y ?? 12}%`,
            cursor: 'grab',
            filter: `drop-shadow(0 0 ${8 + levels.sun / 6}px oklch(0.9 0.15 90))`,
          }}
          onPointerDown={e => {
            e.preventDefault();
            setSunPos(pct(e));
          }}
        >
          <span className="lily-spin inline-block">{night ? '🌙' : '☀️'}</span>
        </button>
        {sunPos && (
          <div className="pointer-events-none absolute left-1/2 top-[40%] h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-primary" />
        )}

        {/* Regadera interactiva */}
        <button
          aria-label="Mantén presionado para regar"
          className="absolute right-[6%] top-[8%] text-5xl transition-transform"
          style={{ transform: `rotate(${-pour / 2.2}deg)` }}
          onPointerDown={startPour}
          onPointerUp={stopPour}
          onPointerLeave={stopPour}
        >
          🚿
          {pour > 0 && (
            <span className="absolute -bottom-2 left-0 h-1.5 rounded bg-primary" style={{ width: `${pour}%` }} />
          )}
        </button>

        {/* Abono interactivo */}
        <button
          aria-label="Agita el abono"
          className={`absolute left-[5%] top-[28%] text-4xl ${shake ? 'appa-wiggle' : ''}`}
          onPointerDown={() => {
            if (busy) return;
            const n = shake + 1;
            burst('🟤', 2, 14, 34, 'lily-drop');
            if (n >= 5) {
              setShake(0);
              void care('feed', '🌱');
            } else setShake(n);
          }}
        >
          🧺
          {shake > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {5 - shake}
            </span>
          )}
        </button>

        {/* Airear sustrato / drenaje */}
        <button
          aria-label="Airear el sustrato y mejorar el drenaje"
          className="absolute left-[5%] top-[42%] text-4xl"
          title="Airear tierra"
          onPointerDown={() => {
            if (busy) return;
            burst('🪴', 3, 30, 80);
            void care('drain', '🪴');
          }}
        >
          🪴
        </button>

        {/* Canción serena */}
        <button
          aria-label="Cantarle al lirio"
          className="absolute left-[5%] top-[56%] text-4xl"
          onPointerDown={() => {
            if (busy) return;
            burst('🎵', 4, 40, 50);
            burst('🎶', 3, 60, 45);
            void onCare('song');
          }}
        >
          🎤
        </button>

        {night && health >= 60 && (
          <span className="lily-butterfly pointer-events-none absolute left-0 top-0 h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_4px] shadow-primary" />
        )}
        {!night && health >= 70 && (
          <span className="lily-butterfly pointer-events-none absolute left-0 top-0 text-2xl">🦋</span>
        )}
        {fx.map(e => (
          <span key={e.id} className={`pointer-events-none absolute text-2xl ${e.cls}`} style={{ left: `${e.x}%`, top: `${e.y}%` }}>
            {e.t}
          </span>
        ))}
      </div>

      <ul className="mt-3 grid gap-1 text-xs text-muted-foreground font-serif">
        <li>☀️ Arrastra el {night ? 'astro' : 'sol'} hasta el lirio · 🚿 mantén pulsada la regadera.</li>
        <li>🧺 Agita el abono 5 veces · 🪴 toca la maceta para airear la tierra y optimizar el drenaje.</li>
        <li>🎤 Cántale con amor · 🍂 corta hojas secas · 🐜 espanta los bichitos.</li>
      </ul>
    </div>
  );
}

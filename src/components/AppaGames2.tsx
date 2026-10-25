import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppaSprite } from '@/components/AppaSprite';

type GameProps = { onFinish: (score: number) => void; disabled: boolean };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function useTimer(running: boolean, secs: number, end: () => void) {
  const [left, setLeft] = useState(secs);
  useEffect(() => { if (running) setLeft(secs); }, [running, secs]);
  useEffect(() => { if (!running) return; if (left <= 0) { end(); return; } const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [running, left]); // eslint-disable-line react-hooks/exhaustive-deps
  return left;
}
const Bar = ({ score, left }: { score: number; left: number }) => <div className="mb-2 flex justify-between text-sm tabular-nums"><span>⭐ {score}</span><span>⏱ {left}s</span></div>;

/** Pop rising bubbles; rainbow bubbles worth 3, popping a 💣 costs 2. */
export function BubbleGame({ onFinish, disabled }: GameProps) {
  const [run, setRun] = useState(false), [score, setScore] = useState(0), [items, setItems] = useState<{ id: number; x: number; k: 0 | 1 | 2; d: number }[]>([]), sc = useRef(0), id = useRef(0);
  const left = useTimer(run, 25, () => { setRun(false); setItems([]); onFinish(sc.current); });
  useEffect(() => { if (!run) return; const t = setInterval(() => setItems(v => [...v.slice(-14), { id: id.current++, x: rnd(5, 85), k: Math.random() < .15 ? 1 : Math.random() < .12 ? 2 : 0, d: rnd(2.5, 4.5) }]), 450); return () => clearInterval(t); }, [run]);
  const pop = (b: { id: number; k: number }) => { setItems(v => v.filter(x => x.id !== b.id)); sc.current = Math.max(0, sc.current + (b.k === 1 ? 3 : b.k === 2 ? -2 : 1)); setScore(sc.current); };
  return <div>{run && <Bar score={score} left={left} />}<div className="relative h-64 overflow-hidden rounded-xl bg-secondary/40">
    {items.map(b => <button key={b.id} onPointerDown={() => pop(b)} className="game-rise absolute bottom-0 text-4xl" style={{ left: `${b.x}%`, animationDuration: `${b.d}s` }} onAnimationEnd={() => setItems(v => v.filter(x => x.id !== b.id))}>{b.k === 1 ? '🌈' : b.k === 2 ? '💣' : '🫧'}</button>)}
    {!run && <div className="absolute inset-0 grid place-items-center"><Button disabled={disabled} onClick={() => { sc.current = 0; setScore(0); setRun(true); }}>Jugar burbujas</Button></div>}
  </div></div>;
}

/** Repeat Appa's growing sequence of four colors. */
export function SimonGame({ onFinish, disabled }: GameProps) {
  const pads = ['🌸', '💙', '🌼', '🍀'];
  const [seq, setSeq] = useState<number[]>([]), [i, setI] = useState(0), [lit, setLit] = useState<number | null>(null), [show, setShow] = useState(false), [run, setRun] = useState(false);
  const play = async (s: number[]) => { setShow(true); for (const p of s) { await new Promise(r => setTimeout(r, 300)); setLit(p); await new Promise(r => setTimeout(r, 450)); setLit(null); } setShow(false); };
  const next = (s: number[]) => { const n = [...s, Math.floor(Math.random() * 4)]; setSeq(n); setI(0); void play(n); };
  const tap = (p: number) => { if (show || !run) return; setLit(p); setTimeout(() => setLit(null), 180);
    if (p !== seq[i]) { setRun(false); onFinish(Math.min(100, (seq.length - 1) * 4)); return; }
    if (i + 1 === seq.length) setTimeout(() => next(seq), 500); else setI(i + 1); };
  return <div><p className="mb-2 text-center text-sm">{run ? (show ? 'Mira a Appa…' : `Tu turno · ronda ${seq.length}`) : 'Repite la secuencia que te muestra Appa.'}</p>
    <div className="mx-auto grid max-w-xs grid-cols-2 gap-3">{pads.map((e, p) => <button key={p} onPointerDown={() => tap(p)} className={`aspect-square rounded-2xl border border-border text-5xl transition ${lit === p ? 'scale-95 bg-primary' : 'bg-card'}`}>{e}</button>)}</div>
    {!run && <div className="mt-3 text-center"><Button disabled={disabled} onClick={() => { setRun(true); next([]); }}>Empezar</Button></div>}</div>;
}

/** Whack-a-bug: bugs pop out of the lily pot; don't tap the 🐝 friends. */
export function BugGame({ onFinish, disabled }: GameProps) {
  const [run, setRun] = useState(false), [score, setScore] = useState(0), [holes, setHoles] = useState<(null | 'bug' | 'bee')[]>(Array(9).fill(null)), sc = useRef(0);
  const left = useTimer(run, 25, () => { setRun(false); setHoles(Array(9).fill(null)); onFinish(sc.current); });
  useEffect(() => { if (!run) return; const t = setInterval(() => setHoles(() => { const h: (null | 'bug' | 'bee')[] = Array(9).fill(null); const n = 1 + Math.floor(Math.random() * 2); for (let k = 0; k < n; k++) h[Math.floor(Math.random() * 9)] = Math.random() < .2 ? 'bee' : 'bug'; return h; }), 800); return () => clearInterval(t); }, [run]);
  const hit = (k: number) => { const v = holes[k]; if (!v) return; sc.current = Math.max(0, sc.current + (v === 'bug' ? 1 : -2)); setScore(sc.current); setHoles(h => h.map((x, j) => j === k ? null : x)); };
  return <div>{run && <Bar score={score} left={left} />}<div className="mx-auto grid max-w-xs grid-cols-3 gap-2">{holes.map((v, k) => <button key={k} onPointerDown={() => hit(k)} className="grid aspect-square place-items-end rounded-full bg-accent/60 pb-2 text-4xl"><span className={v ? 'game-pop' : 'opacity-0'}>{v === 'bee' ? '🐝' : '🐛'}</span></button>)}</div>
    {!run && <div className="mt-3 text-center"><Button disabled={disabled} onClick={() => { sc.current = 0; setScore(0); setRun(true); }}>Proteger el lirio</Button></div>}</div>;
}

/** Rhythm: tap when the heart reaches the ring. Perfect = 3, good = 1. */
export function HeartGame({ onFinish, disabled }: GameProps) {
  const [run, setRun] = useState(false), [score, setScore] = useState(0), [t0, setT0] = useState(0), [now, setNow] = useState(0), [msg, setMsg] = useState(''), sc = useRef(0), beats = 20, period = 1100;
  useEffect(() => { if (!run) return; let raf = 0; const f = () => { setNow(performance.now()); raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf); }, [run]);
  const elapsed = now - t0, beat = Math.floor(elapsed / period), phase = (elapsed % period) / period;
  const done = useRef(new Set<number>());
  useEffect(() => { if (run && beat >= beats) { setRun(false); onFinish(sc.current); } }, [run, beat]); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = () => { if (!run || done.current.has(beat)) return; done.current.add(beat); const off = Math.abs(phase - .8); const p = off < .06 ? 3 : off < .14 ? 1 : 0; sc.current += p; setScore(sc.current); setMsg(p === 3 ? '¡Perfecto! 💖' : p ? 'Bien 💗' : 'Casi…'); };
  return <div>{run && <div className="mb-2 flex justify-between text-sm"><span>⭐ {score}</span><span>{msg}</span><span>{Math.max(0, beats - beat)} latidos</span></div>}
    <button onPointerDown={tap} className="relative h-56 w-full overflow-hidden rounded-xl bg-secondary/40" aria-label="Tocar al ritmo">
      <span className="absolute left-1/2 top-[80%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary" />
      {run && <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl" style={{ top: `${phase * 100}%` }}>💗</span>}
      {!run && <span className="absolute inset-0 grid place-items-center text-sm">Toca cuando el corazón llegue al círculo</span>}
    </button>
    {!run && <div className="mt-3 text-center"><Button disabled={disabled} onClick={() => { sc.current = 0; done.current = new Set(); setScore(0); setMsg(''); setT0(performance.now()); setRun(true); }}>Empezar ritmo</Button></div>}</div>;
}

/** Reflexes: Appa hides; tap as soon as he pops up. Five rounds, faster = more points. */
export function ReflexGame({ onFinish, disabled }: GameProps) {
  const [round, setRound] = useState(0), [up, setUp] = useState(false), [start, setStart] = useState(0), [total, setTotal] = useState(0), [msg, setMsg] = useState(''), timer = useRef<number | null>(null);
  const arm = () => { setUp(false); timer.current = window.setTimeout(() => { setUp(true); setStart(performance.now()); }, rnd(900, 2600)); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const tap = () => { if (!round) return;
    if (!up) { if (timer.current) clearTimeout(timer.current); setMsg('¡Muy pronto! Espera a Appa.'); arm(); return; }
    const ms = performance.now() - start, pts = Math.max(0, Math.round((700 - ms) / 30)); const t = total + pts; setTotal(t); setMsg(`${Math.round(ms)} ms · +${pts}`);
    if (round >= 5) { setRound(0); setUp(false); onFinish(Math.min(100, t)); } else { setRound(round + 1); arm(); } };
  return <div><button onPointerDown={tap} className="grid h-56 w-full place-items-center rounded-xl bg-secondary/40" aria-label="Tocar cuando aparezca Appa">
    {round ? (up ? <AppaSprite mood="happy" className="w-40 game-pop" /> : <span className="text-5xl">🌷🌷🌷</span>) : <span className="text-sm">Toca apenas Appa salga de las flores</span>}</button>
    <p className="mt-2 text-center text-sm">{round ? `Ronda ${round}/5 · ${total} puntos` : ''} {msg}</p>
    {!round && <div className="mt-2 text-center"><Button disabled={disabled} onClick={() => { setTotal(0); setMsg(''); setRound(1); arm(); }}>Empezar</Button></div>}</div>;
}

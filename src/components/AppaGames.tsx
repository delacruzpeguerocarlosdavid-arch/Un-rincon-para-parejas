import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppaSprite } from '@/components/AppaSprite';

type GameProps = { onFinish: (score: number) => void; disabled: boolean };

/** Clouds pop up everywhere; golden ones are worth 3, quick taps build a combo. */
export function CloudGame({ onFinish, disabled }: GameProps) {
  const [left, setLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [clouds, setClouds] = useState<{ id: number; x: number; y: number; gold: boolean }[]>([]);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; t: string }[]>([]);
  const last = useRef(0); const seq = useRef(0); const scoreRef = useRef(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => { if (left === 1) { setClouds([]); onFinish(scoreRef.current); } setLeft(l => l - 1); }, 1000);
    return () => clearTimeout(t);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setClouds(c => [...c.slice(-4), { id: ++seq.current, x: 5 + Math.random() * 75, y: 5 + Math.random() * 70, gold: Math.random() < 0.15 }]), 650);
    return () => clearInterval(t);
  }, [left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  function tap(c: { id: number; x: number; y: number; gold: boolean }) {
    const now = Date.now(); const nextCombo = now - last.current < 800 ? combo + 1 : 0; last.current = now; setCombo(nextCombo);
    const pts = (c.gold ? 3 : 1) + (nextCombo >= 4 ? 1 : 0);
    scoreRef.current += pts; setScore(scoreRef.current);
    setClouds(cs => cs.filter(x => x.id !== c.id));
    const p = { id: c.id, x: c.x, y: c.y, t: `+${pts}` }; setPops(ps => [...ps, p]); setTimeout(() => setPops(ps => ps.filter(x => x.id !== p.id)), 900);
  }
  if (left === 0) return <Button className="w-full" disabled={disabled} onClick={() => { scoreRef.current = 0; setScore(0); setCombo(0); setLeft(25); }}>{score ? `Otra vez (último: ${score})` : 'Empezar (25 s)'}</Button>;
  return <div>
    <p className="mb-2 flex justify-between text-sm"><span>Puntos: {score}{combo >= 4 ? ' · ¡Combo!' : ''}</span><span>{left}s</span></p>
    <div className="relative h-60 touch-none overflow-hidden rounded-xl bg-accent/40">
      {clouds.map(c => <button key={c.id} aria-label="Atrapar nube" className="absolute animate-in zoom-in text-4xl" style={{ left: `${c.x}%`, top: `${c.y}%`, filter: c.gold ? 'sepia(1) saturate(4) hue-rotate(5deg)' : undefined }} onPointerDown={() => tap(c)}>☁️</button>)}
      {pops.map(p => <span key={p.id} className="float-up pointer-events-none absolute font-bold text-primary" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.t}</span>)}
    </div>
  </div>;
}

/** Drag Appa left and right to catch falling fruit; stars are a bonus. Missing never costs points. */
export function FoodGame({ onFinish, disabled }: GameProps) {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [x, setX] = useState(50);
  const [items, setItems] = useState<{ id: number; x: number; y: number; e: string; v: number; pts: number }[]>([]);
  const [chomp, setChomp] = useState(0);
  const box = useRef<HTMLDivElement>(null); const xRef = useRef(50); const scoreRef = useRef(0); const seq = useRef(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0, prev = performance.now(), spawn = 0, started = prev;
    const loop = (now: number) => {
      const dt = (now - prev) / 1000; prev = now; spawn -= dt;
      const elapsed = (now - started) / 1000;
      setTime(Math.max(0, Math.ceil(30 - elapsed)));
      setItems(list => {
        let next = list.map(i => ({ ...i, y: i.y + i.v * dt }));
        if (spawn <= 0) { spawn = Math.max(0.35, 0.9 - elapsed / 60); const star = Math.random() < 0.12; next.push({ id: ++seq.current, x: 5 + Math.random() * 90, y: -5, e: star ? '⭐' : ['🍎', '🥕', '🍓', '🍰'][Math.floor(Math.random() * 4)]!, v: 28 + elapsed * 1.2 + Math.random() * 10, pts: star ? 3 : 1 }); }
        next = next.filter(i => {
          if (i.y > 78 && i.y < 92 && Math.abs(i.x - xRef.current) < 12) { scoreRef.current += i.pts; setScore(scoreRef.current); setChomp(c => c + 1); return false; }
          return i.y < 105;
        });
        return next;
      });
      if (elapsed >= 30) { setRunning(false); setItems([]); onFinish(scoreRef.current); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  function move(clientX: number) { const r = box.current?.getBoundingClientRect(); if (!r) return; const v = Math.max(8, Math.min(92, ((clientX - r.left) / r.width) * 100)); xRef.current = v; setX(v); }
  if (!running) return <Button className="w-full" disabled={disabled} onClick={() => { scoreRef.current = 0; setScore(0); setTime(30); setRunning(true); }}>{score ? `Otra vez (último: ${score})` : 'Empezar (30 s)'}</Button>;
  return <div>
    <p className="mb-2 flex justify-between text-sm"><span>Atrapadas: {score}</span><span>{time}s</span></p>
    <div ref={box} className="relative h-72 touch-none select-none overflow-hidden rounded-xl bg-accent/40" onPointerMove={e => move(e.clientX)} onPointerDown={e => move(e.clientX)}>
      {items.map(i => <span key={i.id} className="pointer-events-none absolute -translate-x-1/2 text-3xl" style={{ left: `${i.x}%`, top: `${i.y}%` }}>{i.e}</span>)}
      <div key={chomp} className="appa-chomp pointer-events-none absolute bottom-1 w-20 -translate-x-1/2" style={{ left: `${x}%` }}><AppaSprite mood={chomp ? 'eating' : 'happy'} /></div>
    </div>
    <p className="mt-1 text-center text-[11px] text-muted-foreground">Desliza el dedo para mover a Appa.</p>
  </div>;
}

const icons = ['🏹', '🌷', '💗', '🌙', '✨', '☁️'];
const shuffle = () => [...icons, ...icons].map(v => ({ v, k: Math.random() })).sort((a, b) => a.k - b.k).map(x => x.v);
export function MemoryGame({ onFinish, disabled }: GameProps) {
  const [cards, setCards] = useState<string[] | null>(null);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  function flip(i: number) {
    if (!cards || open.length === 2 || open.includes(i) || found.includes(i)) return;
    const next = [...open, i]; setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1; setMoves(m);
    const [a, b] = next as [number, number];
    setTimeout(() => {
      if (cards[a] === cards[b]) {
        const f = [...found, a, b]; setFound(f);
        if (f.length === cards.length) { onFinish(Math.max(6, 30 - (m - 6) * 2)); setCards(null); setFound([]); }
      }
      setOpen([]);
    }, 600);
  }
  if (!cards) return <Button className="w-full" disabled={disabled} onClick={() => { setCards(shuffle()); setMoves(0); }}>Empezar</Button>;
  return <div>
    <p className="mb-2 text-sm">Intentos: {moves}</p>
    <div className="grid grid-cols-4 gap-2">{cards.map((c, i) => { const shown = open.includes(i) || found.includes(i); return <button key={i} onClick={() => flip(i)} className={`aspect-square rounded-xl text-2xl shadow-sm transition-transform duration-300 ${shown ? 'bg-card [transform:rotateY(0)]' : 'bg-primary/30 [transform:rotateY(180deg)]'} ${found.includes(i) ? 'appa-wiggle' : ''}`} aria-label="Carta">{shown ? c : '🤍'}</button>; })}</div>
  </div>;
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { WordQuiz } from '@/components/WordQuiz';
import { wordOptions, lineCells, foundCells, levelVerse, WORD_LEVELS } from '@/lib/completion';

const pretty = (w: string) => ({ CARINO: 'CARIÑO', SUENOS: 'SUEÑOS', MANANA: 'MAÑANA', SENOR: 'SEÑOR' } as Record<string, string>)[w] ?? w;

export function WordSearch() {
  const q = useQuery(wordOptions), qc = useQueryClient();
  const [start, setStart] = useState<number | null>(null), [end, setEnd] = useState<number | null>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [quiz, setQuiz] = useState<{ level: number; words: string[] } | null>(null);
  if (!q.data) return <p role="status">{q.error ? 'No pudimos cargar el tablero.' : 'Preparando el tablero…'}{q.error && <Button onClick={() => q.refetch()}>Reintentar</Button>}</p>;
  const { board, found: words } = q.data;
  if (board.finished || !board.grid || !board.words || !board.size) return <section className="mt-4 border-t border-border pt-4 text-center"><h2 className="text-2xl">Palabras de nosotros</h2><p className="mt-2 font-serif text-xl text-primary">🤍 Completaron los {WORD_LEVELS} niveles juntos.</p></section>;
  if (quiz) return <WordQuiz level={quiz.level} words={quiz.words} onClose={() => { setQuiz(null); setNotice(''); }} />;
  const size = board.size, grid = board.grid, verse = levelVerse(board.level);
  const found = foundCells(grid, words), selected = start !== null && end !== null ? lineCells(start, end, size) : [];
  async function submit(a: number, b: number) {
    setBusy(true); setNotice('');
    try {
      const r = await supabase.rpc('find_level_word', { p_level: board.level, p_start: a, p_end: b }); if (r.error) throw r.error;
      const reward = r.data as { word: string; coins: number; exp: number; completed: boolean };
      setNotice(reward.completed ? `🎉 ¡Nivel ${board.level} completo! +${reward.coins} monedas · +${reward.exp} EXP. Responde el repaso.` : `${pretty(reward.word)} · +${reward.coins} moneda · +${reward.exp} EXP`);
      if (reward.completed) setQuiz({ level: board.level, words: board.words! });
      await Promise.all([qc.invalidateQueries({ queryKey: ['word-board'] }), qc.invalidateQueries({ queryKey: ['appa'] })]);
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Selecciona una palabra del tablero.'); }
    finally { setBusy(false); setStart(null); setEnd(null); }
  }
  return <section className="mt-4 border-t border-border pt-4">
    <div className="mb-1 flex items-center justify-between"><h2 className="text-2xl">Palabras de nosotros</h2><span className="text-sm tabular-nums">Nivel {board.level}/{WORD_LEVELS} · {words.length}/{board.words.length}</span></div>
    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${(board.level - 1) / WORD_LEVELS * 100}%` }} /></div>
    <figure className="mb-3 border-l-2 border-primary/40 pl-3"><blockquote className="font-serif text-lg leading-snug">{verse.text}</blockquote><figcaption className="mt-1 text-xs text-primary">{verse.reference} · Reina-Valera 1909</figcaption></figure>
    <div className="grid touch-none select-none gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} aria-label="Sopa de letras" onPointerMove={e => { if (start === null) return; const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]'); const n = el?.getAttribute('data-cell'); if (n !== null && n !== undefined) setEnd(Number(n)); }} onPointerUp={() => { if (start !== null && end !== null && start !== end) void submit(start, end); }} onPointerCancel={() => { setStart(null); setEnd(null); }}>
      {grid.flat().map((letter, i) => <Button key={i} data-cell={i} variant={found.includes(i) ? 'secondary' : selected.includes(i) ? 'default' : 'outline'} disabled={busy} className="aspect-square h-auto min-w-0 rounded-md p-0 text-sm sm:text-base" aria-label={`Fila ${Math.floor(i / size) + 1}, columna ${i % size + 1}: ${letter}`} onPointerDown={e => { e.preventDefault(); setStart(i); setEnd(i); }} onClick={e => { if (e.detail !== 0) return; if (start === null) { setStart(i); setEnd(i); } else void submit(start, i); }}>{letter}</Button>)}
    </div>
    {board.level > 1 && <Button size="sm" variant="ghost" className="mt-2" onClick={async () => { const r = await supabase.from('word_level_boards').select('words').eq('level', board.level - 1).maybeSingle(); if (r.data) setQuiz({ level: board.level - 1, words: r.data.words }); }}>Repasar nivel {board.level - 1}</Button>}
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">{board.words.map(w => <li key={w} className={words.includes(w) ? 'text-primary line-through' : ''}>{pretty(w)}</li>)}</ul>
    <p className="mt-1 text-xs text-muted-foreground">Cada palabra: +1 moneda · +10 EXP. Nivel completo: +5 monedas · +50 EXP.</p>
    <p role="status" className="mt-2 min-h-5 text-sm">{notice}</p>
  </section>;
}

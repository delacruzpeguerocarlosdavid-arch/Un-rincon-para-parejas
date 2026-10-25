import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import engine from '@/vendor/wordfind.js';
import { verses } from '@/lib/bible-verses';

export const santoDomingoInstant = (value: string) => new Date(`${value}:00-04:00`).toISOString();
export function countdown(opensAt: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(opensAt).getTime() - now) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
}
export function lineCells(start: number, end: number, size = 8) {
  const x = start % size, y = Math.floor(start / size), dx = end % size - x, dy = Math.floor(end / size) - y;
  if (dx && dy && Math.abs(dx) !== Math.abs(dy)) return [];
  return Array.from({ length: Math.max(Math.abs(dx), Math.abs(dy)) + 1 }, (_, i) => (y + Math.sign(dy) * i) * size + x + Math.sign(dx) * i);
}
export function foundCells(grid: string[][], words: string[]) {
  return engine.wordfind.solve(grid, words).found.flatMap(f => {
    const direction = engine.wordfind.orientations[f.orientation];
    if (!direction) return [];
    return [...f.word].map((_, i) => { const p = direction(f.x, f.y, i); return p.y * grid.length + p.x; });
  });
}
export const capsuleOptions = queryOptions({ queryKey: ['capsules'], queryFn: async () => {
  const r = await supabase.from('time_capsules').select('*').order('opens_at'); if (r.error) throw r.error; return r.data;
}, refetchInterval: 30_000 });
export const WORD_LEVELS = 100;
export type WordLevel = { finished: boolean; level: number; size?: number; grid?: string[][]; words?: string[] };
/** Each level studies one catalog verse, in order, cycling after the 90 verses. */
export const levelVerse = (level: number) => verses[(level - 1) % verses.length]!;
export const wordOptions = queryOptions({ queryKey: ['word-board'], queryFn: async () => {
  const b = await supabase.rpc('get_word_level'); if (b.error) throw b.error;
  const board = b.data as WordLevel;
  const f = await supabase.from('word_level_finds').select('word').eq('level', board.level); if (f.error) throw f.error;
  return { board, found: (f.data ?? []).map(x => x.word) };
}, refetchInterval: 30_000 });
export async function deliverFile(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if ((e as DOMException).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export const blobData = (blob: Blob): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Foto no válida')); reader.onerror = () => reject(new Error('No pudimos leer la foto')); reader.readAsDataURL(blob); });
export async function prepareBackup() {
  const r = await supabase.rpc('export_space_copy'); if (r.error) throw r.error;
  const copy = r.data as { [key: string]: unknown; memories?: { photo_path?: string; photo_data?: string }[] };
  for (const memory of copy.memories ?? []) {
    if (!memory.photo_path) continue;
    const p = await supabase.storage.from('memories').download(memory.photo_path);
    if (p.error || !p.data) throw new Error('No pudimos incluir todas las fotos. Intenta preparar la copia de nuevo.');
    memory.photo_data = await blobData(p.data);
  }
  return new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json;charset=utf-8' });
}
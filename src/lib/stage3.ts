import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Memory = Tables<'memories'>;
export type Entry = Tables<'journal_entries'>;
export type SpecialDate = Tables<'special_dates'>;
export type Comment = Tables<'item_comments'>;
export type Reaction = Tables<'item_reactions'>;
export type ItemType = 'memory' | 'journal' | 'date';

export const emojis = ['❤️', '🥰', '😂', '🙏', '😢', '✨'] as const;
export const dateCategories = ['cumpleaños', 'aniversario', 'recuerdo', 'personalizada'] as const;
export const reminderOptions = [null, 0, 1, 3, 7, 14, 30] as const;
export const ARCHIVE_DAYS = 30;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const DAY = 86_400_000;
const parse = (d: string) => { const [y = 0, m = 1, dd = 1] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd); };
export function dominicanToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
/** Next date (YYYY-MM-DD) on or after today; yearly dates roll forward, Feb 29 falls back to Feb 28. */
export function nextOccurrence(date: string, yearly: boolean, today: string) {
  if (!yearly) return date;
  const [, m = 1, d = 1] = date.split('-').map(Number);
  let y = Number(today.slice(0, 4));
  const build = (yy: number) => { const leap = (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0; const day = m === 2 && d === 29 && !leap ? 28 : d; return `${yy}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`; };
  if (build(y) < today) y += 1;
  return build(y);
}
export const daysBetween = (from: string, to: string) => Math.round((parse(to) - parse(from)) / DAY);
export function reminderDue(item: Pick<SpecialDate, 'event_date' | 'repeats_yearly' | 'reminder_days'>, today: string) {
  if (item.reminder_days === null) return false;
  const left = daysBetween(today, nextOccurrence(item.event_date, item.repeats_yearly, today));
  return left >= 0 && left <= item.reminder_days;
}
/** Days left before an archived item is removed for good (0 = expires today or later removal pending). */
export function archiveDaysLeft(archivedAt: string, now = new Date()) {
  return Math.max(0, ARCHIVE_DAYS - Math.floor((now.getTime() - new Date(archivedAt).getTime()) / DAY));
}
export function validateImage(file: { type: string; size: number }) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Usa una foto JPG, PNG o WebP.';
  if (file.size > MAX_UPLOAD_BYTES) return 'La foto pesa más de 15 MB.';
  return null;
}
export async function compressImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((ok, fail) => canvas.toBlob(b => (b ? ok(b) : fail(new Error('No pudimos preparar la foto.'))), 'image/jpeg', quality));
}
export function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim(); }
export function matches(fields: string[], search: string) { const q = normalize(search); return !q || normalize(fields.join(' ')).includes(q); }
export function formatDay(day: string) { return new Date(parse(day)).toLocaleDateString('es-DO', { timeZone: 'UTC', dateStyle: 'long' }); }

async function all<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>) { const r = await p; if (r.error) throw r.error; return r.data ?? []; }
export const stage3Options = queryOptions({
  queryKey: ['stage3'],
  queryFn: async () => {
    const [memories, entries, dates, comments, reactions, profiles] = await Promise.all([
      all(supabase.from('memories').select('*').order('memory_date', { ascending: false })),
      all(supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false })),
      all(supabase.from('special_dates').select('*').order('event_date')),
      all(supabase.from('item_comments').select('*').order('created_at')),
      all(supabase.from('item_reactions').select('*')),
      all(supabase.from('profiles').select('id,display_name,nickname,avatar')),
    ]);
    const paths = memories.map(m => m.photo_path);
    const urls: Record<string, string> = {};
    if (paths.length) {
      const { data } = await supabase.storage.from('memories').createSignedUrls(paths, 3600);
      for (const s of data ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    }
    return { memories, entries, dates, comments, reactions, profiles, urls };
  },
  staleTime: 30 * 60_000,
});

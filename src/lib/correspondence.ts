import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export const folders = ['Amor', 'Cuando estés feliz', 'Cuando estés triste', 'Cuando estés enojada', 'Después de una discusión', 'Cuando sientas que no te escucho', 'Cuando tengas miedo', 'Cuando me extrañes', 'Cuando necesites tranquilidad', 'Cuando necesites esperanza', 'Tu tiempo con Dios'] as const;
export type LetterTheme = 'classic' | 'l_investigation';
export type Text = Tables<'correspondence'> & { theme?: LetterTheme | null; scheduled_at?: string | null };
export type Kind = 'chat' | 'note' | 'letter' | 'library';
export const WELCOME_TITLE = 'Bienvenida, Mimie';
export function welcomeText(texts: Text[], adminId: string | undefined) {
  if (!adminId) return undefined;
  return texts.find(t => t.author_id === adminId && t.kind === 'library' && t.folder === 'Amor' && t.title === WELCOME_TITLE);
}
export const correspondenceOptions = queryOptions({
  queryKey: ['correspondence'],
  queryFn: async () => {
    const [texts, reads, favorites, profiles] = await Promise.all([
      supabase.from('correspondence').select('*').order('created_at', { ascending: true }),
      supabase.from('correspondence_reads').select('*'),
      supabase.from('word_favorites').select('*'),
      supabase.from('profiles').select('id,display_name,nickname,avatar'),
    ]);
    for (const result of [texts, reads, favorites, profiles]) if (result.error) throw result.error;
    return { texts: texts.data ?? [], reads: reads.data ?? [], favorites: favorites.data ?? [], profiles: profiles.data ?? [] };
  },
});
export const canEditText = (text: Pick<Text, 'author_id' | 'kind'>, userId: string) => text.kind === 'library' && text.author_id === userId;
export const canFavoriteText = (text: Pick<Text, 'author_id' | 'kind'>, userId: string) => text.kind === 'library' && text.author_id !== userId;
export function searchTexts(texts: Text[], search: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const query = normalize(search);
  return texts.filter(text => normalize(`${text.title} ${text.content}`).includes(query));
}
export function formatDate(value: string) {
  return new Date(value).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium', timeStyle: 'short' });
}
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dominicanDate } from '@/lib/message-bank';
import type { Text } from '@/lib/correspondence';

export const emotions = [
  { id: 'feliz', face: '😊', label: 'Feliz', phrase: 'feliz', folder: 'Cuando estés feliz' },
  { id: 'en_paz', face: '🤍', label: 'En paz', phrase: 'en paz', folder: 'Cuando necesites tranquilidad' },
  { id: 'triste', face: '😢', label: 'Triste', phrase: 'triste', folder: 'Cuando estés triste' },
  { id: 'cansada', face: '😴', label: 'Cansancio', phrase: 'con cansancio', folder: 'Cuando necesites tranquilidad' },
  { id: 'enamorada', face: '🥰', label: 'Amor', phrase: 'con amor', folder: 'Amor' },
  { id: 'agradecida', face: '🙏', label: 'Gratitud', phrase: 'con gratitud', folder: 'Tu tiempo con Dios' },
  { id: 'enojada', face: '😠', label: 'Enojo', phrase: 'con enojo', folder: 'Cuando estés enojada' },
  { id: 'discusion', face: '🫂', label: 'Tras discutir', phrase: 'después de una discusión', folder: 'Después de una discusión' },
  { id: 'no_escuchada', face: '💬', label: 'Sin ser escuchado/a', phrase: 'sin sentirse escuchado/a', folder: 'Cuando sientas que no te escucho' },
] as const;
export const momentFolders = ['Cuando estés feliz', 'Cuando estés triste', 'Cuando estés enojada', 'Después de una discusión', 'Cuando sientas que no te escucho'] as const;
export const emotionFor = (id: string) => emotions.find(e => e.id === id);
export const feelingSpaces = [
  { id: 'amor', label: 'Amor', face: '🥰', folder: 'Amor' },
  { id: 'tristeza', label: 'Tristeza', face: '😢', folder: 'Cuando estés triste' },
  { id: 'enojo', label: 'Enojo', face: '🫂', folder: 'Cuando estés enojada' },
  { id: 'fe', label: 'Fe', face: '🙏', folder: 'Tu tiempo con Dios' },
  { id: 'libre', label: 'Escribir libremente', face: '✍️', folder: null },
] as const;
export function partnerWords(texts: Text[], userId: string, folder: string) {
  return texts.filter(t => t.kind === 'library' && t.author_id !== userId && t.folder === folder);
}
export const emotionsOptions = queryOptions({
  queryKey: ['emotions'],
  queryFn: async () => {
    const { data, error } = await supabase.from('daily_emotions').select('*').eq('day', dominicanDate()).order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  refetchInterval: 30_000,
  staleTime: 0,
});
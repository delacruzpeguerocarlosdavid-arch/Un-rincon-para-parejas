import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RitualKey = 'sun' | 'water' | 'prune' | 'feed' | 'bath' | 'love';
export type RitualStatus = Record<RitualKey | 'claimed', boolean> & { day: string };
export const RITUAL_REWARD = { coins: 5, exp: 50 };
export const ritualTasks: { key: RitualKey; label: string; to: '/lirio' | '/appa'; icon: string }[] = [
  { key: 'sun', label: 'Darle sol al lirio', to: '/lirio', icon: '☀️' },
  { key: 'water', label: 'Cambiarle el agua', to: '/lirio', icon: '💧' },
  { key: 'prune', label: 'Cortar sus hojas secas', to: '/lirio', icon: '✂️' },
  { key: 'feed', label: 'Darle de comer a Appa', to: '/appa', icon: '🍎' },
  { key: 'bath', label: 'Bañar a Appa', to: '/appa', icon: '🫧' },
  { key: 'love', label: 'Acariciar o abrazar a Appa', to: '/appa', icon: '💗' },
];

/** Consecutive completed days ending today (or yesterday if today isn't done yet). */
export function ritualStreak(days: string[], today: string) {
  const set = new Set(days); const d = new Date(`${today}T12:00:00Z`);
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0; while (set.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

export const ritualOptions = queryOptions({
  queryKey: ['ritual'],
  queryFn: async () => {
    const [s, r] = await Promise.all([supabase.rpc('daily_care_status'), supabase.from('care_rituals').select('day')]);
    if (s.error) throw s.error; if (r.error) throw r.error;
    return { status: s.data as unknown as RitualStatus, days: (r.data ?? []).map(x => x.day) };
  },
  refetchInterval: 60000,
});

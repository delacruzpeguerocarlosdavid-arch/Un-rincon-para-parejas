import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { daysBetween } from '@/lib/stage3';

export type SpiritualItem = Tables<'spiritual_items'>;
export type Checkin = Tables<'spiritual_checkins'>;
export const spiritualKinds = [
  { id: 'prayer', label: 'Oraciones y adoraciones' },
  { id: 'petition', label: 'Peticiones' },
  { id: 'reading', label: 'Lecturas' },
] as const;
export type SpiritualKind = (typeof spiritualKinds)[number]['id'];

/**
 * Gentle streak: counts days on which either of us had a moment with God.
 * One missed day in between never breaks it; two missed days in a row do.
 */
export function softStreak(days: string[], today: string) {
  const sorted = [...new Set(days)].filter(d => d <= today).sort().reverse();
  const first = sorted[0];
  if (!first || daysBetween(first, today) > 2) return 0;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i], previous = sorted[i - 1];
    if (!current || !previous || daysBetween(current, previous) > 2) break;
    count++;
  }
  return count;
}

export const spiritualOptions = queryOptions({
  queryKey: ['spiritual'],
  queryFn: async () => {
    const [items, checks] = await Promise.all([
      supabase.from('spiritual_items').select('*').order('created_at', { ascending: false }),
      supabase.from('spiritual_checkins').select('*').order('day', { ascending: false }).limit(400),
    ]);
    if (items.error) throw items.error;
    if (checks.error) throw checks.error;
    return { items: items.data, checkins: checks.data };
  },
});

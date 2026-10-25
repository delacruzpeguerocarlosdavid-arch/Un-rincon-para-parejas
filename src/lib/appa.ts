import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type AppaInteraction = Tables<'appa_interactions'>;
export type AppaPurchase = Tables<'appa_purchases'>;
export type AppaGame = Tables<'appa_game_results'>;
/** Coins per action; each person earns each action once per Dominican day (mirrors appa_interact). */
export const appaActions = [
  { id: 'pet', label: 'Acariciar', emoji: '🤍', coins: 1, reply: 'Appa cierra los ojitos, feliz.' },
  { id: 'feed', label: 'Darle de comer', emoji: '🍎', coins: 2, reply: '¡Ñam! Appa mueve la cola esponjosa.' },
  { id: 'play', label: 'Jugar', emoji: '☁️', coins: 3, reply: 'Appa da una vuelta entre las nubes.' },
  { id: 'hug', label: 'Abrazar', emoji: '🫂', coins: 2, reply: 'Appa te devuelve un abrazo enorme.' },
] as const;
export type AppaAction = (typeof appaActions)[number]['id'];
/** Food store (mirrors appa_buy_food). */
export const appaFoods = [
  { id: 'manzana', label: 'Manzana', emoji: '🍎', cost: 3, exp: 15 },
  { id: 'zanahoria', label: 'Zanahoria', emoji: '🥕', cost: 5, exp: 30 },
  { id: 'pastel_nubes', label: 'Pastel de nubes', emoji: '🍰', cost: 10, exp: 70 },
  { id: 'banquete', label: 'Banquete', emoji: '🍱', cost: 20, exp: 160 },
] as const;
export const INTERACTION_EXP_PER_COIN = 10;
/** Mirrors appa_finish_game: once per game per person per day. */
export const gameReward = (score: number) => { const s = Math.max(0, Math.min(100, Math.floor(score))); return { coins: Math.min(5, Math.floor(s / 3)), exp: Math.min(50, s * 2) }; };

export const totalCoins = (rows: Pick<AppaInteraction, 'coins'>[]) => rows.reduce((n, r) => n + r.coins, 0);
export function coinBalance(d: { interactions: { coins: number }[]; games: { coins: number }[]; purchases: { cost: number }[]; baths?: { coins: number }[]; furniture?: { cost: number }[]; words?: { coins: number }[]; rituals?: { coins: number }[]; outfits?: { cost: number }[] }) {
  return totalCoins(d.interactions) + totalCoins(d.games) + totalCoins(d.baths ?? []) + totalCoins(d.words ?? []) + totalCoins(d.rituals ?? []) - d.purchases.reduce((n, p) => n + p.cost, 0) - (d.furniture ?? []).reduce((n, p) => n + p.cost, 0) - (d.outfits ?? []).reduce((n, p) => n + p.cost, 0);
}
export function totalExp(d: { interactions: { coins: number }[]; games: { exp: number }[]; purchases: { exp: number }[]; baths?: { exp: number }[]; words?: { exp: number }[]; rituals?: { exp: number }[] }) {
  return totalCoins(d.interactions) * INTERACTION_EXP_PER_COIN + d.games.reduce((n, g) => n + g.exp, 0) + d.purchases.reduce((n, p) => n + p.exp, 0) + (d.baths ?? []).reduce((n, p) => n + p.exp, 0) + (d.words ?? []).reduce((n, p) => n + p.exp, 0) + (d.rituals ?? []).reduce((n, p) => n + p.exp, 0);
}
/** Level L starts at 50·L·(L−1) EXP: 1→0, 2→100, 3→300, 4→600… */
export function levelFor(exp: number) {
  let level = 1;
  while (50 * (level + 1) * level <= exp) level++;
  const start = 50 * level * (level - 1), next = 50 * (level + 1) * level;
  return { level, into: exp - start, needed: next - start };
}

/** Mood from today's shared care: 8 possible interactions (4 each). */
export function appaMood(todayCount: number) {
  if (todayCount >= 6) return { face: '🥰', text: 'Appa está feliz y muy querido' };
  if (todayCount >= 3) return { face: '😊', text: 'Appa está contento' };
  if (todayCount >= 1) return { face: '🙂', text: 'Appa quiere más cariño' };
  return { face: '🥺', text: 'Appa los extraña' };
}

export const appaOptions = queryOptions({
  queryKey: ['appa'],
  queryFn: async () => {
    const [i, p, g, st, b, f, w, wl, wc, r, o, notes] = await Promise.all([
      supabase.from('appa_interactions').select('*'),
      supabase.from('appa_purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('appa_game_results').select('*'),
      supabase.from('appa_state').select('*').maybeSingle(),
      supabase.from('appa_bath_rewards').select('*'),
      supabase.from('appa_furniture').select('*'),
      supabase.from('word_finds').select('*'),
      supabase.from('word_level_finds').select('coins,exp'),
      supabase.from('word_level_completions').select('coins,exp'),
      supabase.from('care_rituals').select('*'),
      supabase.from('appa_outfits').select('*'),
      supabase.from('appa_house_notes').select('*').order('created_at', { ascending: false }),
    ]);
    for (const x of [i, p, g, st, b, f, w, wl, wc, r, o, notes]) if (x.error) throw x.error;
    return {
      interactions: i.data ?? [],
      purchases: p.data ?? [],
      games: g.data ?? [],
      state: st.data,
      baths: b.data ?? [],
      furniture: f.data ?? [],
      words: [...(w.data ?? []), ...(wl.data ?? []), ...(wc.data ?? [])],
      rituals: r.data ?? [],
      outfits: o.data ?? [],
      notes: notes.data ?? [],
    };
  },
});

export type AppaStats = { hunger: number; happiness: number; energy: number; sleeping: boolean };
export const FOOD_HUNGER: Record<string, number> = { manzana: 15, zanahoria: 25, pastel_nubes: 45, banquete: 80 };
/** Mirrors appa_care decay per hour; never below 10 (no harsh punishments). */
export function decayStats(s: { hunger: number; happiness: number; energy: number; sleeping_since: string | null; updated_at: string } | null | undefined, now = new Date()): AppaStats {
  if (!s) return { hunger: 70, happiness: 70, energy: 70, sleeping: false };
  const h = Math.max(0, (now.getTime() - new Date(s.updated_at).getTime()) / 3_600_000);
  const sleeping = Boolean(s.sleeping_since);
  const clamp = (v: number) => Math.round(Math.max(10, Math.min(100, v)));
  return sleeping
    ? { hunger: clamp(s.hunger - 2 * h), happiness: clamp(s.happiness - h), energy: clamp(s.energy + 15 * h), sleeping }
    : { hunger: clamp(s.hunger - 4 * h), happiness: clamp(s.happiness - 3 * h), energy: clamp(s.energy - 2 * h), sleeping };
}
export function appaLook(s: AppaStats) {
  if (s.sleeping) return { pose: 'sleep', face: '😴', text: 'Appa está durmiendo' } as const;
  if (s.hunger < 35) return { pose: 'hungry', face: '🥺', text: 'Appa tiene hambre' } as const;
  if (s.energy < 30) return { pose: 'tired', face: '🥱', text: 'Appa está cansado' } as const;
  if (s.happiness >= 70) return { pose: 'happy', face: '🥰', text: 'Appa está feliz' } as const;
  return { pose: 'idle', face: '🙂', text: 'Appa quiere cariño' } as const;
}

export const outfitCatalog = [
  { id: 'corona_margaritas', name: 'Corona de margaritas', emoji: '🌼', cost: 6, category: 'cabeza' },
  { id: 'corona_lirios', name: 'Corona de lirios rosas', emoji: '🌸', cost: 8, category: 'cabeza' },
  { id: 'sombrero_paja', name: 'Sombrero de paja de campo', emoji: '👒', cost: 8, category: 'cabeza' },
  { id: 'gorro_dormir', name: 'Gorrito de dormir con pompón', emoji: '💤', cost: 6, category: 'cabeza' },
  { id: 'corona', name: 'Corona real dorada', emoji: '👑', cost: 15, category: 'cabeza' },
  { id: 'gorro', name: 'Gorra deportiva casual', emoji: '🧢', cost: 7, category: 'cabeza' },
  { id: 'mago', name: 'Sombrero de mago', emoji: '🎩', cost: 18, category: 'cabeza' },
  { id: 'gafas_corazon', name: 'Gafas de amor en corazón', emoji: '💖', cost: 10, category: 'cara' },
  { id: 'gafas', name: 'Gafas de sol oscuras', emoji: '🕶️', cost: 10, category: 'cara' },
  { id: 'gafas_estudio', name: 'Lentes redondos de estudio', emoji: '👓', cost: 9, category: 'cara' },
  { id: 'curita', name: 'Curita tierna en la mejilla', emoji: '🩹', cost: 4, category: 'cara' },
  { id: 'lazo', name: 'Lazo de seda rosa', emoji: '🎀', cost: 6, category: 'cuerpo' },
  { id: 'pajarita', name: 'Corbatín de gala para citas', emoji: '🤵', cost: 12, category: 'cuerpo' },
  { id: 'bufanda', name: 'Bufanda calentita', emoji: '🧣', cost: 12, category: 'cuerpo' },
  { id: 'mochila', name: 'Mochilita de explorador', emoji: '🎒', cost: 14, category: 'cuerpo' },
  { id: 'capa', name: 'Capa de héroe alada', emoji: '🦸', cost: 16, category: 'cuerpo' },
  { id: 'patito', name: 'Flotador de patito de baño', emoji: '🦆', cost: 11, category: 'cuerpo' },
  { id: 'aureola', name: 'Aureola de angelito', emoji: '😇', cost: 20, category: 'aura' },
  { id: 'aura_estrellas', name: 'Aura de polvo de estrellas', emoji: '✨', cost: 22, category: 'aura' },
  { id: 'aura_mariposas', name: 'Mariposas revoloteando', emoji: '🦋', cost: 25, category: 'aura' },
] as const;

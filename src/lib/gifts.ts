import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type CoupleGift = Tables<'couple_gifts'>;

export type GiftDefinition = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  emoji: string;
  tone: string;
  tag: string;
};

export const LEVI_GIFT_CATALOG: GiftDefinition[] = [
  {
    id: 'levi_tea',
    name: 'Té negro imperial',
    subtitle: 'La infusión favorita de Levi',
    description: 'Hojas selectas de té negro servidas en una taza de porcelana blanca impecable. Sereno, aromático y reconfortante.',
    emoji: '☕',
    tone: 'obsidian',
    tag: 'Clásico',
  },
  {
    id: 'levi_cravat',
    name: 'Pañuelo de seda inmaculado',
    subtitle: 'El distintivo de elegancia y disciplina',
    description: 'Seda blanca pura doblada con precisión geométrica. Representa pulcritud, cuidado y nobleza.',
    emoji: '🧣',
    tone: 'silver',
    tag: 'Elegancia',
  },
  {
    id: 'wings_brooch',
    name: 'Broche de las Alas de la Libertad',
    subtitle: 'Símbolo de devoción y coraje',
    description: 'Insignia forjada en plata con plumas azul y blanco entrelazadas. Una promesa de libertad y lealtad inquebrantable.',
    emoji: '🕊️',
    tone: 'emerald',
    tag: 'Exclusivo',
  },
  {
    id: 'preserved_lilies',
    name: 'Lirios blancos eternos',
    subtitle: 'Pureza que no se marchita',
    description: 'Flores de lirio preservadas bajo cristal con la devoción más solemne. Un recordatorio constante de nuestro amor.',
    emoji: '💐',
    tone: 'silver',
    tag: 'Romance',
  },
  {
    id: 'fountain_pen',
    name: 'Pluma estilográfica de ébano',
    subtitle: 'Para palabras que perduran',
    description: 'Madera de ébano pulida y plumilla plateada. Diseñada para plasmar pensamientos firmes, sinceros y profundos.',
    emoji: '✒️',
    tone: 'obsidian',
    tag: 'Escritura',
  },
  {
    id: 'scout_cape',
    name: 'Capa verde de expedición',
    subtitle: 'Abrigo especial para Appa',
    description: 'Tejido verde esmeralda con el emblema bordado. Appa lucirá orgulloso y abrigado en casa.',
    emoji: '🧥',
    tone: 'emerald',
    tag: 'Para Appa',
  },
  {
    id: 'tea_table_set',
    name: 'Juego de té de porcelana',
    subtitle: 'Decoración distinguida para la sala',
    description: 'Tetera y tazas finas para ubicar en la mesita de Appa. Un rincón sobrio donde compartir una pausa tranquila.',
    emoji: '🫖',
    tone: 'obsidian',
    tag: 'Para el Hogar',
  },
];

export const giftsOptions = queryOptions({
  queryKey: ['gifts'],
  queryFn: async () => {
    const [gifts, profiles] = await Promise.all([
      supabase.from('couple_gifts').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,display_name,nickname,avatar'),
    ]);
    if (gifts.error) throw gifts.error;
    if (profiles.error) throw profiles.error;
    return {
      gifts: gifts.data ?? [],
      profiles: profiles.data ?? [],
    };
  },
});

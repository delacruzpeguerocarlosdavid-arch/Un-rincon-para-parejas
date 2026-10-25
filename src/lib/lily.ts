import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LilyNeed = 'sun' | 'water' | 'prune' | 'feed' | 'pests' | 'drain';
export type LilyAction = LilyNeed | 'song';

/** Horas estimadas para que cada necesidad baje; nunca cae por debajo de 15% (cuidado sin castigos). */
export const LILY_HOURS: Record<LilyNeed, number> = {
  sun: 16,
  water: 26,
  prune: 32,
  feed: 48,
  pests: 38,
  drain: 36,
};

export type LilyPlantData = {
  space_id: string;
  sun_at: string;
  water_at: string;
  prune_at: string;
  feed_at: string;
  pests_at: string;
  song_at: string | null;
  drain_at?: string;
  care_count: number;
  last_by: string | null;
  updated_at: string;
};

export function needLevel(at: string | null | undefined, action: LilyNeed, now = Date.now()): number {
  if (!at) return 100;
  const hours = Math.max(0, (now - new Date(at).getTime()) / 3_600_000);
  return Math.max(15, Math.round(100 - (hours / LILY_HOURS[action]) * 85));
}

/**
 * Humedad del sustrato calculada por interconexión:
 * - Regar satura la tierra (~95%).
 * - El sol y el drenaje la van evaporando de forma equilibrada hacia un balance óptimo.
 */
export function calculateSoilMoisture(plant: LilyPlantData | null | undefined, now = Date.now()): number {
  if (!plant) return 70;
  const hoursSinceWater = Math.max(0, (now - new Date(plant.water_at).getTime()) / 3_600_000);
  const hoursSinceSun = Math.max(0, (now - new Date(plant.sun_at).getTime()) / 3_600_000);
  const hoursSinceDrain = Math.max(0, (now - new Date(plant.drain_at ?? plant.prune_at).getTime()) / 3_600_000);

  // El sol y drenaje recientes ayudan a secar el exceso
  const evaporationRate = 1.8 + (hoursSinceSun < 8 ? 0.8 : 0) + (hoursSinceDrain < 12 ? 0.6 : 0);
  const rawMoisture = 95 - hoursSinceWater * evaporationRate;
  return Math.max(15, Math.min(100, Math.round(rawMoisture)));
}

/** Calidad del drenaje y aireación del suelo (0-100) */
export function calculateDrainage(plant: LilyPlantData | null | undefined, now = Date.now()): number {
  if (!plant) return 80;
  const drainAt = plant.drain_at ?? plant.prune_at;
  const hours = Math.max(0, (now - new Date(drainAt).getTime()) / 3_600_000);
  return Math.max(20, Math.round(100 - (hours / LILY_HOURS.drain) * 80));
}

export type StressType =
  | 'radiant'
  | 'thirsty'
  | 'overwatered'
  | 'low_light'
  | 'low_nutrients'
  | 'pests'
  | 'needs_love';

export type LilyStress = {
  type: StressType;
  title: string;
  description: string;
  recommendation: string;
  icon: string;
  colorClass: string;
};

/**
 * Señales biológicas de estrés (modelo amigable y no punitivo):
 * La planta nunca muere; si hay desbalance da pistas claras y amorosas.
 */
export function analyzeLilyStress(plant: LilyPlantData | null | undefined, now = Date.now()): LilyStress {
  if (!plant) {
    return {
      type: 'radiant',
      title: 'Planta floreciente',
      description: 'El lirio respira con calma en su maceta.',
      recommendation: 'Cúidenlo juntos con sol y agua fresca.',
      icon: '🌸',
      colorClass: 'text-primary',
    };
  }

  const moisture = calculateSoilMoisture(plant, now);
  const drainage = calculateDrainage(plant, now);
  const sun = needLevel(plant.sun_at, 'sun', now);
  const feed = needLevel(plant.feed_at, 'feed', now);
  const pests = needLevel(plant.pests_at, 'pests', now);

  if (moisture < 28) {
    return {
      type: 'thirsty',
      title: 'Sustrato seco (Sed)',
      description: 'Las hojas se inclinan con suavidad pidiendo humedad.',
      recommendation: 'Mantén pulsada la regadera para hidratar la tierra.',
      icon: '💧',
      colorClass: 'text-sky-500',
    };
  }

  if (moisture > 88 && drainage < 45) {
    return {
      type: 'overwatered',
      title: 'Sustrato saturado (Exceso de agua)',
      description: 'Hay mucha agua acumulada en las raíces. Las hojas toman un tono amarillento suave.',
      recommendation: 'Airea la tierra con la pala o dale sol para que evapore.',
      icon: '🫧',
      colorClass: 'text-amber-500',
    };
  }

  if (pests < 35) {
    return {
      type: 'pests',
      title: 'Bichitos en el tallo',
      description: 'Pequeños insectos exploran el lirio.',
      recommendation: 'Toca los bichitos en pantalla para espantarlos suavemente.',
      icon: '🐞',
      colorClass: 'text-rose-500',
    };
  }

  if (sun < 35) {
    return {
      type: 'low_light',
      title: 'Falta de sol directo',
      description: 'Los pétalos buscan la calidez del astro para abrirse del todo.',
      recommendation: 'Arrastra el sol o la luna hasta el centro de la flor.',
      icon: '☀️',
      colorClass: 'text-amber-500',
    };
  }

  if (feed < 35) {
    return {
      type: 'low_nutrients',
      title: 'Nutrientes bajos',
      description: 'La tierra necesita vitaminas orgánicas para mantener sus flores vivas.',
      recommendation: 'Agita la canasta de abono 5 veces.',
      icon: '🌱',
      colorClass: 'text-emerald-500',
    };
  }

  return {
    type: 'radiant',
    title: 'Radiante y en equilibrio',
    description: 'La tierra está fértil, las raíces oxigenadas y el lirio feliz de estar juntos.',
    recommendation: 'Cántale una melodía o mímenlo con cariño.',
    icon: '🌸',
    colorClass: 'text-primary',
  };
}

export function lilyMood(health: number, stress: LilyStress) {
  if (stress.type === 'radiant') return 'radiante';
  if (health >= 65) return 'tranquilo';
  return 'necesita mimos';
}

export const lilyOptions = queryOptions({
  queryKey: ['lily'],
  queryFn: async () => {
    const r = await supabase.from('lily_plant').select('*').maybeSingle();
    if (r.error) throw r.error;
    return r.data as LilyPlantData | null;
  },
});

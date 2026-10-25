export const rooms = [
  { id: 'bano', label: 'Baño', emoji: '🛁' },
  { id: 'cocina', label: 'Cocina', emoji: '🍎' },
  { id: 'dormitorio', label: 'Dormitorio', emoji: '🛏️' },
  { id: 'sala', label: 'Sala', emoji: '🛋️' },
] as const;
export type Room = (typeof rooms)[number]['id'];
export const furnitureCatalog = [
  { id: 'rug_rose', label: 'Alfombra rosa', category: 'rug', cost: 8, emoji: '🌸', tone: 'rose' },
  { id: 'rug_sky', label: 'Alfombra cielo', category: 'rug', cost: 10, emoji: '☁️', tone: 'sky' },
  { id: 'plant_lily', label: 'Lirios', category: 'plant', cost: 6, emoji: '🌷', tone: 'rose' },
  { id: 'plant_fern', label: 'Helecho', category: 'plant', cost: 8, emoji: '🪴', tone: 'sky' },
  { id: 'sofa_rose', label: 'Sofá rosa', category: 'sofa', cost: 20, emoji: '🛋️', tone: 'rose' },
  { id: 'sofa_sky', label: 'Sofá cielo', category: 'sofa', cost: 24, emoji: '🛋️', tone: 'sky' },
  { id: 'picture_heart', label: 'Cuadro corazón', category: 'picture', cost: 7, emoji: '🤍', tone: 'rose' },
  { id: 'picture_moon', label: 'Cuadro luna', category: 'picture', cost: 9, emoji: '🌙', tone: 'sky' },
  { id: 'lamp_star', label: 'Lámpara estrella', category: 'lamp', cost: 12, emoji: '⭐', tone: 'sky' },
  { id: 'lamp_flower', label: 'Lámpara flor', category: 'lamp', cost: 14, emoji: '🌼', tone: 'rose' },
] as const;
export function hygieneValue(state: { hygiene: number; hygiene_updated_at: string } | null | undefined, now = Date.now()) {
  if (!state) return 70;
  return Math.round(Math.max(10, Math.min(100, state.hygiene - 2 * Math.max(0, now - new Date(state.hygiene_updated_at).getTime()) / 3_600_000)));
}
export const BATH_REWARD = { coins: 2, exp: 20 };
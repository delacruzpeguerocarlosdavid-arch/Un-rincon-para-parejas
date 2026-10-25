import { describe, expect, it } from 'vitest';
import {
  analyzeLilyStress,
  calculateDrainage,
  calculateSoilMoisture,
  lilyMood,
  needLevel,
  type LilyPlantData,
} from '@/lib/lily';
import { lilyStage } from '@/components/LilyScene';

describe('lirio compartido', () => {
  const now = Date.parse('2026-10-23T12:00:00Z');
  it('el agua baja gradualmente con las horas', () => {
    expect(needLevel('2026-10-23T00:00:00Z', 'water', now)).toBe(61);
  });
  it('nunca baja de 15 (sin castigos ni marchitamiento total)', () => {
    expect(needLevel('2026-01-01T00:00:00Z', 'water', now)).toBe(15);
  });
  it('recién cuidada está al 100', () => {
    expect(needLevel('2026-10-23T12:00:00Z', 'prune', now)).toBe(100);
  });
  it('humedad del sustrato responde al riego y evaporación', () => {
    const plant: LilyPlantData = {
      space_id: 'test',
      water_at: '2026-10-23T11:00:00Z',
      sun_at: '2026-10-23T08:00:00Z',
      prune_at: '2026-10-23T08:00:00Z',
      feed_at: '2026-10-23T08:00:00Z',
      pests_at: '2026-10-23T08:00:00Z',
      song_at: null,
      drain_at: '2026-10-23T08:00:00Z',
      care_count: 5,
      last_by: null,
      updated_at: '2026-10-23T11:00:00Z',
    };
    const moisture = calculateSoilMoisture(plant, now);
    expect(moisture).toBeGreaterThan(80);
    const drainage = calculateDrainage(plant, now);
    expect(drainage).toBeGreaterThan(80);
  });
  it('diagnóstico de estrés detecta sed sin fatalidad', () => {
    const thirstyPlant: LilyPlantData = {
      space_id: 'test',
      water_at: '2026-10-20T00:00:00Z',
      sun_at: '2026-10-23T10:00:00Z',
      prune_at: '2026-10-23T10:00:00Z',
      feed_at: '2026-10-23T10:00:00Z',
      pests_at: '2026-10-23T10:00:00Z',
      song_at: null,
      drain_at: '2026-10-23T10:00:00Z',
      care_count: 5,
      last_by: null,
      updated_at: '2026-10-20T00:00:00Z',
    };
    const stress = analyzeLilyStress(thirstyPlant, now);
    expect(stress.type).toBe('thirsty');
    expect(lilyMood(20, stress)).toBe('necesita mimos');
  });
});

describe('crecimiento del lirio', () => {
  it('es brote con 2 cuidados', () => expect(lilyStage(2)).toBe(0));
  it('florece con 15 cuidados', () => expect(lilyStage(15)).toBe(3));
  it('es jardín con 30 cuidados', () => expect(lilyStage(30)).toBe(4));
});

import { ritualStreak } from '@/lib/ritual';
describe('racha del ritual', () => {
  it('cuenta días seguidos hasta hoy', () => expect(ritualStreak(['2026-10-21', '2026-10-22', '2026-10-23'], '2026-10-23')).toBe(3));
  it('si hoy falta, cuenta hasta ayer', () => expect(ritualStreak(['2026-10-21', '2026-10-22'], '2026-10-23')).toBe(2));
  it('un día perdido rompe la racha', () => expect(ritualStreak(['2026-10-20', '2026-10-23'], '2026-10-23')).toBe(1));
});

import { appaGoals } from '@/components/AppaExtras';
import { coinBalance } from '@/lib/appa';
describe('metas y armario', () => {
  const base = { games: [], baths: [], furniture: [], words: [], rituals: [], outfits: [], purchases: [] };
  it('nivel 5 completa la meta Appa crece', () => expect(appaGoals(base, 5).find(g => g.name === 'Appa crece')!.n).toBe(5));
  it('los accesorios restan monedas', () => expect(coinBalance({ interactions: [{ coins: 20 }], games: [], purchases: [], outfits: [{ cost: 15 }] })).toBe(5));
});

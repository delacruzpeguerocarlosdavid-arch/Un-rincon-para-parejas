import { describe, expect, it } from 'vitest';
import { appaActions, appaFoods, appaMood, coinBalance, gameReward, levelFor, totalCoins, totalExp } from '@/lib/appa';

describe('Appa', () => {
  it('cada acción da sus monedas', () => {
    expect(Object.fromEntries(appaActions.map(a => [a.id, a.coins]))).toEqual({ pet: 1, feed: 2, play: 3, hug: 2 });
  });
  it('un día completo de una persona suma 8 monedas', () => {
    expect(totalCoins(appaActions.map(a => ({ coins: a.coins })))).toBe(8);
  });
  it('el ánimo sube con el cuidado compartido', () => {
    expect(appaMood(0).face).toBe('🥺');
    expect(appaMood(3).face).toBe('😊');
    expect(appaMood(6).face).toBe('🥰');
  });
  it('precios de la tienda', () => {
    expect(appaFoods.map(f => [f.id, f.cost, f.exp])).toEqual([['manzana', 3, 15], ['zanahoria', 5, 30], ['pastel_nubes', 10, 70], ['banquete', 20, 160]]);
  });
  it('comprar resta monedas y suma EXP', () => {
    const d = { interactions: [{ coins: 8 }], games: [{ coins: 5, exp: 50 }], purchases: [{ cost: 10, exp: 70 }] };
    expect(coinBalance(d)).toBe(3);
    expect(totalExp(d)).toBe(80 + 50 + 70);
  });
  it('minijuegos dan como máximo 5 monedas y 50 EXP', () => {
    expect(gameReward(9)).toEqual({ coins: 3, exp: 18 });
    expect(gameReward(500)).toEqual({ coins: 5, exp: 50 });
  });
  it('niveles: 100 EXP para nivel 2, 300 para nivel 3', () => {
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(300)).toEqual({ level: 3, into: 0, needed: 300 });
  });
});

import { appaLook, decayStats } from '@/lib/appa';
import { BATH_REWARD, furnitureCatalog, hygieneValue } from '@/lib/appa-home';
describe('Casa compartida de Appa', () => {
  it('la higiene baja suavemente y nunca de 10', () => {
    const state = { hygiene: 70, hygiene_updated_at: '2026-10-23T10:00:00Z' };
    expect(hygieneValue(state, new Date('2026-10-23T12:00:00Z').getTime())).toBe(66);
    expect(hygieneValue(state, new Date('2026-11-23T12:00:00Z').getTime())).toBe(10);
  });
  it('un baño premiado aporta 2 monedas y 20 EXP', () => {
    expect(BATH_REWARD).toEqual({ coins: 2, exp: 20 });
    const data = { interactions: [], games: [], purchases: [], baths: [BATH_REWARD] };
    expect(coinBalance(data)).toBe(2);
    expect(totalExp(data)).toBe(20);
  });
  it('los muebles restan del mismo saldo que la comida', () => {
    expect(coinBalance({ interactions: [{ coins: 30 }], games: [], purchases: [{ cost: 3 }], furniture: [{ cost: 20 }], baths: [{ coins: 2 }] })).toBe(9);
  });
  it('catálogo incluye precios para los cinco tipos de decoración', () => {
    expect(furnitureCatalog.map(f => f.cost)).toEqual([8,10,6,8,20,24,7,9,12,14]);
    expect(new Set(furnitureCatalog.map(f => f.category)).size).toBe(5);
  });
});
describe('Appa estado compartido', () => {
  const base = { hunger: 80, happiness: 80, energy: 50, sleeping_since: null as string | null, updated_at: '2026-10-23T10:00:00Z' };
  it('despierto: baja 4 hambre, 3 felicidad y 2 energía por hora', () => {
    expect(decayStats(base, new Date('2026-10-23T12:00:00Z'))).toEqual({ hunger: 72, happiness: 74, energy: 46, sleeping: false });
  });
  it('dormido recupera 15 de energía por hora hasta 100', () => {
    expect(decayStats({ ...base, sleeping_since: base.updated_at }, new Date('2026-10-23T14:00:00Z')).energy).toBe(100);
  });
  it('nunca baja de 10, sin castigos duros', () => {
    expect(decayStats(base, new Date('2026-11-23T10:00:00Z'))).toMatchObject({ hunger: 10, happiness: 10, energy: 10 });
  });
  it('con hambre se ve hambriento', () => {
    expect(appaLook({ hunger: 20, happiness: 90, energy: 90, sleeping: false }).pose).toBe('hungry');
  });
});

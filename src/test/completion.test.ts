import { describe, expect, it } from 'vitest';
import { countdown, santoDomingoInstant, lineCells, foundCells } from '@/lib/completion';
import { reminderTimeReached } from '@/lib/reminders';
import { coinBalance, totalExp } from '@/lib/appa';
describe('Remaining features', () => {
  it('interprets capsule opening in Santo Domingo, not device timezone', () => { expect(santoDomingoInstant('2026-10-24T09:30')).toBe('2026-10-24T13:30:00.000Z'); });
  it('counts down until the future instant without negative values', () => { expect(countdown('2026-10-24T13:30:00Z', Date.parse('2026-10-23T12:29:59Z'))).toEqual({ days: 1, hours: 1, minutes: 0, seconds: 1 }); expect(countdown('2026-10-24T13:30:00Z', Date.parse('2026-10-25T13:30:00Z')).seconds).toBe(0); });
  it('includes shared word rewards in coins and EXP', () => { const d = { interactions: [], games: [], purchases: [], words: [{ coins: 1, exp: 10 }] }; expect(coinBalance(d)).toBe(1); expect(totalExp(d)).toBe(10); });
  it('accepts straight lines and rejects bent selections', () => { expect(lineCells(0, 18)).toEqual([0,9,18]); expect(lineCells(0, 17)).toEqual([]); });
  it('uses the proven solver for discovered words', () => { expect(foundCells([['A','M','O','R'],['Z','Z','Z','Z'],['Z','Z','Z','Z'],['Z','Z','Z','Z']], ['AMOR'])).toEqual([0,1,2,3]); });
  it('checks reminders against Santo Domingo hour', () => { expect(reminderTimeReached(new Date('2026-10-23T12:59:00Z'), '09:00')).toBe(false); expect(reminderTimeReached(new Date('2026-10-23T13:00:00Z'), '09:00')).toBe(true); });
});import { levelVerse, WORD_LEVELS } from '@/lib/completion';
describe('Word search levels', () => {
  it('has 100 levels, each studying a catalog verse in order', () => { expect(WORD_LEVELS).toBe(100); expect(levelVerse(1).reference).toBe('1 Corintios 13:4'); expect(levelVerse(91).reference).toBe(levelVerse(1).reference); });
});

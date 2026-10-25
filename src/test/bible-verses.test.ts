import { describe, expect, it } from 'vitest';
import { dailyVerse, searchVerses, verseCategories, verses } from '@/lib/bible-verses';

describe('Verse catalog filtering', () => {
  it.each(verseCategories)('only returns verses classified %s', category => {
    const list = searchVerses(category, '');
    expect(list.length).toBe(15);
    expect(list.every(v => v.category === category)).toBe(true);
    expect(new Set(list.map(v => v.reference)).size).toBe(15);
  });
  it('searches references and words within a selected category', () => {
    expect(searchVerses('Amor', '1 Juan 4:8').map(v => v.reference)).toEqual(['1 Juan 4:8']);
    expect(searchVerses('Paz', '1 Juan 4:8')).toEqual([]);
    expect(searchVerses('Todos', 'impossible-query')).toEqual([]);
    expect(searchVerses('Todos', '')).toHaveLength(90);
    expect(verses.every(v => v.text.length > 0)).toBe(true);
  });
  it('returns a consistent daily verse for any given date', () => {
    const v1 = dailyVerse('2026-10-24');
    const v2 = dailyVerse('2026-10-24');
    expect(v1).toBeDefined();
    expect(v1.reference).toBe(v2.reference);
    expect(v1.text).toBe(v2.text);
    expect(verseCategories).toContain(v1.category);
  });
});
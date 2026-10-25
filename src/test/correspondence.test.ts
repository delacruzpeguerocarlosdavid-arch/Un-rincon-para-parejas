import { describe, expect, it } from 'vitest';
import { canEditText, canFavoriteText, searchTexts, welcomeText, WELCOME_TITLE, type Text } from '@/lib/correspondence';

const text: Text = { id: 'one', author_id: 'carlos', space_id: 'space', kind: 'library', title: 'Esperanza', content: 'Cuando necesites tranquilidad', folder: 'Amor', created_at: '', updated_at: '' };
describe('Library ownership rules', () => {
  it('allows only the author to edit library words', () => {
    expect(canEditText(text, 'carlos')).toBe(true);
    expect(canEditText(text, 'partner')).toBe(false);
  });
  it('allows the partner, not the author, to favorite library words', () => {
    expect(canFavoriteText(text, 'partner')).toBe(true);
    expect(canFavoriteText(text, 'carlos')).toBe(false);
  });
  it('does not offer editing or favorites on chat or letters', () => {
    for (const kind of ['chat', 'letter', 'note']) {
      expect(canEditText({ ...text, kind }, 'carlos')).toBe(false);
      expect(canFavoriteText({ ...text, kind }, 'partner')).toBe(false);
    }
  });
});
describe('Personal library search', () => {
  it('uses only the administrator library welcome, never partner or chat content', () => {
    const welcome = { ...text, title: WELCOME_TITLE };
    expect(welcomeText([welcome], 'carlos')).toEqual(welcome);
    expect(welcomeText([welcome], undefined)).toBeUndefined();
    expect(welcomeText([{ ...welcome, author_id: 'partner' }, { ...welcome, kind: 'chat' }], 'carlos')).toBeUndefined();
  });
  it('searches titles', () => { expect(searchTexts([text], 'esperanza')).toEqual([text]); expect(searchTexts([text], 'alegría')).toEqual([]); });
  it('searches content without requiring matching accents or capitalization', () => { expect(searchTexts([text], 'TRANQUILIDAD')).toEqual([text]); expect(searchTexts([{ ...text, content: 'Ánimo' }], 'animo')).toHaveLength(1); });
});
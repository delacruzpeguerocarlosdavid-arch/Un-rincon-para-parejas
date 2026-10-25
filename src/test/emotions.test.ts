import { describe, it, expect } from 'vitest';
import { emotionFor, partnerWords, feelingSpaces } from '@/lib/emotions';
import { dominicanDate } from '@/lib/message-bank';
import type { Text } from '@/lib/correspondence';

describe('Emotions and partner moments', () => {
  it.each([['amor', 'Amor'], ['tristeza', 'Cuando estés triste'], ['enojo', 'Cuando estés enojada'], ['fe', 'Tu tiempo con Dios'], ['libre', null]])('connects space %s to its library folder or free writing', (id, folder) => {
    expect(feelingSpaces.find(s => s.id === id)?.folder).toBe(folder);
  });
  it.each([
    ['feliz', 'Cuando estés feliz'], ['triste', 'Cuando estés triste'], ['enojada', 'Cuando estés enojada'],
    ['discusion', 'Después de una discusión'], ['no_escuchada', 'Cuando sientas que no te escucho'],
  ])('connects %s to the requested moment', (emotion, folder) => { expect(emotionFor(emotion)?.folder).toBe(folder); });
  it('returns only partner-written library words for the selected moment', () => {
    const text: Text = { id: 'partner', author_id: 'other', space_id: 'space', kind: 'library', title: 'Para ti', content: 'Texto personal', folder: 'Cuando estés triste', created_at: '', updated_at: '' };
    expect(partnerWords([text, { ...text, id: 'own', author_id: 'me' }, { ...text, id: 'wrong', folder: 'Amor' }, { ...text, id: 'chat', kind: 'chat' }], 'me', 'Cuando estés triste')).toEqual([text]);
  });
  it('uses the Dominican day until and after midnight', () => {
    expect(dominicanDate(new Date('2026-10-24T03:59:59Z'))).toBe('2026-10-23');
    expect(dominicanDate(new Date('2026-10-24T04:00:00Z'))).toBe('2026-10-24');
  });
});
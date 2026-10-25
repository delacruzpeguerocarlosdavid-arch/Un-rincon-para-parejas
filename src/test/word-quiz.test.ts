import { describe, expect, it } from 'vitest';
import { buildQuiz } from '@/lib/word-quiz';
describe('Word quiz', () => {
  it('asks about the level verse, a blank from it and a board word, each with its answer among options', () => {
    const q = buildQuiz(1, ['CARIDAD', 'SUFRIDA', 'BENIGNA', 'AMOR', 'BESO']);
    expect(q).toHaveLength(3);
    expect(q[0]!.answer).toBe('1 Corintios 13:4');
    expect(q[1]!.prompt).toContain('_____');
    for (const x of q) expect(x.options).toContain(x.answer);
    expect(['CARIDAD', 'SUFRIDA', 'BENIGNA', 'AMOR', 'BESO']).toContain(q[2]!.answer);
  });
});

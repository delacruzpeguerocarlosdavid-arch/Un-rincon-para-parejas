import { describe, it, expect } from 'vitest';
import { dominicanDate } from '@/lib/message-bank';
describe('Dominican calendar date', () => {
  it('keeps the previous day until Dominican midnight', () => {
    expect(dominicanDate(new Date('2026-10-24T03:59:59Z'))).toBe('2026-10-23');
  });
  it('changes at midnight in Santo Domingo', () => {
    expect(dominicanDate(new Date('2026-10-24T04:00:00Z'))).toBe('2026-10-24');
  });
});
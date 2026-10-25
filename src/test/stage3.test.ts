import { describe, expect, it } from 'vitest';
import { archiveDaysLeft, dominicanToday, nextOccurrence, reminderDue, validateImage } from '@/lib/stage3';

describe('stage 3 rules', () => {
  it('uses the Santo Domingo date (UTC-4) for today', () => {
    expect(dominicanToday(new Date('2026-10-24T03:30:00Z'))).toBe('2026-10-23');
  });
  it('rolls yearly dates to the next year once passed', () => {
    expect(nextOccurrence('2020-03-10', true, '2026-10-23')).toBe('2027-03-10');
    expect(nextOccurrence('2020-12-01', true, '2026-10-23')).toBe('2026-12-01');
    expect(nextOccurrence('2020-03-10', false, '2026-10-23')).toBe('2020-03-10');
  });
  it('shows a reminder only inside the chosen window', () => {
    const base = { event_date: '2020-10-26', repeats_yearly: true };
    expect(reminderDue({ ...base, reminder_days: 3 }, '2026-10-23')).toBe(true);
    expect(reminderDue({ ...base, reminder_days: 1 }, '2026-10-23')).toBe(false);
    expect(reminderDue({ ...base, reminder_days: null }, '2026-10-23')).toBe(false);
  });
  it('keeps archived items recoverable for 30 days', () => {
    expect(archiveDaysLeft('2026-10-01T00:00:00Z', new Date('2026-10-11T00:00:00Z'))).toBe(20);
    expect(archiveDaysLeft('2026-09-01T00:00:00Z', new Date('2026-10-11T00:00:00Z'))).toBe(0);
  });
  it('accepts only JPG/PNG/WebP photos up to 15 MB', () => {
    expect(validateImage({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateImage({ type: 'image/gif', size: 1000 })).not.toBeNull();
    expect(validateImage({ type: 'image/png', size: 16 * 1024 * 1024 })).not.toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { softStreak } from '@/lib/spiritual';

describe('racha suave', () => {
  it('cuenta días seguidos aunque falte un solo día', () => {
    expect(softStreak(['2026-10-23', '2026-10-21', '2026-10-20'], '2026-10-23')).toBe(3);
  });
  it('se corta si faltan dos días seguidos', () => {
    expect(softStreak(['2026-10-23', '2026-10-20'], '2026-10-23')).toBe(1);
  });
  it('sigue viva si hoy aún no se ha marcado pero ayer no y anteayer sí', () => {
    expect(softStreak(['2026-10-21'], '2026-10-23')).toBe(1);
  });
  it('vuelve a cero tras dos días completos sin momento', () => {
    expect(softStreak(['2026-10-20'], '2026-10-23')).toBe(0);
  });
  it('los dos marcando el mismo día cuentan como un día', () => {
    expect(softStreak(['2026-10-23', '2026-10-23'], '2026-10-23')).toBe(1);
  });
});

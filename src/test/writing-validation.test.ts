import { describe, expect, it } from 'vitest';
import { canCompose, correspondenceSchema, feelingsSchema, inviteSchema } from '@/lib/writing-validation';

describe('Writing while partner is pending', () => {
  it('allows an authenticated author to compose without partner membership', () => {
    expect(canCompose('carlos', false)).toBe(true);
    expect(canCompose(undefined, false)).toBe(false);
    expect(canCompose('carlos', true)).toBe(false);
  });
  it.each(['chat', 'note', 'letter', 'library'])('accepts %s before partner joins', kind => {
    expect(correspondenceSchema.safeParse({ kind, title: 'Amor', content: 'Mis palabras', folder: 'Amor' }).success).toBe(true);
  });
  it('requires a title for letters and library, but not chat or notes', () => {
    for (const kind of ['letter', 'library']) expect(correspondenceSchema.safeParse({ kind, title: ' ', content: 'Amor', folder: 'Amor' }).success).toBe(false);
    for (const kind of ['chat', 'note']) expect(correspondenceSchema.safeParse({ kind, title: '', content: 'Amor' }).success).toBe(true);
  });
  it('rejects empty content and invalid library folders', () => {
    expect(correspondenceSchema.safeParse({ kind: 'chat', title: '', content: ' ' }).success).toBe(false);
    expect(correspondenceSchema.safeParse({ kind: 'library', title: 'Amor', content: 'Amor', folder: 'invalid' }).success).toBe(false);
  });
  it('validates shared and private feelings without a second account', () => {
    for (const kind of ['shared', 'private']) expect(feelingsSchema.safeParse({ kind, title: 'Hoy', content: 'Me siento bien' }).success).toBe(true);
    expect(feelingsSchema.safeParse({ kind: 'private', title: ' ', content: ' ' }).success).toBe(false);
  });
  it('validates the complete invitation and expiry', () => {
    expect(inviteSchema.safeParse({ code: 'ABCDE-FGHJK', expires_at: '2026-10-26T00:00:00Z' }).success).toBe(true);
    expect(inviteSchema.safeParse({ code: 'ABCDE-', expires_at: 'invalid' }).success).toBe(false);
  });
});
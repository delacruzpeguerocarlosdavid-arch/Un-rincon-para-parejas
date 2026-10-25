import { z } from 'zod';
import { folders } from '@/lib/correspondence';

export const correspondenceSchema = z.object({
  kind: z.enum(['chat', 'note', 'letter', 'library']),
  title: z.string().trim().max(160, 'El título admite hasta 160 caracteres.'),
  content: z.string().trim().min(1, 'Escribe tus palabras.').max(20000, 'Tus palabras admiten hasta 20000 caracteres.'),
  folder: z.string().optional(),
}).superRefine((value, ctx) => {
  if ((value.kind === 'letter' || value.kind === 'library') && !value.title) ctx.addIssue({ code: 'custom', path: ['title'], message: 'Escribe un título.' });
  if (value.kind === 'library' && !folders.some(folder => folder === value.folder)) ctx.addIssue({ code: 'custom', path: ['folder'], message: 'Elige una carpeta.' });
});

export const feelingsSchema = z.object({
  kind: z.enum(['shared', 'private']),
  title: z.string().trim().min(1, 'Escribe un título.').max(160),
  content: z.string().trim().min(1, 'Escribe cómo te sientes.').max(30000),
});

export const inviteSchema = z.object({
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/),
  expires_at: z.string().datetime({ offset: true }),
});

export const canCompose = (userId: string | undefined, busy: boolean) => Boolean(userId) && !busy;
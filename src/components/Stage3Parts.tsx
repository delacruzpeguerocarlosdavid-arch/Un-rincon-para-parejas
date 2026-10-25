import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Archive, ArchiveRestore, Search, Send, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { membershipOptions } from '@/lib/message-bank';
import { archiveDaysLeft, emojis, stage3Options, type ItemType } from '@/lib/stage3';
import { formatDate } from '@/lib/correspondence';

export const field = 'w-full rounded-md border border-input bg-card px-3 py-2 text-sm';

export function useStage3() {
  const member = useQuery(membershipOptions);
  const query = useQuery({ ...stage3Options, enabled: Boolean(member.data) });
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function run<T>(action: () => PromiseLike<{ data?: T; error: { message: string } | null }>) {
    setBusy(true); setNotice('');
    try { const r = await action(); if (r.error) throw new Error(r.error.message); await qc.invalidateQueries({ queryKey: ['stage3'] }); return { ok: true as const, data: r.data }; }
    catch (e) { setNotice(e instanceof Error ? e.message : 'No pudimos guardar el cambio.'); return { ok: false as const }; }
    finally { setBusy(false); }
  }
  const name = (id: string) => { const p = query.data?.profiles.find(x => x.id === id); return p?.nickname || p?.display_name || 'Sin nombre'; };
  return { member, query, uid: member.data?.user_id, run, busy, notice, setNotice, name };
}

export function Gate({ member, query, children }: { member: { isPending: boolean; data?: unknown; error: unknown }; query: { isPending: boolean; error: unknown; refetch: () => unknown }; children: ReactNode }) {
  if (member.isPending || (member.data && query.isPending)) return <p className="text-sm text-muted-foreground">Un momento…</p>;
  if (!member.data) return <div className="card-soft p-5"><p className="font-serif text-xl">Esta sección es solo para las dos cuentas de nuestro espacio.</p><Button asChild className="mt-3" size="sm"><Link to="/espacio">Ir a nuestro espacio</Link></Button></div>;
  if (member.error || query.error) return <div className="card-soft p-5"><p className="text-sm">No pudimos cargar esta sección.</p><Button variant="ghost" onClick={() => query.refetch()}>Reintentar</Button></div>;
  return <>{children}</>;
}

export function Toolbar({ search, setSearch, archived, setArchived }: { search: string; setSearch: (v: string) => void; archived: boolean; setArchived: (v: boolean) => void }) {
  return <div className="mb-4 space-y-2">
    <label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input className={`${field} pl-9`} placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar" /></label>
    <div className="flex gap-2 text-xs">
      <button className={`rounded-full px-3 py-1 ${!archived ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={() => setArchived(false)}>Activos</button>
      <button className={`rounded-full px-3 py-1 ${archived ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={() => setArchived(true)}>Archivados (30 días)</button>
    </div>
  </div>;
}

export function Notice({ text }: { text: string }) { return text ? <p role="alert" className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{text}</p> : null; }

export function ArchiveActions({ type, id, archivedAt, run, busy, onDeleted, onDone }: { type: ItemType; id: string; archivedAt: string | null; run: ReturnType<typeof useStage3>['run']; busy: boolean; onDeleted?: (path: string | null) => Promise<void> | void; onDone?: () => void }) {
  if (!archivedAt) return <Button size="sm" variant="ghost" disabled={busy} onClick={async () => { if ((await run(() => supabase.rpc('set_item_archived', { p_type: type, p_id: id, p_archived: true }))).ok) onDone?.(); }}><Archive />Archivar</Button>;
  const left = archiveDaysLeft(archivedAt);
  return <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs text-muted-foreground">Se borrará en {left} {left === 1 ? 'día' : 'días'}</span>
    <Button size="sm" variant="outline" disabled={busy} onClick={async () => { if ((await run(() => supabase.rpc('set_item_archived', { p_type: type, p_id: id, p_archived: false }))).ok) onDone?.(); }}><ArchiveRestore />Recuperar</Button>
    <AlertDialog>
      <AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={busy}><Trash2 />Eliminar</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle><AlertDialogDescription>Se borrará para siempre{type === 'memory' ? ', junto con la foto, los comentarios y las reacciones' : type === 'journal' ? ', junto con sus comentarios y reacciones' : ''}. No se podrá recuperar.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { const r = await run<string | null>(() => supabase.rpc('delete_item_forever', { p_type: type, p_id: id })); if (r.ok) { await onDeleted?.(r.data ?? null); onDone?.(); } }}>Sí, eliminar para siempre</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

export function Social({ type, id, ctx }: { type: 'memory' | 'journal'; id: string; ctx: ReturnType<typeof useStage3> }) {
  const [text, setText] = useState('');
  const d = ctx.query.data; if (!d) return null;
  const key = type === 'memory' ? 'memory_id' : 'journal_id';
  const comments = d.comments.filter(c => c[key] === id);
  const reactions = d.reactions.filter(r => r[key] === id);
  async function send(e: FormEvent) { e.preventDefault(); if (!text.trim()) return; if ((await ctx.run(() => supabase.rpc('add_item_comment', { p_type: type, p_id: id, p_content: text }))).ok) setText(''); }
  return <div className="mt-4 border-t border-border pt-3">
    <div className="flex flex-wrap gap-1.5">{emojis.map(e => { const n = reactions.filter(r => r.emoji === e); const mine = n.some(r => r.user_id === ctx.uid); return <button key={e} disabled={ctx.busy} aria-pressed={mine} onClick={() => ctx.run(() => supabase.rpc('toggle_item_reaction', { p_type: type, p_id: id, p_emoji: e }))} className={`rounded-full border px-2 py-0.5 text-sm ${mine ? 'border-primary bg-accent' : 'border-border'}`}>{e}{n.length ? ` ${n.length}` : ''}</button>; })}</div>
    <ul className="mt-3 space-y-2">{comments.map(c => <li key={c.id} className="rounded-md bg-muted/60 px-3 py-2 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{ctx.name(c.author_id)}</span>{c.author_id === ctx.uid && <button aria-label="Borrar comentario" onClick={() => ctx.run(() => supabase.rpc('delete_item_comment', { p_id: c.id }))}><X className="h-3.5 w-3.5" /></button>}</div><p className="whitespace-pre-wrap break-words">{c.content}</p><p className="text-[11px] text-muted-foreground">{formatDate(c.created_at)}</p></li>)}</ul>
    <form onSubmit={send} className="mt-2 flex gap-2"><input className={field} maxLength={2000} placeholder="Escribe un comentario…" value={text} onChange={e => setText(e.target.value)} /><Button size="icon" disabled={ctx.busy || !text.trim()} aria-label="Enviar comentario"><Send /></Button></form>
  </div>;
}

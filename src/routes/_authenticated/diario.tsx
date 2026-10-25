import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { Lock, Pencil, Plus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { ArchiveActions, Gate, Notice, Social, Toolbar, field, useStage3 } from '@/components/Stage3Parts';
import { dominicanToday, formatDay, matches } from '@/lib/stage3';
import { formatDate } from '@/lib/correspondence';

export const Route = createFileRoute('/_authenticated/diario')({
  validateSearch: (search: Record<string, unknown>): { kind?: 'private' | 'shared' } => {
    const kind = search['kind'];
    return kind === 'private' || kind === 'shared' ? { kind } : {};
  },
  head: () => ({ meta: [
    { title: 'Diarios · Un lugar para nosotros dos' },
    { name: 'description', content: 'Tu diario privado y nuestro diario compartido.' },
    { property: 'og:title', content: 'Diarios · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Un diario solo tuyo y otro para escribir juntos.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Diary,
});

type Kind = 'private' | 'shared';
function Diary() {
  const ctx = useStage3();
  const searchParams = Route.useSearch();
  const [kind, setKind] = useState<Kind>(searchParams.kind ?? 'private');
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<{ id?: string; title: string; content: string; date: string } | null>(null);
  // RLS already hides the partner's private entries; the author filter is only a display guard.
  const list = (ctx.query.data?.entries ?? []).filter(e => e.kind === kind && (kind === 'shared' || e.author_id === ctx.uid) && Boolean(e.archived_at) === archived && matches([e.title, e.content], search));
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    if ((await ctx.run(() => supabase.rpc('save_journal_entry', { p_kind: kind, p_title: draft.title, p_content: draft.content, p_date: draft.date, ...(draft.id ? { p_id: draft.id } : {}) }))).ok) setDraft(null);
  }
  return <div>
    <PageHeader title="Diarios" subtitle={kind === 'private' ? 'Solo tú puedes leer tu diario privado.' : 'Lo que escribimos juntos.'} />
    <Gate member={ctx.member} query={ctx.query}>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button variant={kind === 'private' ? 'default' : 'outline'} onClick={() => { setKind('private'); setDraft(null); }}><Lock />Mi diario</Button>
        <Button variant={kind === 'shared' ? 'default' : 'outline'} onClick={() => { setKind('shared'); setDraft(null); }}><Users />Compartido</Button>
      </div>
      <Notice text={ctx.notice} />
      {!draft && <Button className="mb-4 w-full" variant="secondary" onClick={() => setDraft({ title: '', content: '', date: dominicanToday() })}><Plus />Nueva entrada</Button>}
      {draft && <form onSubmit={save} className="card-soft mb-5 space-y-3 p-4">
        <div className="flex justify-between"><h2 className="text-xl font-semibold">{draft.id ? 'Editar entrada' : kind === 'private' ? 'Entrada privada' : 'Entrada compartida'}</h2><button type="button" aria-label="Cerrar" onClick={() => setDraft(null)}><X className="h-4 w-4" /></button></div>
        <input className={field} required maxLength={160} placeholder="Título" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        <input type="date" required className={field} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} aria-label="Fecha" />
        <textarea className={field} required rows={8} maxLength={30000} placeholder="Escribe aquí…" value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} />
        <Button className="w-full" disabled={ctx.busy}>Guardar</Button>
      </form>}
      <Toolbar search={search} setSearch={setSearch} archived={archived} setArchived={setArchived} />
      {!list.length ? <p className="py-10 text-center font-serif text-xl text-muted-foreground">{archived ? 'No hay entradas archivadas.' : search ? 'Ninguna entrada coincide.' : 'Todavía no hay entradas.'}</p> :
        <ul className="space-y-3">{list.map(e => <li key={e.id} className="card-soft p-4">
          <h3 className="font-serif text-2xl leading-tight">{e.title}</h3>
          <p className="text-xs text-muted-foreground">{formatDay(e.entry_date)} · {ctx.name(e.author_id)}{e.updated_at !== e.created_at ? ` · editado ${formatDate(e.updated_at)}` : ''}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{e.content}</p>
          {e.author_id === ctx.uid && <div className="mt-3 flex flex-wrap gap-2">
            {!e.archived_at && <Button size="sm" variant="outline" onClick={() => setDraft({ id: e.id, title: e.title, content: e.content, date: e.entry_date })}><Pencil />Editar</Button>}
            <ArchiveActions type="journal" id={e.id} archivedAt={e.archived_at} run={ctx.run} busy={ctx.busy} />
          </div>}
          {kind === 'shared' && !e.archived_at && <Social type="journal" id={e.id} ctx={ctx} />}
        </li>)}</ul>}
    </Gate>
  </div>;
}

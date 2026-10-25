import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { BellRing, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { ArchiveActions, Gate, Notice, Toolbar, field, useStage3 } from '@/components/Stage3Parts';
import { dateCategories, daysBetween, dominicanToday, formatDay, matches, nextOccurrence, reminderDue, reminderOptions } from '@/lib/stage3';

export const Route = createFileRoute('/_authenticated/fechas')({
  head: () => ({ meta: [
    { title: 'Fechas especiales · Un lugar para nosotros dos' },
    { name: 'description', content: 'Cumpleaños, aniversarios y fechas importantes con recordatorios.' },
    { property: 'og:title', content: 'Fechas especiales · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Nuestro calendario de fechas importantes.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Dates,
});

type Draft = { id?: string; name: string; date: string; description: string; category: string; reminder: number | null; yearly: boolean };
function Dates() {
  const ctx = useStage3();
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const today = dominicanToday();
  const list = (ctx.query.data?.dates ?? [])
    .filter(x => Boolean(x.archived_at) === archived && matches([x.name, x.description, x.category], search))
    .map(x => ({ ...x, next: nextOccurrence(x.event_date, x.repeats_yearly, today) }))
    .sort((a, b) => (a.next < today ? 1 : 0) - (b.next < today ? 1 : 0) || a.next.localeCompare(b.next));
  const due = list.filter(x => !x.archived_at && reminderDue(x, today));
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    if ((await ctx.run(() => supabase.rpc('save_special_date', { p_name: draft.name, p_date: draft.date, p_description: draft.description, p_category: draft.category, p_repeats_yearly: draft.yearly, ...(draft.reminder === null ? {} : { p_reminder_days: draft.reminder }), ...(draft.id ? { p_id: draft.id } : {}) }))).ok) setDraft(null);
  }
  const label = (n: number) => n === 0 ? 'Es hoy' : n === 1 ? 'Mañana' : n > 0 ? `En ${n} días` : 'Ya pasó';
  return <div>
    <PageHeader title="Fechas especiales" subtitle="Hora de Santo Domingo." />
    <Gate member={ctx.member} query={ctx.query}>
      <Notice text={ctx.notice} />
      {due.length > 0 && <div className="card-blush mb-4 p-4"><p className="flex items-center gap-2 font-semibold"><BellRing className="h-4 w-4 text-primary" />Recordatorios</p>
        <ul className="mt-2 space-y-1 text-sm">{due.map(x => <li key={x.id}>{x.name}: {label(daysBetween(today, x.next))}</li>)}</ul>
        <p className="mt-2 text-[11px] text-muted-foreground">Los recordatorios se ven aquí al abrir la app; todavía no se envían notificaciones.</p></div>}
      {!draft && <Button className="mb-4 w-full" onClick={() => setDraft({ name: '', date: today, description: '', category: 'aniversario', reminder: 1, yearly: true })}><Plus />Añadir fecha</Button>}
      {draft && <form onSubmit={save} className="card-soft mb-5 space-y-3 p-4">
        <div className="flex justify-between"><h2 className="text-xl font-semibold">{draft.id ? 'Editar fecha' : 'Nueva fecha'}</h2><button type="button" aria-label="Cerrar" onClick={() => setDraft(null)}><X className="h-4 w-4" /></button></div>
        <input className={field} required maxLength={120} placeholder="Nombre" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        <input type="date" required className={field} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} aria-label="Fecha" />
        <select className={field} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} aria-label="Categoría">{dateCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select>
        <select className={field} value={draft.reminder ?? ''} onChange={e => setDraft({ ...draft, reminder: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Recordatorio">{reminderOptions.map(r => <option key={String(r)} value={r ?? ''}>{r === null ? 'Sin recordatorio' : r === 0 ? 'Recordar el mismo día' : `Recordar ${r} ${r === 1 ? 'día' : 'días'} antes`}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.yearly} onChange={e => setDraft({ ...draft, yearly: e.target.checked })} />Se repite cada año</label>
        <textarea className={field} rows={3} maxLength={2000} placeholder="Descripción" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
        <Button className="w-full" disabled={ctx.busy}>Guardar</Button>
      </form>}
      <Toolbar search={search} setSearch={setSearch} archived={archived} setArchived={setArchived} />
      {!list.length ? <p className="py-10 text-center font-serif text-xl text-muted-foreground">{archived ? 'No hay fechas archivadas.' : search ? 'Ninguna fecha coincide.' : 'Aún no hay fechas guardadas.'}</p> :
        <ul className="space-y-3">{list.map(x => { const n = daysBetween(today, x.next); return <li key={x.id} className="card-soft p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl leading-tight">{x.name}</h3><p className="text-xs text-muted-foreground">{formatDay(x.next)} · {x.category}{x.repeats_yearly ? ' · cada año' : ''}</p></div><span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs">{label(n)}</span></div>
          {x.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{x.description}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">Añadida por {ctx.name(x.author_id)}</p>
          {x.author_id === ctx.uid && <div className="mt-3 flex flex-wrap gap-2">
            {!x.archived_at && <Button size="sm" variant="outline" onClick={() => setDraft({ id: x.id, name: x.name, date: x.event_date, description: x.description, category: x.category, reminder: x.reminder_days, yearly: x.repeats_yearly })}><Pencil />Editar</Button>}
            <ArchiveActions type="date" id={x.id} archivedAt={x.archived_at} run={ctx.run} busy={ctx.busy} />
          </div>}
        </li>; })}</ul>}
    </Gate>
  </div>;
}

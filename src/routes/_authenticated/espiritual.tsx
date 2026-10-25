import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, Flame, Lock, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { Gate, Notice, field, useStage3 } from '@/components/Stage3Parts';
import { dominicanToday, formatDay, matches } from '@/lib/stage3';
import { softStreak, spiritualKinds, spiritualOptions, type SpiritualKind } from '@/lib/spiritual';
import { VerseCatalog } from '@/components/VerseCatalog';

export const Route = createFileRoute('/_authenticated/espiritual')({
  head: () => ({ meta: [
    { title: 'Nuestro tiempo con Dios · Un lugar para nosotros dos' },
    { name: 'description', content: 'Versículos NTV de amor, adoración, gozo, tiempos difíciles, paz y esperanza; peticiones y diarios para nuestro tiempo con Dios.' },
    { property: 'og:title', content: 'Nuestro tiempo con Dios · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Versículos por categoría, oraciones, adoraciones, peticiones y diarios privados y compartidos.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Spiritual,
});

type Draft = { id?: string; kind: SpiritualKind; title: string; content: string; reference: string };
const placeholders: Record<SpiritualKind, string> = { prayer: 'Escribe tu oración o adoración…', petition: '¿Por qué quieres que oremos?', reading: 'Lo que te habló esta lectura…' };

function Spiritual() {
  const ctx = useStage3();
  const qc = useQueryClient();
  const q = useQuery({ ...spiritualOptions, enabled: Boolean(ctx.member.data) });
  const [tab, setTab] = useState<SpiritualKind | 'verses'>('verses');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const today = dominicanToday();
  const checks = q.data?.checkins ?? [];
  const streak = softStreak(checks.map(c => c.day), today);
  const mineToday = checks.some(c => c.day === today && c.user_id === ctx.uid);
  const partnerToday = checks.some(c => c.day === today && c.user_id !== ctx.uid);
  const list = (q.data?.items ?? []).filter(x => x.kind === tab && matches([x.title, x.content, x.reference], search));

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setNotice('');
    const { error } = await action();
    setBusy(false);
    if (error) { setNotice(error.message); return false; }
    await qc.invalidateQueries({ queryKey: ['spiritual'] });
    return true;
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft) return;
    if (await run(() => supabase.rpc('save_spiritual_item', { p_kind: draft.kind, p_title: draft.title, p_content: draft.content, p_reference: draft.reference, ...(draft.id ? { p_id: draft.id } : {}) }))) setDraft(null);
  }

  return <div>
    <PageHeader title="Nuestro tiempo con Dios" subtitle="Orar y leer juntos, sin prisa." />
    <Gate member={ctx.member} query={q}>
      <Notice text={notice} />
      <section className="card-blush mb-5 p-5">
        <p className="flex items-center gap-2 font-serif text-2xl"><Flame className="h-5 w-5 text-primary" />{streak === 0 ? 'Empecemos de nuevo' : `${streak} ${streak === 1 ? 'día' : 'días'} juntos con Dios`}</p>
        <p className="mt-1 text-xs text-muted-foreground">Racha suave: un día sin marcar no la rompe; solo se reinicia tras dos días seguidos.</p>
        <p className="mt-2 text-sm">{partnerToday ? 'Tu pareja ya tuvo su momento hoy 🙏' : 'Tu pareja aún no ha marcado su momento hoy.'}</p>
        <Button className="mt-3 w-full" disabled={busy || mineToday} onClick={() => run(() => supabase.rpc('spiritual_checkin'))}><Check />{mineToday ? 'Ya tuviste tu momento hoy' : 'Hoy tuve mi momento con Dios'}</Button>
      </section>

      <nav aria-label="Diarios espirituales" className="mb-5 grid grid-cols-2 gap-2"><Button asChild variant="outline"><Link to="/diario" search={{ kind: 'shared' }}><Users />Diario compartido</Link></Button><Button asChild variant="outline"><Link to="/diario" search={{ kind: 'private' }}><Lock />Diario privado</Link></Button></nav>
      <div className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Nuestro tiempo con Dios"><Button role="tab" aria-selected={tab === 'verses'} variant={tab === 'verses' ? 'default' : 'outline'} onClick={() => { setTab('verses'); setDraft(null); }}><BookOpen />Versículos</Button>{spiritualKinds.map(k => <Button key={k.id} role="tab" aria-selected={tab === k.id} onClick={() => { setTab(k.id); setDraft(null); }} variant={tab === k.id ? 'default' : 'outline'} className="h-auto min-h-10 whitespace-normal py-2">{k.label}</Button>)}</div>
      {tab === 'verses' && <VerseCatalog />}
      {tab !== 'verses' && <>
      <input className={`${field} mb-3`} placeholder="Buscar…" aria-label="Buscar" value={search} onChange={e => setSearch(e.target.value)} />
      {!draft && <Button variant="outline" className="mb-4 w-full" onClick={() => setDraft({ kind: tab, title: '', content: '', reference: '' })}><Plus />Añadir</Button>}
      {draft && <form onSubmit={save} className="card-soft mb-5 space-y-3 p-4">
        <div className="flex justify-between"><h2 className="text-xl font-semibold">{draft.id ? 'Editar' : 'Nuevo'}</h2><button type="button" aria-label="Cerrar" onClick={() => setDraft(null)}><X className="h-4 w-4" /></button></div>
        <input className={field} required maxLength={160} placeholder="Título" aria-label="Título" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        {draft.kind === 'reading' && <input className={field} maxLength={120} placeholder="Cita (ej. Salmos 23:1-6)" value={draft.reference} onChange={e => setDraft({ ...draft, reference: e.target.value })} />}
        <textarea className={field} rows={5} maxLength={10000} placeholder={placeholders[draft.kind]} aria-label="Tus palabras" value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} />
        <Button className="w-full" disabled={busy}>Guardar</Button>
      </form>}

      {!list.length ? <p className="py-10 text-center font-serif text-xl text-muted-foreground">{search ? 'Nada coincide con tu búsqueda.' : 'Aún no hay nada aquí. Lo que escriban aparecerá para los dos.'}</p> :
        <ul className="space-y-3">{list.map(x => <li key={x.id} className="card-soft p-4">
          <h3 className="font-serif text-2xl leading-tight">{x.title}</h3>
          {x.reference && <p className="text-sm text-primary">{x.reference}</p>}
          {x.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{x.content}</p>}
          <p className="mt-2 text-[11px] text-muted-foreground">{ctx.name(x.author_id)} · {formatDay(x.created_at.slice(0, 10))}{x.answered_at ? ' · Respondida 🙌' : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {x.kind === 'petition' && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => supabase.rpc('set_petition_answered', { p_id: x.id, p_answered: !x.answered_at }))}>{x.answered_at ? 'Marcar pendiente' : 'Dios respondió'}</Button>}
            {x.author_id === ctx.uid && <>
              <Button size="sm" variant="ghost" onClick={() => setDraft({ id: x.id, kind: x.kind as SpiritualKind, title: x.title, content: x.content, reference: x.reference })}><Pencil />Editar</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (window.confirm('¿Eliminar definitivamente? No se podrá recuperar.')) void run(() => supabase.rpc('delete_spiritual_item', { p_id: x.id })); }}><Trash2 />Eliminar</Button>
            </>}
          </div>
        </li>)}</ul>}
      </>}
    </Gate>
  </div>;
}

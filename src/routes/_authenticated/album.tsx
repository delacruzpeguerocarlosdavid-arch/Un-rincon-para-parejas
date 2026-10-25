import { createFileRoute } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { ImagePlus, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { ArchiveActions, Gate, Notice, Social, Toolbar, field, useStage3 } from '@/components/Stage3Parts';
import { compressImage, dominicanToday, formatDay, matches, validateImage, type Memory } from '@/lib/stage3';

export const Route = createFileRoute('/_authenticated/album')({
  head: () => ({ meta: [
    { title: 'Álbum de recuerdos · Un lugar para nosotros dos' },
    { name: 'description', content: 'Nuestro álbum privado de fotos, comentarios y reacciones.' },
    { property: 'og:title', content: 'Álbum de recuerdos · Un lugar para nosotros dos' },
    { property: 'og:description', content: 'Fotos y momentos guardados solo para los dos.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Album,
});

type Draft = { id?: string; title: string; date: string; description: string; file?: File; preview?: string };

function Album() {
  const ctx = useStage3();
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState<Memory | null>(null);
  const [stage, setStage] = useState('');
  const d = ctx.query.data;
  const list = (d?.memories ?? []).filter(m => Boolean(m.archived_at) === archived && matches([m.title, m.description], search));
  const current = open && d?.memories.find(m => m.id === open.id);

  function pick(file?: File) {
    if (!file || !draft) return;
    const err = validateImage(file); if (err) { ctx.setNotice(err); return; }
    ctx.setNotice(''); setDraft({ ...draft, file, preview: URL.createObjectURL(file) });
  }
  async function save(e: FormEvent) {
    e.preventDefault(); if (!draft || !ctx.member.data) return;
    if (draft.id) { if ((await ctx.run(() => supabase.rpc('save_memory', { p_id: draft.id as string, p_title: draft.title, p_date: draft.date, p_description: draft.description }))).ok) setDraft(null); return; }
    if (!draft.file) { ctx.setNotice('Elige una foto.'); return; }
    try {
      setStage('Preparando la foto…');
      const blob = await compressImage(draft.file);
      if (blob.size > 5 * 1024 * 1024) throw new Error('La foto sigue siendo demasiado grande después de comprimirla.');
      const path = `${ctx.member.data.space_id}/${crypto.randomUUID()}.jpg`;
      setStage('Subiendo…');
      const up = await supabase.storage.from('memories').upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw new Error('No pudimos subir la foto. Intenta de nuevo.');
      setStage('Guardando…');
      const r = await ctx.run(() => supabase.rpc('save_memory', { p_title: draft.title, p_date: draft.date, p_description: draft.description, p_photo_path: path }));
      if (!r.ok) { await supabase.storage.from('memories').remove([path]); return; }
      setDraft(null);
    } catch (err) { ctx.setNotice(err instanceof Error ? err.message : 'No pudimos guardar el recuerdo.'); }
    finally { setStage(''); }
  }

  return <div>
    <PageHeader title="Álbum de recuerdos" subtitle="Nuestras fotos, solo para los dos." />
    <Gate member={ctx.member} query={ctx.query}>
      <Notice text={ctx.notice} />
      {!draft && <Button className="mb-4 w-full" onClick={() => setDraft({ title: '', date: dominicanToday(), description: '' })}><ImagePlus />Añadir recuerdo</Button>}
      {draft && <form onSubmit={save} className="card-soft mb-5 space-y-3 p-4">
        <div className="flex justify-between"><h2 className="text-xl font-semibold">{draft.id ? 'Editar recuerdo' : 'Nuevo recuerdo'}</h2><button type="button" aria-label="Cerrar" onClick={() => setDraft(null)}><X className="h-4 w-4" /></button></div>
        {!draft.id && <label className="block cursor-pointer rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
          {draft.preview ? <img src={draft.preview} alt="Vista previa" className="mx-auto max-h-56 rounded-lg object-cover" /> : 'Toca para elegir una foto (JPG, PNG o WebP, hasta 15 MB)'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => pick(e.target.files?.[0])} />
        </label>}
        <input className={field} required maxLength={160} placeholder="Título" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
        <label className="block text-xs text-muted-foreground">Fecha del recuerdo<input type="date" required className={field} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
        <textarea className={field} rows={3} maxLength={5000} placeholder="Descripción" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
        <Button className="w-full" disabled={ctx.busy || Boolean(stage)}>{stage || 'Guardar'}</Button>
      </form>}
      <Toolbar search={search} setSearch={setSearch} archived={archived} setArchived={setArchived} />
      {!list.length ? <p className="py-10 text-center font-serif text-xl text-muted-foreground">{archived ? 'No hay recuerdos archivados.' : search ? 'Ningún recuerdo coincide.' : 'Aún no hay fotos. Guardemos el primer recuerdo.'}</p> :
        <div className="grid grid-cols-2 gap-3">{list.map(m => <button key={m.id} onClick={() => setOpen(m)} className="card-blush overflow-hidden p-2 text-left">
          {d?.urls[m.photo_path] ? <img src={d.urls[m.photo_path]} alt={m.title} loading="lazy" className="aspect-square w-full rounded-xl object-cover" /> : <div className="aspect-square w-full rounded-xl bg-muted" />}
          <span className="mt-2 block font-serif text-base font-semibold leading-tight">{m.title}</span>
          <span className="text-[11px] text-muted-foreground">{formatDay(m.memory_date)}</span>
        </button>)}</div>}
      {current && <div className="fixed inset-0 z-20 overflow-y-auto bg-background/95 p-5" role="dialog" aria-label={current.title}>
        <div className="mx-auto max-w-md pb-24">
          <button className="mb-3" aria-label="Cerrar" onClick={() => setOpen(null)}><X /></button>
          {d?.urls[current.photo_path] && <img src={d.urls[current.photo_path]} alt={current.title} className="w-full rounded-2xl object-contain" />}
          <h2 className="mt-4 text-3xl font-medium">{current.title}</h2>
          <p className="text-xs text-muted-foreground">{formatDay(current.memory_date)} · {ctx.name(current.author_id)}</p>
          {current.description && <p className="mt-3 whitespace-pre-wrap break-words">{current.description}</p>}
          {current.author_id === ctx.uid && <div className="mt-3 flex flex-wrap gap-2">
            {!current.archived_at && <Button size="sm" variant="outline" onClick={() => { setDraft({ id: current.id, title: current.title, date: current.memory_date, description: current.description }); setOpen(null); }}><Pencil />Editar</Button>}
            <ArchiveActions type="memory" id={current.id} archivedAt={current.archived_at} run={ctx.run} busy={ctx.busy} onDeleted={async p => { if (p) await supabase.storage.from('memories').remove([p]); }} onDone={() => setOpen(null)} />
          </div>}
          {!current.archived_at && <Social type="memory" id={current.id} ctx={ctx} />}
        </div>
      </div>}
    </Gate>
  </div>;
}

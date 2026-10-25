import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookHeart, Send, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { correspondenceOptions } from '@/lib/correspondence';
import { feelingSpaces, partnerWords } from '@/lib/emotions';
import { supabase } from '@/integrations/supabase/client';
import { useStage3, field } from '@/components/Stage3Parts';
import { dominicanToday } from '@/lib/stage3';
import { feelingsSchema } from '@/lib/writing-validation';

export function FeelingSpaces() {
  const [space, setSpace] = useState<string>('amor');
  const [kind, setKind] = useState<'shared' | 'private'>('shared');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const ctx = useStage3();
  const query = useQuery({ ...correspondenceOptions, enabled: Boolean(ctx.uid) });
  const selected = feelingSpaces.find(s => s.id === space) ?? feelingSpaces[0];
  const words = selected.folder && ctx.uid ? partnerWords(query.data?.texts ?? [], ctx.uid, selected.folder) : [];
  async function save(e: FormEvent) {
    e.preventDefault(); setSaved(false);
    if (ctx.busy) return;
    const parsed = feelingsSchema.safeParse({ kind, title, content });
    if (!parsed.success) { ctx.setNotice(parsed.error.issues[0]?.message ?? 'Revisa tus palabras.'); return; }
    const result = await ctx.run(() => supabase.rpc('save_journal_entry', { p_kind: parsed.data.kind, p_title: parsed.data.title, p_content: parsed.data.content, p_date: dominicanToday() }));
    if (result.ok) { setTitle(''); setContent(''); setSaved(true); }
  }
  return <section className="border-t border-border pt-5" aria-label="Un espacio para ti">
    <h2 className="mb-3 text-3xl">Un espacio para ti</h2>
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3" role="tablist" aria-label="Espacios emocionales">{feelingSpaces.map(s => <Button key={s.id} role="tab" aria-selected={s.id === space} aria-controls="feeling-space-panel" variant={s.id === space ? 'default' : 'outline'} className="h-auto min-h-14 whitespace-normal py-3" onClick={() => setSpace(s.id)}><span aria-hidden="true">{s.face}</span>{s.label}</Button>)}</div>
    <div id="feeling-space-panel" role="tabpanel" aria-label={selected.label}>
      <h3 className="mb-3 font-serif text-2xl">{selected.label}</h3>
      {selected.folder ? <>
        {query.isPending ? <p role="status">Un momento…</p> : query.error ? <div role="alert"><p>No pudimos cargar las palabras.</p><Button variant="ghost" onClick={() => query.refetch()}>Reintentar</Button></div> : words.length ? <div className="space-y-4">{words.map(t => <article key={t.id} className="border-l-2 border-primary pl-4"><h4 className="font-serif text-xl">{t.title}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{t.content}</p></article>)}</div> : <p className="font-serif text-xl text-muted-foreground">Todavía no hay palabras de tu pareja en este espacio.</p>}
        <Button asChild variant="link" className="h-auto whitespace-normal px-0"><Link to="/palabras" search={{ folder: selected.folder, partner: true }}><BookHeart />Mis palabras para ti</Link></Button>
        {space === 'fe' && <Button asChild variant="link" className="px-0"><Link to="/espiritual">Nuestro tiempo con Dios</Link></Button>}
      </> : <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-2"><Button type="button" variant={kind === 'shared' ? 'default' : 'outline'} aria-pressed={kind === 'shared'} onClick={() => { setKind('shared'); setSaved(false); }}><Users />Con mi pareja</Button><Button type="button" variant={kind === 'private' ? 'default' : 'outline'} aria-pressed={kind === 'private'} onClick={() => { setKind('private'); setSaved(false); }}><Lock />Solo para mí</Button></div>
        <p className="text-sm text-muted-foreground">{kind === 'shared' ? 'Tu pareja podrá leer esta entrada.' : 'Solo tú podrás leer esta entrada.'}</p>
        <label className="block text-sm">Título<input className={`${field} mt-1`} required maxLength={160} value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }} /></label>
        <label className="block text-sm">Cómo me siento<textarea className={`${field} mt-1`} required rows={7} maxLength={30000} value={content} onChange={e => { setContent(e.target.value); setSaved(false); }} /></label>
        <Button disabled={ctx.busy || !title.trim() || !content.trim()}><Send />{ctx.busy ? 'Guardando…' : 'Guardar en mi diario'}</Button>
        {saved && <p role="status" className="text-sm text-primary">Tu entrada quedó guardada.</p>}
        {ctx.notice && <p role="alert" className="text-sm text-destructive">{ctx.notice}</p>}
        <Button asChild variant="link" className="px-0"><Link to="/diario">Ver mis diarios</Link></Button>
      </form>}
    </div>
  </section>;
}
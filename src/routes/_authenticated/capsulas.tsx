import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LockKeyhole, MailOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Gate, field, Notice } from '@/components/Stage3Parts';
import { membershipOptions } from '@/lib/message-bank';
import { capsuleOptions, countdown, santoDomingoInstant, blobData } from '@/lib/completion';
import { compressImage, validateImage } from '@/lib/stage3';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/capsulas')({ head: () => ({ meta: [
  { title: 'Cápsulas del tiempo · Un lugar para nosotros dos' }, { name: 'description', content: 'Cartas y recuerdos sellados para nuestro futuro.' },
  { property: 'og:title', content: 'Cápsulas del tiempo · Nuestro futuro' }, { property: 'og:description', content: 'Recuerdos privados que esperan su momento.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }), component: Capsules });
function Capsules() {
  const member = useQuery(membershipOptions), q = useQuery({ ...capsuleOptions, enabled: Boolean(member.data) }), qc = useQueryClient();
  const [now, setNow] = useState(Date.now()), [form, setForm] = useState(false), [title, setTitle] = useState(''), [kind, setKind] = useState('letter'), [text, setText] = useState(''), [date, setDate] = useState(''), [photo, setPhoto] = useState<File | null>(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [opened, setOpened] = useState<Record<string, { content: string; photo_data: string | null }>>({});
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return <div><Button asChild variant="ghost" size="sm"><Link to="/espacio">Nuestro espacio</Link></Button><PageHeader title="Cápsulas del tiempo" subtitle="Para nosotros, en otro momento." /><Gate member={member} query={q}><Notice text={notice} />
    <Button variant="outline" onClick={() => setForm(!form)}><Plus />Nueva cápsula</Button>
    {form && <form className="my-4 space-y-3 border-y border-border py-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setNotice(''); try { let data: string | null = null; if (kind === 'photo') { if (!photo) throw new Error('Selecciona una foto.'); const error = validateImage(photo); if (error) throw new Error(error); data = await blobData(await compressImage(photo, 1200, .8)); } const r = await supabase.rpc('seal_capsule', { p_title: title, p_kind: kind, p_opens_at: santoDomingoInstant(date), p_content: text, ...(data ? { p_photo: data } : {}) }); if (r.error) throw r.error; setTitle(''); setText(''); setPhoto(null); setForm(false); setNotice('Cápsula sellada. Su contenido espera la fecha de apertura.'); await qc.invalidateQueries({ queryKey: ['capsules'] }); } catch (e) { setNotice(e instanceof Error ? e.message : 'No pudimos sellar la cápsula.'); } finally { setBusy(false); } }}>
      <label className="block text-sm">Título<input className={field} required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block text-sm">Contenido<select className={field} value={kind} onChange={e => { setKind(e.target.value); setText(''); setPhoto(null); }}><option value="letter">Carta</option><option value="message">Mensaje</option><option value="photo">Foto</option></select></label>
      {kind === 'photo' ? <input aria-label="Foto de la cápsula" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setPhoto(e.target.files?.[0] ?? null)} /> : <textarea aria-label="Mensaje sellado" className={field} rows={6} required maxLength={10000} value={text} onChange={e => setText(e.target.value)} />}
      <label className="block text-sm">Apertura · hora de Santo Domingo<input className={field} type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} /></label>
      <p className="text-xs text-muted-foreground">Una vez sellada no podrás leerla ni cambiarla hasta su apertura.</p><Button disabled={busy}><LockKeyhole />{busy ? 'Sellando…' : 'Sellar cápsula'}</Button>
    </form>}
    <ul className="mt-5 space-y-4">{q.data?.map(c => { const t = countdown(c.opens_at, now), ready = new Date(c.opens_at).getTime() <= now, content = opened[c.id]; return <li className={`card-soft overflow-hidden p-5 ${content ? 'capsule-open' : ''}`} key={c.id}><div className="flex gap-3"><LockKeyhole className="mt-1 h-5 w-5 text-primary" /><div className="min-w-0"><h2 className="break-words text-2xl">{c.title}</h2><p className="text-xs text-muted-foreground">{new Date(c.opens_at).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'long', timeStyle: 'short' })} · Santo Domingo</p></div></div>
      {content ? <div className="mt-4">{content.photo_data && <img src={content.photo_data} alt={c.title} className="w-full rounded-md" />}<p className="whitespace-pre-wrap break-words text-sm">{content.content}</p></div> : ready ? <Button disabled={busy} className="mt-4" variant="outline" onClick={async () => { setBusy(true); setNotice(''); const r = await supabase.rpc('open_capsule', { p_id: c.id }); if (r.error) setNotice('Todavía no llegó la hora de apertura o no tienes acceso.'); else setOpened(v => ({ ...v, [c.id]: r.data as { content: string; photo_data: string | null } })); setBusy(false); }}><MailOpen />Abrir cápsula</Button> : <div className="mt-4 grid grid-cols-4 gap-2 text-center tabular-nums">{[[t.days,'días'],[t.hours,'horas'],[t.minutes,'min'],[t.seconds,'seg']].map(([n,label]) => <div key={label}><span className="block font-serif text-3xl">{n}</span><span className="text-xs text-muted-foreground">{label}</span></div>)}</div>}
    </li>; })}</ul>{q.data?.length === 0 && <p className="py-10 text-center font-serif text-2xl text-muted-foreground">Un recuerdo para nuestro futuro.</p>}
  </Gate></div>;
}
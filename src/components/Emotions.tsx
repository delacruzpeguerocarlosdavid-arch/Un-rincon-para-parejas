import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight, BookHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { membershipOptions, spaceStatusOptions } from '@/lib/message-bank';
import { emotions, emotionsOptions, emotionFor, momentFolders } from '@/lib/emotions';
import { formatDate } from '@/lib/correspondence';
import { supabase } from '@/integrations/supabase/client';
import { FeelingSpaces } from '@/components/FeelingSpaces';

export function Emotions({ compact = false }: { compact?: boolean }) {
  const member = useQuery(membershipOptions);
  const status = useQuery({ ...spaceStatusOptions, enabled: Boolean(member.data) });
  const query = useQuery({ ...emotionsOptions, enabled: Boolean(member.data) });
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [moment, setMoment] = useState('');
  const own = query.data?.find(e => e.user_id === member.data?.user_id);
  const folder = moment || emotionFor(own?.emotion ?? '')?.folder;
  async function save(id: string) {
    setBusy(true); setError('');
    try {
      const { error: failure } = await supabase.rpc('save_daily_emotion', { p_emotion: id });
      if (failure) throw failure;
      setMoment(emotionFor(id)?.folder ?? '');
      await qc.invalidateQueries({ queryKey: ['emotions'] });
    } catch { setError('No pudimos guardar tu emoción. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }
  return <section className={compact ? 'border-y border-border py-5' : 'space-y-5'} aria-label="Cómo te sientes">
    {compact && <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl">Cómo te sientes</h2><Button asChild variant="ghost" size="icon" aria-label="Ver emociones"><Link to="/sentimientos"><ChevronRight /></Link></Button></div>}
    {member.isPending ? <p className="text-sm text-muted-foreground">Un momento…</p> : !member.data ? <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-card/80 to-accent/20 p-5 backdrop-blur-md"><p className="font-serif text-xl font-medium">Un espacio para lo que sentimos.</p><p className="mt-1 text-xs text-muted-foreground">Comparte cómo late tu corazón hoy.</p><Button asChild variant="link" className="px-0 mt-1"><Link to="/auth">Entrar a nuestro espacio</Link></Button></div> : (query.error || status.error) ? <div role="alert" className="rounded-2xl border border-border/50 bg-card/60 p-4"><p className="text-sm">No pudimos cargar las emociones.</p><Button variant="ghost" size="sm" onClick={() => { void query.refetch(); void status.refetch(); }}>Reintentar</Button></div> : <>
      {query.isPending || status.isPending ? <p className="text-sm text-muted-foreground">Un momento…</p> : <div className="space-y-3" aria-live="polite">{status.data?.members.map(person => {
        const record = query.data?.find(e => e.user_id === person.user_id);
        const emotion = emotionFor(record?.emotion ?? '');
        const name = person.nickname || person.display_name || (person.user_id === member.data?.user_id ? 'Tú' : 'Tu pareja');
        return <div key={person.user_id} className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/30 text-2xl" aria-hidden="true">{emotion?.face ?? '🤍'}</span><div className="min-w-0"><p className="break-words text-sm">{name}{emotion ? ` se siente ${emotion.phrase}` : ' aún no ha compartido su emoción hoy'}</p>{record && <time dateTime={record.updated_at} className="text-xs text-muted-foreground">{formatDate(record.updated_at)}</time>}</div></div>;
      })}{status.data?.members.length === 1 && <Button asChild variant="link" className="px-0"><Link to="/espacio">Invitar a mi pareja</Link></Button>}</div>}
      {!compact && <>
        <FeelingSpaces />
        <div className="grid grid-cols-3 gap-3" aria-label="Tu emoción de hoy">{emotions.map(e => <Button key={e.id} variant="outline" disabled={busy || query.isPending} aria-pressed={own?.emotion === e.id} onClick={() => void save(e.id)} className={`h-24 min-w-0 flex-col gap-1 whitespace-normal px-2 text-center text-xs ${own?.emotion === e.id ? 'bg-accent/40 ring-2 ring-primary' : 'bg-card'}`}><span className="text-2xl" aria-hidden="true">{e.face}</span><span>{e.label}</span></Button>)}</div>
        {busy && <p role="status" className="text-sm">Guardando tu emoción…</p>}
        {folder && <div className="border-l-2 border-primary pl-4"><h2 className="text-2xl">{folder}</h2><Button asChild variant="link" className="h-auto whitespace-normal px-0 text-left"><Link to="/palabras" search={{ folder, partner: true }}><BookHeart className="shrink-0" />Leer las palabras de mi pareja</Link></Button></div>}
        <div className="border-t border-border pt-5"><h2 className="mb-3 text-2xl">Palabras para este momento</h2><div className="space-y-1">{momentFolders.map(f => <Button key={f} asChild variant="ghost" className="h-auto w-full justify-between whitespace-normal py-3 text-left"><Link to="/palabras" search={{ folder: f, partner: true }}><span>{f}</span><ChevronRight className="shrink-0" /></Link></Button>)}</div></div>
      </>}
    </>}
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
  </section>;
}
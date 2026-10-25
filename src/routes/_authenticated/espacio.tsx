import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Copy, KeyRound, LogOut, RefreshCw, BookHeart, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { avatars, categories, membershipOptions, spaceStatusOptions, type Membership } from '@/lib/message-bank';
import { SpaceSettings } from '@/components/SpaceSettings';
import { inviteSchema } from '@/lib/writing-validation';
import { RomanticBookExporter } from '@/components/RomanticBookExporter';

export const Route = createFileRoute('/_authenticated/espacio')({
  head: () => ({ meta: [
    { title: 'Nuestro espacio · Un lugar para nosotros dos' }, { name: 'description', content: 'Estado del espacio privado, invitación y perfil.' },
    { property: 'og:title', content: 'Nuestro espacio privado' }, { property: 'og:description', content: 'Conecta nuestras dos cuentas y cuida tu perfil.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Space,
});

const input = 'mt-1 w-full rounded-md border border-input bg-card p-2';
const fmt = (d: string) => new Date(d).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium', timeStyle: 'short' });

function Space() {
  const member = useQuery(membershipOptions);
  const status = useQuery({ ...spaceStatusOptions, enabled: Boolean(member.data) });
  const qc = useQueryClient(); const navigate = useNavigate();
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(''); const [newCode, setNewCode] = useState<{ code: string; expires_at: string } | null>(null);
  const refresh = () => Promise.all(['membership', 'space', 'bank', 'daily'].map(k => qc.invalidateQueries({ queryKey: [k] })));
  async function run<T>(fn: () => PromiseLike<{ data: T; error: { message: string } | null }>) {
    setBusy(true); setNotice('');
    try { const { data, error } = await fn(); if (error) throw new Error(error.message); return data; }
    catch (e) { setNotice(e instanceof Error ? e.message : 'No pudimos completar el cambio.'); return undefined; } finally { setBusy(false); }
  }
  async function redeem(e: FormEvent) {
    e.preventDefault();
    const res = await run(() => supabase.rpc('redeem_invite_code', { p_code: code }));
    const err = (res as { error?: string } | null | undefined)?.error;
    if (err) { setNotice(err); return; }
    if (res) { setCode(''); setNotice('¡Bienvenida a nuestro espacio!'); await refresh(); }
  }
  async function generate() {
    const res = await run(() => supabase.rpc('create_invite_code'));
    if (res) {
      const parsed = inviteSchema.safeParse(res);
      if (!parsed.success) { setNotice('No pudimos mostrar el código. Intenta generarlo de nuevo.'); return; }
      setNewCode(parsed.data); await refresh();
    }
  }
  async function copyCode() {
    if (!newCode) return;
    try {
      if (!navigator.clipboard?.writeText) { setNotice('Selecciona el código para copiarlo manualmente.'); return; }
      await navigator.clipboard.writeText(newCode.code); setNotice('Código copiado.');
    } catch { setNotice('No pudimos copiarlo automáticamente. Selecciona el código y cópialo.'); }
  }
  async function shareCode() {
    if (!newCode) return;
    if (!navigator.share) { await copyCode(); return; }
    try { await navigator.share({ title: 'Nuestro Rincón', text: `Código privado: ${newCode.code}\nVence: ${fmt(newCode.expires_at)}\n${window.location.origin}/espacio` }); }
    catch (error) { if (error instanceof Error && error.name === 'AbortError') return; await copyCode(); }
  }
  async function revoke() { if ((await run(() => supabase.rpc('revoke_invite_code'))) !== undefined) { setNewCode(null); await refresh(); } }
  async function signOut() { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }); }

  return <div>
    <div className="flex items-center justify-between"><Button asChild variant="ghost" size="sm"><Link to="/banco"><BookHeart />Banco de mensajes</Link></Button><Button variant="ghost" size="icon" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={signOut}><LogOut /></Button></div>
    <PageHeader title="Nuestro espacio" subtitle="Solo dos cuentas, solo nosotros." />
    {member.isPending ? <p>Un momento…</p> : member.error ? <p role="alert">No pudimos comprobar tu acceso: {member.error.message}</p> : !member.data ?
      <form onSubmit={redeem} className="card-soft space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-2xl"><KeyRound className="h-5 w-5" />Unirme con un código</h2>
        <p className="text-sm text-muted-foreground">Ingresa el código privado que te compartió Carlos. Solo se puede usar una vez.</p>
        <input required aria-label="Código de invitación" autoComplete="off" placeholder="XXXXX-XXXXX" maxLength={20} value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={`${input} text-center font-mono tracking-widest`} />
        <Button disabled={busy} className="w-full">{busy ? 'Comprobando…' : 'Unirme al espacio'}</Button>
      </form> : <>
      <section className="card-soft mb-5 p-5">
        <h2 className="text-2xl">Estado del espacio</h2>
        {status.isPending ? <p className="text-sm">Un momento…</p> : status.error ? <p className="text-sm">No pudimos cargar el estado.</p> : <>
          <ul className="mt-3 space-y-2">{status.data?.members.map(m => <li key={m.user_id} className="flex items-center gap-3"><span className="text-2xl" aria-hidden>{avatars[m.avatar] ?? '🌷'}</span><span className="text-sm">{m.display_name || 'Sin nombre'}{m.nickname && ` · “${m.nickname}”`}<span className="block text-xs text-muted-foreground">{m.role === 'admin' ? 'Administrador' : 'Pareja'}</span></span></li>)}</ul>
          <p className="mt-3 text-sm text-muted-foreground">{(status.data?.members.length ?? 0) >= 2 ? 'Nuestro espacio está completo: dos cuentas conectadas.' : 'Esperando a la segunda cuenta.'}</p>
          {member.data.role === 'admin' && (status.data?.members.length ?? 0) < 2 && <div className="mt-4 space-y-3 border-t border-border pt-4">
            <h3 className="text-xl">Invitar a mi pareja</h3>
            {newCode ? <div><p className="text-xs text-muted-foreground">Compártelo en privado. No se volverá a mostrar.</p><div className="mt-1 flex flex-wrap items-center gap-2"><code className="select-all rounded-md bg-muted px-3 py-2 font-mono text-lg tracking-widest">{newCode.code}</code><Button variant="ghost" size="icon" aria-label="Copiar código" onClick={() => void copyCode()}><Copy /></Button><Button variant="ghost" size="icon" title="Compartir código" aria-label="Compartir código" onClick={() => void shareCode()}><Share2 /></Button></div><p className="mt-1 text-xs text-muted-foreground">Vence: {fmt(newCode.expires_at)}</p></div>
              : status.data?.invite ? <p className="text-sm">Hay un código activo hasta {fmt(status.data.invite.expires_at)}. Si se perdió, genera uno nuevo.</p>
              : <p className="text-sm">No hay un código activo.</p>}
            <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={generate}><RefreshCw />{status.data?.invite || newCode ? 'Regenerar código' : 'Crear código'}</Button>{(status.data?.invite || newCode) && <Button size="sm" variant="ghost" disabled={busy} onClick={revoke}>Anular código</Button>}</div>
          </div>}
        </>}
      </section>
      <ProfileForm member={member.data} busy={busy} onSave={async v => { if ((await run(() => supabase.rpc('update_my_profile', v))) !== undefined) { setNotice('Perfil guardado.'); await refresh(); } }} />
      <div className="card-soft my-5 flex items-center justify-between p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold">¿Cuánto nos conocemos?</h3>
          <p className="text-xs text-muted-foreground">Preguntas íntimas con respuestas secretas y revelación simultánea.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/quiz">Jugar hoy</Link>
        </Button>
      </div>
      <div className="card-soft my-5 flex items-center justify-between p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold">Regalos de honor</h3>
          <p className="text-xs text-muted-foreground">Envía y recibe detalles especiales inspirados en Levi.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/regalos">Ver regalos</Link>
        </Button>
      </div>
      <div className="my-5">
        <RomanticBookExporter />
      </div>
    </>}
    <SpaceSettings />
    {notice && <p role="status" className="mt-4 break-words text-sm">{notice}</p>}
  </div>;
}

function ProfileForm({ member, busy, onSave }: { member: Membership; busy: boolean; onSave: (v: { p_display_name: string; p_nickname: string; p_avatar: string; p_preferences: { favorite_category?: string; greeting?: string; show_verse: boolean } }) => void }) {
  const [name, setName] = useState(member.display_name); const [nick, setNick] = useState(member.nickname);
  const [avatar, setAvatar] = useState(member.avatar); const [fav, setFav] = useState(member.preferences?.favorite_category ?? '');
  const [greeting, setGreeting] = useState(member.preferences?.greeting ?? ''); const [verse, setVerse] = useState(member.preferences?.show_verse ?? true);
  useEffect(() => { setName(member.display_name); setNick(member.nickname); setAvatar(member.avatar); }, [member.display_name, member.nickname, member.avatar]);
  return <form className="card-soft space-y-3 p-5" onSubmit={e => { e.preventDefault(); onSave({ p_display_name: name, p_nickname: nick, p_avatar: avatar, p_preferences: { ...(fav ? { favorite_category: fav } : {}), ...(greeting ? { greeting } : {}), show_verse: verse } }); }}>
    <h2 className="text-2xl">Mi perfil</h2>
    <fieldset><legend className="text-sm">Avatar</legend><div className="mt-1 flex flex-wrap gap-2">{Object.entries(avatars).map(([k, v]) => <button type="button" key={k} aria-label={k} aria-pressed={avatar === k} onClick={() => setAvatar(k)} className={`rounded-full border p-2 text-2xl ${avatar === k ? 'border-primary bg-accent/50' : 'border-border'}`}>{v}</button>)}</div></fieldset>
    <label className="block text-sm">Nombre<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className={input} /></label>
    <label className="block text-sm">Apodo<input maxLength={40} value={nick} onChange={e => setNick(e.target.value)} placeholder="Cómo te gusta que te llamen" className={input} /></label>
    <label className="block text-sm">Saludo preferido<input maxLength={60} value={greeting} onChange={e => setGreeting(e.target.value)} placeholder="Buenos días, mi amor" className={input} /></label>
    <label className="block text-sm">Categoría favorita<select value={fav} onChange={e => setFav(e.target.value)} className={input}><option value="">Sin preferencia</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verse} onChange={e => setVerse(e.target.checked)} />Mostrar “Un momento con Dios”</label>
    <Button disabled={busy}>Guardar perfil</Button>
  </form>;
}

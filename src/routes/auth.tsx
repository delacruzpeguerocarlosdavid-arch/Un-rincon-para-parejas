import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { membershipOptions } from '@/lib/message-bank';
import { PageHeader } from '@/components/AppShell';

export const Route = createFileRoute('/auth')({ head: () => ({ meta: [
  { title: 'Nuestro acceso privado · Un lugar para nosotros dos' }, { name: 'description', content: 'Accede a nuestro espacio privado.' },
  { property: 'og:title', content: 'Nuestro acceso privado' }, { property: 'og:description', content: 'Un lugar para nosotros dos, solo para nosotros.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }), component: Auth });
function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const member = useQuery(membershipOptions); const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error; setNotice('Revisa tu correo para cambiar tu contraseña.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name } } });
        if (error) throw error;
        if (!data.session) setNotice('Revisa tu correo y confirma tu cuenta antes de entrar.');
        else await navigate({ to: '/banco' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
        await navigate({ to: '/banco' });
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'No pudimos completar el acceso.'); }
    finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') {
    setBusy(true); setNotice('');
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.error) throw result.error; if (!result.redirected) await navigate({ to: '/banco' }); }
    catch { setNotice('No pudimos iniciar sesión. Inténtalo de nuevo.'); } finally { setBusy(false); }
  }
  return <div><Heart className="mb-3 h-7 w-7 text-primary" strokeWidth={1} /><PageHeader title="Solo nosotros dos" subtitle="Nuestro rincón privado." />
    {member.data ? <Button asChild><Link to="/banco">Ir al banco de mensajes</Link></Button> : <>
      <div className="mb-5 flex gap-2"><Button variant={mode === 'login' ? 'default' : 'ghost'} onClick={() => { setMode('login'); setNotice(''); }}>Entrar</Button><Button variant={mode === 'signup' ? 'default' : 'ghost'} onClick={() => { setMode('signup'); setNotice(''); }}>Crear cuenta</Button></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <label className="block text-sm">Tu nombre<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card p-3" /></label>}
        <label className="block text-sm">Correo<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card p-3" /></label>
        {mode !== 'forgot' && <label className="block text-sm">Contraseña<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card p-3" /></label>}
        <Button disabled={busy} type="submit" className="w-full">{busy ? 'Un momento…' : mode === 'signup' ? 'Crear mi cuenta' : mode === 'forgot' ? 'Enviar enlace' : 'Entrar'}</Button>
      </form>
      <Button variant="link" className="mt-2" onClick={() => setMode('forgot')}>Olvidé mi contraseña</Button>
      <div className="mt-5 grid gap-2"><Button variant="outline" disabled={busy} onClick={() => social('google')}>Continuar con Google</Button><Button variant="outline" disabled={busy} onClick={() => social('lovable')}>Continuar con Lovable</Button></div>
    </>}
    {notice && <p role="status" className="mt-4 text-sm text-foreground">{notice}</p>}
  </div>;
}
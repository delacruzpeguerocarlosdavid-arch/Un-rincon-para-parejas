import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
export const Route = createFileRoute('/reset-password')({ head: () => ({ meta: [
  { title: 'Nueva contraseña · Un lugar para nosotros dos' }, { name: 'description', content: 'Recupera el acceso a tu espacio privado.' },
  { property: 'og:title', content: 'Nueva contraseña' }, { property: 'og:description', content: 'Recupera el acceso a nuestro rincón.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
] }), component: Reset });
function Reset() {
  const [valid, setValid] = useState(false); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setValid(new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery' || new URLSearchParams(window.location.search).get('type') === 'recovery'); }, []);
  async function submit(e: FormEvent) { e.preventDefault(); if (password !== confirm) { setNotice('Las contraseñas no coinciden.'); return; } setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setNotice(error ? error.message : 'Tu contraseña ha sido actualizada.'); setBusy(false); }
  return <div><PageHeader title="Nueva contraseña" />{valid ? <form onSubmit={submit} className="space-y-4"><label className="block text-sm">Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card p-3" /></label><label className="block text-sm">Confirmar contraseña<input type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card p-3" /></label><Button disabled={busy}>Guardar contraseña</Button></form> : <p className="text-sm">Abre el enlace de recuperación que recibiste por correo.</p>}{notice && <p className="mt-4 text-sm" role="status">{notice}</p>}</div>;
}
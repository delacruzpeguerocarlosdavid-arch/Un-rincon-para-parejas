import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { membershipOptions } from '@/lib/message-bank';
import { RITUAL_REWARD, ritualOptions, ritualStreak, ritualTasks } from '@/lib/ritual';
import { supabase } from '@/integrations/supabase/client';

export function DailyRitual() {
  const member = useQuery(membershipOptions), q = useQuery({ ...ritualOptions, enabled: Boolean(member.data) }), qc = useQueryClient();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  if (!member.data || !q.data) return null;
  const s = q.data.status, done = ritualTasks.filter(t => s[t.key]).length, all = done === ritualTasks.length;
  const streak = ritualStreak(q.data.days, s.day);
  return <section className="card-soft mt-5 p-5" aria-label="Ritual de cuidado de hoy">
    <div className="flex items-baseline justify-between gap-2"><h2 className="text-2xl">Ritual de hoy</h2><span className="text-sm text-muted-foreground">🔥 {streak} {streak === 1 ? 'día' : 'días'} seguidos</span></div>
    <p className="text-xs text-muted-foreground">El lirio y Appa necesitan a los dos cada día. Se reinicia a medianoche (Santo Domingo).</p>
    <div className="my-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${done / ritualTasks.length * 100}%` }} /></div>
    <ul className="grid grid-cols-2 gap-2">{ritualTasks.map(t => <li key={t.key}><Link to={t.to} className={`flex items-center gap-2 rounded-lg border border-border p-2 text-sm transition ${s[t.key] ? 'bg-secondary/60 line-through opacity-70' : 'hover:bg-muted'}`}><span>{s[t.key] ? '✅' : t.icon}</span>{t.label}</Link></li>)}</ul>
    {s.claimed ? <p className="mt-3 text-center font-serif text-lg">Ritual cumplido hoy 🌷 Gracias por cuidar nuestro hogar.</p>
      : <Button className="mt-3 w-full" disabled={!all || busy} onClick={async () => { setBusy(true); const r = await supabase.rpc('claim_daily_ritual'); setMsg(r.error ? 'Aún falta algún cuidado de hoy.' : `¡Ritual completo! +${RITUAL_REWARD.coins} monedas · +${RITUAL_REWARD.exp} EXP para Appa`); await qc.invalidateQueries({ queryKey: ['ritual'] }); await qc.invalidateQueries({ queryKey: ['appa'] }); setBusy(false); }}>
        {all ? `Completar ritual · +${RITUAL_REWARD.coins} monedas` : `Faltan ${ritualTasks.length - done} cuidados`}</Button>}
    {msg && <p className="mt-2 text-center text-sm" role="status">{msg}</p>}
  </section>;
}

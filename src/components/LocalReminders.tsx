import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { membershipOptions, dominicanDate } from '@/lib/message-bank';
import { supabase } from '@/integrations/supabase/client';
import { reminderDue } from '@/lib/stage3';
import { reminderTimeReached, type ReminderSettings } from '@/lib/reminders';
export function LocalReminders() {
  const member = useQuery(membershipOptions); const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!member.data) return;
    const uid = member.data.user_id;
    async function check() {
      try {
        const raw = localStorage.getItem(`reminders:${uid}`); if (!raw) return;
        const settings = JSON.parse(raw) as ReminderSettings, today = dominicanDate();
        if (!settings.enabled || !reminderTimeReached(new Date(), settings.time)) return;
        const r = await supabase.from('special_dates').select('*').is('archived_at', null); if (r.error) return;
        for (const item of r.data ?? []) {
          const key = `reminded:${uid}:${today}:${item.id}`;
          if (!reminderDue(item, today) || localStorage.getItem(key)) continue;
          setNotice(`🤍 ${item.name}`);
          if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('Un lugar para nosotros dos', { body: item.name, tag: key }); } catch { /* In-app reminder remains available. */ } }
          localStorage.setItem(key, '1');
        }
      } catch { /* Storage may be unavailable on this device. */ }
    }
    void check(); const interval = setInterval(() => void check(), 60_000); return () => clearInterval(interval);
  }, [member.data]);
  return notice ? <p role="status" className="mb-3 rounded-md border border-border bg-accent/30 p-3 text-sm">{notice}</p> : null;
}
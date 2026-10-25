import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Preferences = { favorite_category?: string; greeting?: string; show_verse?: boolean };
export type Membership = { user_id: string; space_id: string; role: 'admin' | 'member'; display_name: string; nickname: string; avatar: string; preferences: Preferences };
export const avatars: Record<string, string> = { lirio: '🌷', corazon: '💗', luna: '🌙', sol: '☀️', estrella: '✨', appa: '☁️' };
export type SpaceStatus = { members: { user_id: string; role: 'admin' | 'member'; display_name: string; nickname: string; avatar: string }[]; invite: { expires_at: string; created_at: string } | null };
export const spaceStatusOptions = queryOptions({ queryKey: ['space'], queryFn: async () => {
  const { data, error } = await supabase.rpc('get_space_status');
  if (error) throw error;
  return data as SpaceStatus | null;
}});
export type Daily = Tables<'daily_history'>;
export const categories = ['amor', 'ánimo', 'fe', 'tristeza', 'alegría', 'tranquilidad', 'reconciliación'];
export function dominicanDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value).join('-');
}
export const membershipOptions = queryOptions({ queryKey: ['membership'], queryFn: async () => {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth?.user) return null;
  const { data, error } = await supabase.rpc('ensure_membership');
  if (error) return null;
  return data as Membership | null;
}});
export const dailyOptions = queryOptions({ queryKey: ['daily'], queryFn: async () => {
  const { data, error } = await supabase.rpc('get_daily_message');
  if (error) throw error;
  return data as Daily | null;
}, refetchInterval: () => {
  const now = new Date();
  const next = new Date(`${dominicanDate(now)}T00:00:00-04:00`).getTime() + 86400000;
  return Math.max(1000, Math.min(60000, next - now.getTime()));
}, staleTime: 0 });
export const bankOptions = queryOptions({ queryKey: ['bank'], queryFn: async () => {
  const [messages, profiles, history] = await Promise.all([
    supabase.from('bank_messages').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,display_name'),
    supabase.from('daily_history').select('*').order('day', { ascending: false }),
  ]);
  if (messages.error) throw messages.error;
  if (profiles.error) throw profiles.error;
  if (history.error) throw history.error;
  return { messages: messages.data, profiles: profiles.data, history: history.data };
}});
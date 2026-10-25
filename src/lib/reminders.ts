export type ReminderSettings = { enabled: boolean; time: string };
export function reminderTimeReached(now: Date, time: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now) >= time;
}
import { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles } from 'lucide-react';

interface LoveCounterWidgetProps {
  startDate?: string;
}

export function LoveCounterWidget({ startDate }: LoveCounterWidgetProps) {
  // Fecha guardada o por defecto
  const [anniversary, setAnniversary] = useState<string>(() => {
    if (startDate) return startDate;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('love_anniversary_date') || '2024-01-01T00:00:00';
    }
    return '2024-01-01T00:00:00';
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newDate, setNewDate] = useState(anniversary.split('T')[0]);

  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(anniversary).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTime({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [anniversary]);

  const saveCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    const full = `${newDate}T00:00:00`;
    setAnniversary(full);
    if (typeof window !== 'undefined') {
      localStorage.setItem('love_anniversary_date', full);
    }
    setIsEditing(false);
  };

  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-card/85 via-card/75 to-rose-100/30 dark:to-rose-950/20 p-5 shadow-lg backdrop-blur-md transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-rose-100/60 dark:border-rose-900/40">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
          <h2 className="font-serif text-lg font-semibold tracking-wide text-foreground">
            Nuestro tiempo juntos
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          title="Cambiar fecha de aniversario"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancelar' : 'Fijar fecha'}</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={saveCustomDate} className="py-3 space-y-2">
          <label className="block text-xs text-muted-foreground">
            ¿Cuándo comenzó nuestra historia de amor?
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      ) : (
        <div className="py-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl bg-white/60 dark:bg-black/30 p-2.5 border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="block font-serif text-2xl font-bold text-foreground">
                {time.days}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Días
              </span>
            </div>

            <div className="rounded-2xl bg-white/60 dark:bg-black/30 p-2.5 border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="block font-serif text-2xl font-bold text-foreground">
                {time.hours}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Horas
              </span>
            </div>

            <div className="rounded-2xl bg-white/60 dark:bg-black/30 p-2.5 border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="block font-serif text-2xl font-bold text-foreground">
                {time.minutes}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Minutos
              </span>
            </div>

            <div className="rounded-2xl bg-white/60 dark:bg-black/30 p-2.5 border border-white/50 shadow-sm backdrop-blur-sm">
              <span className="block font-serif text-2xl font-bold text-primary animate-pulse">
                {time.seconds}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Segundos
              </span>
            </div>
          </div>

          <p className="mt-3 text-center font-serif text-xs italic text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Cada segundo a tu lado es un regalo de Dios
          </p>
        </div>
      )}
    </article>
  );
}

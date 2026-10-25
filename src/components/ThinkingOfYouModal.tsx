import { useState, useRef, useEffect } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Heart, Sparkles, X, Send, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TouchMemory {
  id: string;
  sender: string;
  type: 'heartbeat' | 'hug' | 'kiss' | 'glow';
  label: string;
  durationSeconds: number;
  timestamp: string;
}

export function ThinkingOfYouModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'heartbeat' | 'hug' | 'kiss' | 'glow'>('heartbeat');
  const [isHolding, setIsHolding] = useState(false);
  const [holdTime, setHoldTime] = useState(0);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Persistent storage for romantic touches
  const [lastTouch, setLastTouch] = useState<TouchMemory | null>(null);

  const holdIntervalRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('last_romantic_touch');
      if (saved) {
        setLastTouch(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const touchTypes = [
    { id: 'heartbeat' as const, emoji: '💗', title: 'Latido cálido', desc: 'Siente el ritmo de mi corazón contigo' },
    { id: 'hug' as const, emoji: '🫂', title: 'Abrazo envolvente', desc: 'Cierra los ojos, te estoy sosteniendo' },
    { id: 'kiss' as const, emoji: '💋', title: 'Beso suave', desc: 'Un besito tierno en la frente' },
    { id: 'glow' as const, emoji: '✨', title: 'Destello de amor', desc: 'Un pensamiento radiante para tu día' },
  ];

  function startHold() {
    setIsHolding(true);
    setHoldTime(0);
    soundFx.playHeartbeat();

    // Pulso constante de latidos
    heartbeatIntervalRef.current = window.setInterval(() => {
      soundFx.playHeartbeat();
    }, 900);

    // Conteo de segundos del abrazo
    holdIntervalRef.current = window.setInterval(() => {
      setHoldTime(prev => Number((prev + 0.1).toFixed(1)));
    }, 100);
  }

  function endHold() {
    if (!isHolding) return;
    setIsHolding(false);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    const seconds = Math.max(1, Math.round(holdTime));
    const currentTouchInfo = touchTypes.find(t => t.id === selectedType);

    soundFx.playChime(1.2);

    const newTouch: TouchMemory = {
      id: Date.now().toString(),
      sender: 'Nosotros',
      type: selectedType,
      label: currentTouchInfo?.title ?? 'Caricia de amor',
      durationSeconds: seconds,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLastTouch(newTouch);
    try {
      localStorage.setItem('last_romantic_touch', JSON.stringify(newTouch));
    } catch {}

    setSentNotice(`¡${currentTouchInfo?.emoji} ${currentTouchInfo?.title} de ${seconds}s enviado con todo el amor!`);
    setTimeout(() => setSentNotice(null), 4000);
  }

  return (
    <>
      {/* Botón activador en la pantalla */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/15 to-rose-500/10 hover:from-rose-500/20 hover:to-pink-500/20 border border-rose-300/60 dark:border-rose-900/40 shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
        <span className="font-serif text-sm font-semibold text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          Pensando en ti
        </span>
      </button>

      {/* Modal interactivo de transmisión háptica */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-rose-200 dark:border-rose-900/40 p-6 shadow-2xl space-y-6 text-center">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3 text-left">
              <div>
                <h3 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Transmisor de Amor
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mantén presionado para enviar un latido que atraviesa cualquier distancia.
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full w-8 h-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Selector del tipo de caricia */}
            <div className="grid grid-cols-2 gap-2">
              {touchTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    soundFx.playChime(1.1);
                    setSelectedType(t.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedType === t.id
                      ? 'bg-rose-500/15 border-rose-400 text-rose-900 dark:text-rose-200 font-semibold shadow-sm'
                      : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-xl block">{t.emoji}</span>
                  <span className="text-xs font-serif block mt-1">{t.title}</span>
                </button>
              ))}
            </div>

            {/* Corazón palpitante interactivo (Hold-to-Send) */}
            <div className="py-4 flex flex-col items-center justify-center relative">
              {/* Anillos de luz que se expanden al presionar */}
              {isHolding && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-rose-400/20 animate-ping pointer-events-none" />
                  <div className="absolute w-48 h-48 rounded-full bg-rose-500/10 animate-pulse pointer-events-none" />
                </>
              )}

              <button
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl select-none touch-none ${
                  isHolding
                    ? 'scale-110 bg-gradient-to-tr from-rose-600 to-pink-500 text-white ring-8 ring-rose-300/50'
                    : 'bg-gradient-to-tr from-rose-500 to-pink-400 text-white hover:scale-105 active:scale-95'
                }`}
              >
                <Heart
                  className={`w-12 h-12 fill-white transition-transform duration-200 ${
                    isHolding ? 'scale-125 animate-pulse' : ''
                  }`}
                />
                <span className="text-[10px] font-sans font-medium uppercase tracking-wider mt-1">
                  {isHolding ? `${holdTime}s` : 'Mantén'}
                </span>
              </button>

              <p className="mt-4 font-serif text-sm text-foreground">
                {isHolding ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold animate-pulse">
                    Enviando latidos en tiempo real... ({holdTime}s)
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Toca y mantén presionado con el dedo para enviar la caricia.
                  </span>
                )}
              </p>
            </div>

            {/* Notificación de envío */}
            {sentNotice && (
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-serif animate-in zoom-in-95">
                {sentNotice}
              </div>
            )}

            {/* Último contacto guardado */}
            {lastTouch && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-left flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-card shadow-sm text-lg">
                    {touchTypes.find(t => t.id === lastTouch.type)?.emoji ?? '💗'}
                  </span>
                  <div>
                    <span className="block font-serif text-xs font-semibold text-foreground">
                      Última caricia enviada
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {lastTouch.label} ({lastTouch.durationSeconds}s) a las {lastTouch.timestamp}
                    </span>
                  </div>
                </div>
                <Send className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { soundFx } from '@/lib/sound-atmosphere';
import { useQuery } from '@tanstack/react-query';
import { membershipOptions } from '@/lib/message-bank';

export function LiveHeartbeat() {
  const member = useQuery(membershipOptions);
  const [isPressing, setIsPressing] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const [incomingHeartbeat, setIncomingHeartbeat] = useState<string | null>(null);
  const pressTimer = useRef<number | null>(null);

  // Escuchar latidos entrantes de la pareja en tiempo real
  useEffect(() => {
    const channel = supabase.channel('love-heartbeats')
      .on('broadcast', { event: 'heartbeat' }, (payload) => {
        const sender = payload.payload?.sender || 'Tu amor';
        // Solo reaccionar si lo mandó la pareja, no uno mismo
        if (member.data?.display_name && sender === member.data.display_name) return;

        soundFx.playHeartbeat();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate([100, 60, 120]); } catch {}
        }
        setIncomingHeartbeat(sender);
        setTimeout(() => setIncomingHeartbeat(null), 4000);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [member.data?.display_name]);

  // Al mantener presionado el corazón
  const startHeartbeat = () => {
    setIsPressing(true);
    soundFx.playHeartbeat();
    setPulseCount((c) => c + 1);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([60, 50, 70]); } catch {}
    }

    // Enviar broadcast a la pareja
    void supabase.channel('love-heartbeats').send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: { sender: member.data?.display_name || 'Carlos' },
    });

    pressTimer.current = window.setInterval(() => {
      soundFx.playHeartbeat();
      setPulseCount((c) => c + 1);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([60, 50, 70]); } catch {}
      }
      void supabase.channel('love-heartbeats').send({
        type: 'broadcast',
        event: 'heartbeat',
        payload: { sender: member.data?.display_name || 'Carlos' },
      });
    }, 900);
  };

  const stopHeartbeat = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearInterval(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <>
      {/* Notificación flotante de latido recibido */}
      {incomingHeartbeat && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/40 backdrop-blur-md">
            <Heart className="w-5 h-5 fill-white animate-ping" />
            <span className="font-serif text-sm font-medium tracking-wide">
              ¡{incomingHeartbeat} te está pensando ahora mismo!
            </span>
          </div>
        </div>
      )}

      {/* Botón de latido interactivo */}
      <div className="flex flex-col items-center my-2 select-none">
        <button
          type="button"
          onMouseDown={startHeartbeat}
          onMouseUp={stopHeartbeat}
          onMouseLeave={stopHeartbeat}
          onTouchStart={startHeartbeat}
          onTouchEnd={stopHeartbeat}
          aria-label="Enviar un latido a mi pareja"
          className="group relative flex items-center justify-center p-3 transition-transform active:scale-95"
        >
          {/* Ondas expansivas concéntricas cuando se presiona */}
          {isPressing && (
            <>
              <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
              <span className="absolute -inset-2 rounded-full border-2 border-rose-400/60 animate-pulse" />
            </>
          )}

          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all duration-300 backdrop-blur-md shadow-sm ${
              isPressing
                ? 'bg-rose-500/20 border-rose-400 shadow-rose-300/40 scale-105'
                : 'bg-card/70 hover:bg-card border-rose-200/60 dark:border-rose-900/40'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-300 ${
                isPressing
                  ? 'fill-rose-500 text-rose-500 scale-125 animate-pulse'
                  : 'text-rose-400 group-hover:scale-110'
              }`}
            />
            <span className="font-serif text-xs text-foreground/85">
              {isPressing ? 'Enviando latidos...' : 'Mantén presionado para enviar un latido'}
            </span>
          </div>
        </button>
      </div>
    </>
  );
}

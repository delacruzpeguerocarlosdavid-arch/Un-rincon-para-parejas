import { useState, useEffect } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { CloudRain, Flame, Waves, Music, Volume2, VolumeX, X, Play, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SoundAtmospherePlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'rain' | 'fireplace' | 'river' | 'piano' | null>(null);
  const [volume, setVolume] = useState(0.4);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Sync state
  useEffect(() => {
    setActiveTrack(soundFx.getActiveAmbience());
  }, []);

  // Sleep timer countdown
  useEffect(() => {
    if (!timerMinutes) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(timerMinutes * 60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleStop();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMinutes]);

  function handlePlay(type: 'rain' | 'fireplace' | 'river' | 'piano') {
    if (activeTrack === type) {
      handleStop();
      return;
    }
    soundFx.playChime(1.1);
    soundFx.startAmbience(type, volume);
    setActiveTrack(type);
  }

  function handleStop() {
    soundFx.stopAmbience();
    setActiveTrack(null);
    setTimerMinutes(null);
  }

  function handleVolumeChange(newVol: number) {
    setVolume(newVol);
    soundFx.setAmbienceVolume(newVol);
  }

  const tracks = [
    { id: 'rain' as const, label: 'Lluvia en la ventana', icon: CloudRain, desc: 'Gotas suaves contra el cristal' },
    { id: 'fireplace' as const, label: 'Chimenea cálida', icon: Flame, desc: 'Chispas y leña crepitando' },
    { id: 'river' as const, label: 'Río del Valle', icon: Waves, desc: 'Corriente cristalina relajante' },
    { id: 'piano' as const, label: 'Piano nostálgico', icon: Music, desc: 'Melodía suave para dos' },
  ];

  return (
    <>
      {/* Botón flotante píldora con ecualizador animado */}
      <button
        onClick={() => setIsOpen(true)}
        title="Estación de Atmósferas Relajantes"
        aria-label="Abrir reproductor de sonidos relajantes"
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-sm text-xs font-serif ${
          activeTrack
            ? 'bg-primary/20 border-primary text-primary font-semibold ring-2 ring-primary/30 animate-pulse'
            : 'bg-white/80 dark:bg-stone-900/80 border-border/70 text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95'
        }`}
      >
        {activeTrack ? (
          <>
            <span className="flex gap-0.5 items-end h-3.5">
              <span className="w-0.5 bg-primary rounded-full animate-bounce h-2" />
              <span className="w-0.5 bg-primary rounded-full animate-bounce h-3.5 delay-75" />
              <span className="w-0.5 bg-primary rounded-full animate-bounce h-1.5 delay-150" />
            </span>
            <span className="capitalize">{activeTrack}</span>
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5" />
            <span>Música Lo-Fi</span>
          </>
        )}
      </button>

      {/* Modal flotante de selección de atmósfera */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-rose-200/60 dark:border-rose-900/40 p-6 shadow-2xl space-y-5">
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-primary/15 text-primary">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Santuario Sonoro
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Ambientes acústicos nativos para acompañar su amor.
                  </p>
                </div>
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

            {/* Lista de Paisajes Sonoros */}
            <div className="grid grid-cols-1 gap-2.5">
              {tracks.map(t => {
                const Icon = t.icon;
                const isPlaying = activeTrack === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handlePlay(t.id)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 ${
                      isPlaying
                        ? 'bg-primary/15 border-primary shadow-md scale-[1.01]'
                        : 'bg-card hover:bg-muted/40 border-border/60'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        isPlaying
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-foreground">
                          {t.label}
                        </span>
                        {isPlaying ? (
                          <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-primary flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                            Reproduciendo
                          </span>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Control de Volumen y Temporizador */}
            {activeTrack && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-primary" />
                </div>

                {/* Temporizador para dormir juntos */}
                <div className="flex items-center justify-between text-xs font-serif text-muted-foreground pt-1">
                  <span>Apagar en:</span>
                  <div className="flex gap-1.5">
                    {[15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setTimerMinutes(timerMinutes === mins ? null : mins)}
                        className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                          timerMinutes === mins
                            ? 'bg-primary text-primary-foreground border-primary font-bold'
                            : 'bg-muted/50 border-border/50 hover:bg-muted'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {timeLeft !== null && (
                  <p className="text-center font-mono text-xs text-primary animate-pulse">
                    ⏳ Se apagará en {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="w-full text-xs font-serif gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  Detener reproducción
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

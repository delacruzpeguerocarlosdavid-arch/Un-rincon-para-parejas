import { useState, useEffect } from 'react';
import { Music, VolumeX, Sparkles } from 'lucide-react';
import { soundFx } from '@/lib/sound-atmosphere';

export function SoundToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggle = () => {
    setHasInteracted(true);
    const active = soundFx.toggleMusic();
    setIsPlaying(active);
    if (active) {
      soundFx.playChime(1.2);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-40">
      <button
        onClick={toggle}
        type="button"
        title={isPlaying ? "Pausar música de fondo" : "Activar música suave de fondo"}
        aria-label={isPlaying ? "Pausar música" : "Activar música"}
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all duration-300 shadow-sm backdrop-blur-md ${
          isPlaying
            ? 'bg-primary/20 text-primary border border-primary/40 shadow-primary/20 ring-2 ring-primary/20 animate-pulse'
            : 'bg-background/80 hover:bg-card text-muted-foreground border border-border/60 hover:text-foreground'
        }`}
      >
        {isPlaying ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <Music className="w-3.5 h-3.5 text-primary animate-bounce" />
            <span className="hidden sm:inline font-medium">Nuestra melodía</span>
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5 opacity-70 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline opacity-80">Música</span>
          </>
        )}
      </button>
    </div>
  );
}

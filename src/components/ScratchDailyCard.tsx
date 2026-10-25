import { useEffect, useRef, useState } from 'react';
import { Sparkles, Heart, RefreshCw } from 'lucide-react';
import { soundFx } from '@/lib/sound-atmosphere';

interface ScratchDailyCardProps {
  content: string;
  category: string;
  day: string | number;
  partnerName?: string;
}

export function ScratchDailyCard({ content, category, day, partnerName }: ScratchDailyCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawing = useRef(false);
  const lastChime = useRef(0);

  const storageKey = `scratched_${day}`;

  useEffect(() => {
    // Verificar si ya se rascó hoy
    if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) {
      setIsRevealed(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.offsetWidth || 340);
    const height = (canvas.height = canvas.offsetHeight || 180);

    // Dibujar cubierta plateada / rosada con textura
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e2c5cd');
    gradient.addColorStop(0.5, '#f4dfe4');
    gradient.addColorStop(1, '#d8b4be');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Patrón decorativo y texto en la cubierta
    ctx.fillStyle = '#8b5e68';
    ctx.font = '500 15px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Rasca aquí para tu mensaje de hoy ✨', width / 2, height / 2);

    ctx.font = 'italic 12px "Karla", sans-serif';
    ctx.fillStyle = '#a2757f';
    ctx.fillText('Pasa tu dedo o el mouse suavemente', width / 2, height / 2 + 24);

    // Dibujar pequeños corazoncitos decorativos en las esquinas
    ctx.font = '16px serif';
    ctx.fillText('🌸', 24, 30);
    ctx.fillText('🌸', width - 24, 30);
    ctx.fillText('🌸', 24, height - 20);
    ctx.fillText('🌸', width - 24, height - 20);
  }, [day, storageKey]);

  const scratch = (clientX: number, clientY: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    const now = Date.now();
    if (now - lastChime.current > 180) {
      soundFx.playChime(1.15);
      lastChime.current = now;
    }

    // Calcular área rascada periódicamente
    checkPercentage(ctx, canvas);
  };

  const checkPercentage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let clearPixels = 0;
      for (let i = 3; i < pixels.length; i += 32) {
        if (pixels[i] === 0) clearPixels++;
      }
      const totalSampled = pixels.length / 32;
      if (clearPixels / totalSampled > 0.42) {
        // Revelar completamente
        setIsRevealed(true);
        soundFx.playChime(1.4);
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'true');
        }
      }
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDrawing.current = true;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-card/90 via-card/80 to-accent/20 p-6 shadow-xl backdrop-blur-md transition-all duration-500 hover:shadow-2xl">
      <div className="flex items-center justify-between border-b border-rose-200/50 pb-3 dark:border-rose-900/40">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500">
            <Heart className="h-4 w-4 fill-rose-400" />
          </span>
          <h2 className="font-serif text-2xl font-semibold tracking-wide text-foreground">
            Mensaje del día
          </h2>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-0.5 font-serif text-xs font-medium text-primary">
          {category}
        </span>
      </div>

      {/* Contenido del mensaje debajo del rascador */}
      <div className="relative min-h-[140px] flex flex-col justify-center py-4">
        <p className="whitespace-pre-wrap break-words font-serif text-2xl italic leading-relaxed text-foreground/90 selection:bg-rose-200">
          “{content}”
        </p>
        <p className="mt-3 font-sans text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> {day} · Solo para tus ojos
        </p>

        {/* Capa de raspado táctil interactiva */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 h-full w-full cursor-pointer touch-none rounded-2xl shadow-inner transition-opacity duration-700 select-none"
          />
        )}
      </div>

      {isRevealed && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(storageKey);
              setIsRevealed(false);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <RefreshCw className="w-3 h-3" /> Rascar de nuevo
          </button>
        </div>
      )}
    </article>
  );
}

import { useState, useRef } from 'react';
import { Sparkles, Dices, Trophy, Gift, RotateCcw } from 'lucide-react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Button } from '@/components/ui/button';

interface Slice {
  label: string;
  icon: string;
  color: string;
  task: string;
}

const slices: Slice[] = [
  { label: 'Masaje', icon: '💆', color: '#fbcfe8', task: 'Darle un masaje relajante de 5 minutos en la espalda o pies a tu pareja.' },
  { label: 'Cena Rica', icon: '🍕', color: '#fed7aa', task: 'Elegir o preparar juntos su comida favorita sin protestar.' },
  { label: 'Beso 30s', icon: '💋', color: '#fda4af', task: 'Un beso apasionado de 30 segundos sin soltarse ni reírse.' },
  { label: 'Película', icon: '🎬', color: '#e9d5ff', task: 'Elegir una película o serie corta y verla abrazados bajo la manta.' },
  { label: 'Baile Lento', icon: '🎵', color: '#c7d2fe', task: 'Poner una canción romántica y bailar abrazados en medio de la sala.' },
  { label: 'Postre Juntos', icon: '🍦', color: '#fef08a', task: 'Comerse un helado, chocolate o dulce compartiendo la misma cuchara.' },
  { label: 'Cumplido', icon: '💌', color: '#fed7d7', task: 'Decirle a tu pareja mirándola a los ojos 3 cosas que amas de ella.' },
  { label: 'Foto Tonta', icon: '📸', color: '#bbf7d0', task: 'Tomarse una selfie con caras chistosas y guardarla en el álbum de recuerdos.' },
];

export function LoveRoulette() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState<Slice | null>(null);
  const currentRotation = useRef(0);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedSlice(null);

    // Giro aleatorio: al menos 5 vueltas completas (1800 deg) + offset aleatorio
    const extraRot = 1800 + Math.floor(Math.random() * 360);
    const newRot = currentRotation.current + extraRot;
    currentRotation.current = newRot;
    setRotation(newRot);

    // Sonidos de giros periódicos
    const tickInterval = setInterval(() => {
      soundFx.playChime(0.9);
    }, 180);

    setTimeout(() => {
      clearInterval(tickInterval);
      soundFx.playChime(1.5);

      // Calcular slice ganadora
      const actualDegrees = (newRot % 360);
      const sliceSize = 360 / slices.length;
      // La aguja apunta arriba (270 grados en círculo)
      const winningIndex = Math.floor(((360 - (actualDegrees % 360) + 270) % 360) / sliceSize);
      setSelectedSlice(slices[winningIndex % slices.length]);
      setIsSpinning(false);
    }, 3500);
  };

  const sliceAngle = 360 / slices.length;

  return (
    <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-card/90 via-card/85 to-amber-100/30 dark:to-amber-950/20 p-6 shadow-xl backdrop-blur-md text-center">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-amber-900/40 text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Dices className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Ruleta de Citas y Mimos
            </h2>
            <p className="text-[10px] text-muted-foreground">¿Qué aventura o reto romántico nos toca hoy?</p>
          </div>
        </div>
      </div>

      {/* Contenedor de la Ruleta Física con aguja */}
      <div className="relative my-6 flex justify-center items-center">
        {/* Aguja indicadora superior */}
        <div className="absolute -top-3 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-500 filter drop-shadow-md" />

        {/* Disco giratorio */}
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
          }}
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-white shadow-2xl overflow-hidden select-none"
        >
          {slices.map((slice, index) => {
            const rot = index * sliceAngle;
            return (
              <div
                key={slice.label}
                style={{
                  transform: `rotate(${rot}deg)`,
                  backgroundColor: slice.color,
                  clipPath: 'polygon(50% 50%, 0% 0%, 100% 0%)',
                }}
                className="absolute inset-0 origin-center flex justify-center pt-2"
              >
                <div
                  style={{ transform: `rotate(${sliceAngle / 2}deg)` }}
                  className="flex flex-col items-center pt-2"
                >
                  <span className="text-xl sm:text-2xl filter drop-shadow-sm">{slice.icon}</span>
                  <span className="font-serif font-bold text-[10px] sm:text-xs text-stone-800 tracking-wider">
                    {slice.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Centro de la rueda */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-stone-900 border-4 border-amber-300 shadow-md flex items-center justify-center z-10">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300" />
          </div>
        </div>
      </div>

      {/* Botón de Girar */}
      <Button
        disabled={isSpinning}
        onClick={spinWheel}
        className="rounded-full px-8 py-6 text-base font-serif font-semibold shadow-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white transition-transform active:scale-95"
      >
        {isSpinning ? 'Girando con amor...' : '¡Girar la Ruleta! ✨'}
      </Button>

      {/* Resultado y reto seleccionado */}
      {selectedSlice && (
        <div className="mt-6 p-5 rounded-2xl bg-white/90 dark:bg-black/50 border border-amber-300 shadow-lg animate-in zoom-in duration-300">
          <span className="text-4xl block mb-2">{selectedSlice.icon}</span>
          <h3 className="font-serif text-2xl font-bold text-foreground">
            ¡Nos tocó: {selectedSlice.label}!
          </h3>
          <p className="mt-2 font-serif text-sm italic text-stone-700 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
            “{selectedSlice.task}”
          </p>
          <p className="mt-3 text-[11px] font-sans text-rose-500 font-medium">
            ¡Promesa de amor: tienen que cumplirlo hoy mismo! ❤️
          </p>
        </div>
      )}
    </div>
  );
}

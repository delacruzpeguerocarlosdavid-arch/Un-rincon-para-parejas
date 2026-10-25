import { useState } from 'react';
import lirios from '@/assets/lirios.png';
import { Sparkles, Heart } from 'lucide-react';

interface PolaroidHeroProps {
  imageSrc?: string;
  caption?: string;
  date?: string;
}

export function PolaroidHero({ imageSrc, caption, date }: PolaroidHeroProps) {
  const [isTilted, setIsTilted] = useState(false);

  return (
    <div className="relative my-3 flex justify-center select-none">
      {/* Cinta washi tape decorativa en la esquina superior */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-28 h-7 bg-amber-100/70 border-t border-b border-amber-200/50 backdrop-blur-sm shadow-sm rotate-1 pointer-events-none"
        style={{
          clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
        }}
      />

      {/* Marco Polaroid auténtico */}
      <div
        onClick={() => setIsTilted(!isTilted)}
        className={`group relative bg-white dark:bg-stone-900 p-3 pb-6 rounded-md shadow-xl border border-stone-200/70 dark:border-stone-800 transition-all duration-500 max-w-[280px] cursor-pointer hover:shadow-2xl hover:scale-105 ${
          isTilted ? 'rotate-2' : '-rotate-1'
        }`}
      >
        {/* Imagen dentro de la Polaroid */}
        <div className="relative overflow-hidden rounded bg-stone-100 dark:bg-stone-950 aspect-[4/3] flex items-center justify-center">
          <img
            src={imageSrc || lirios}
            alt="Nuestro recuerdo"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Leyenda manuscrita / serif en el borde inferior */}
        <div className="mt-3 text-center px-1">
          <p className="font-serif text-base font-medium text-stone-800 dark:text-stone-200 italic tracking-wide">
            {caption || 'Un lugar para nosotros dos'}
          </p>
          <p className="mt-0.5 text-[10px] font-sans text-stone-400 flex items-center justify-center gap-1">
            <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
            {date || 'Nuestro amor eterno'}
          </p>
        </div>
      </div>
    </div>
  );
}

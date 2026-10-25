import { useState } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { BookOpen, Printer, Sparkles, X, Heart, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCouple } from '@/lib/couple-context';

export function RomanticBookExporter() {
  const [isOpen, setIsOpen] = useState(false);
  const { couple, daysTogether } = useCouple();

  function handlePrint() {
    soundFx.playChime(1.3);
    window.print();
  }

  return (
    <>
      {/* Botón en la interfaz */}
      <button
        onClick={() => {
          soundFx.playChime(1.1);
          setIsOpen(true);
        }}
        className="flex items-center gap-2.5 p-3 rounded-2xl bg-card hover:bg-muted/50 border border-border/60 transition-all text-left shadow-sm group hover:scale-[1.01]"
      >
        <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
          <BookOpen className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block font-serif text-sm font-semibold text-foreground">
            Libro de Nuestra Historia
          </span>
          <span className="block text-xs text-muted-foreground">
            Exporta e imprime su libro de memorias en PDF de colección.
          </span>
        </div>
      </button>

      {/* Modal / Visor de Maqueta del Libro */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-card border-2 border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 shadow-2xl space-y-6 text-foreground print:shadow-none print:border-none print:p-0 print:max-w-none">
            {/* Barra de herramientas superior (oculta al imprimir) */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    Maqueta del Libro de Colección
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Listo para encuadernar o descargar en PDF.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  size="sm"
                  className="gap-1.5 font-serif bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Printer className="w-4 h-4" />
                  Descargar PDF / Imprimir
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full w-8 h-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PÁGINAS DEL LIBRO (FORMATO EDITORIAL DE ARTE) */}
            <div className="space-y-8 bg-amber-50/40 dark:bg-stone-900/40 p-6 sm:p-8 rounded-2xl border border-amber-200/50">
              {/* Portada */}
              <div className="text-center py-12 px-6 border-4 border-double border-amber-300/80 rounded-2xl bg-white dark:bg-stone-950 shadow-inner space-y-4">
                <span className="text-4xl">🕊️</span>
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400">
                  Edición Privada Conmemorativa
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Un Rincón Para Parejas
                </h1>
                <p className="font-serif italic text-lg text-rose-600 dark:text-rose-400">
                  {couple.partner1} & {couple.partner2}
                </p>
                <div className="w-16 h-0.5 bg-amber-400 mx-auto my-4" />
                <p className="text-xs font-serif text-muted-foreground max-w-sm mx-auto">
                  «{daysTogether} días donde cada recuerdo, palabra y latido ha sido sellado con amor.»
                </p>
              </div>

              {/* Capítulo 1: Estadísticas y Fechas Sagradas */}
              <div className="space-y-4 pt-4 border-t border-amber-200/60">
                <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Capítulo I: Las Raíces de Nuestro Amor
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-card border border-border/50">
                    <span className="block font-serif text-2xl font-bold text-primary">Incontables</span>
                    <span className="text-[11px] text-muted-foreground">Latidos compartidos</span>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/50">
                    <span className="block font-serif text-2xl font-bold text-primary">365+</span>
                    <span className="text-[11px] text-muted-foreground">Mensajes diarios</span>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border/50 col-span-2 sm:col-span-1">
                    <span className="block font-serif text-2xl font-bold text-primary">Eterno</span>
                    <span className="text-[11px] text-muted-foreground">Pacto bajo la fe</span>
                  </div>
                </div>
              </div>

              {/* Capítulo 2: Promesas y Cartas del Río */}
              <div className="space-y-4 pt-4 border-t border-amber-200/60">
                <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  Capítulo II: Cartas en el Valle del Río
                </h3>
                <div className="p-5 rounded-2xl bg-card border border-rose-200/60 shadow-sm space-y-2">
                  <p className="font-serif italic text-sm text-foreground/90 leading-relaxed">
                    «Si alguna vez la distancia intenta parecer grande, recuerda que el mismo cielo que te cubre a ti me cubre a mí, y que cada vez que Appa come o vuela, lleva en sus alas una caricia para tu alma.»
                  </p>
                  <p className="text-right font-serif text-xs text-rose-600 dark:text-rose-400 font-bold">
                    — Carlos & Mimie
                  </p>
                </div>
              </div>

              {/* Capítulo 3: La Bendición de Dios */}
              <div className="space-y-4 pt-4 border-t border-amber-200/60">
                <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Capítulo III: Un Momento con Dios
                </h3>
                <div className="p-5 rounded-2xl bg-card border border-amber-200/60 shadow-sm space-y-2">
                  <p className="font-serif text-sm italic text-foreground/90 leading-relaxed">
                    «El amor es paciente, es bondadoso. El amor no es envidioso ni jactancioso ni orgulloso. Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta. El amor nunca se extingue.»
                  </p>
                  <p className="text-right text-xs font-sans text-muted-foreground">
                    1 Corintios 13:4-8 (NTV)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

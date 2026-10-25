import { useState } from 'react';
import { Heart, Sparkles, RefreshCw, Trophy, Users, ArrowRight } from 'lucide-react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Button } from '@/components/ui/button';

interface Question {
  id: number;
  question: string;
  category: 'gracioso' | 'romantico' | 'cotidiano' | 'atrevido';
}

const questionsList: Question[] = [
  { id: 1, question: "¿Quién es más probable que se quede dormido a los 10 minutos de empezar una película?", category: 'gracioso' },
  { id: 2, question: "¿Quién es más probable que empiece a pelear o ponerse de mal humor solo porque tiene hambre?", category: 'cotidiano' },
  { id: 3, question: "¿Quién es más empalagoso y cariñoso cuando estamos a solas?", category: 'romantico' },
  { id: 4, question: "¿Quién tarda más tiempo en cambiarse y arreglarse antes de salir?", category: 'cotidiano' },
  { id: 5, question: "¿Quién es más probable que haga una compra compulsiva de algo que no necesita?", category: 'gracioso' },
  { id: 6, question: "¿Quién es más dramático cuando le da una simple gripe?", category: 'gracioso' },
  { id: 7, question: "¿Quién ama con más intensidad y locura?", category: 'romantico' },
  { id: 8, question: "¿Quién es más probable que pierda las llaves o el celular dentro de la casa?", category: 'cotidiano' },
  { id: 9, question: "¿Quién pediría perdón primero después de un malentendido tonto?", category: 'romantico' },
  { id: 10, question: "¿Quién cocina más rico cuando le pone ganas?", category: 'cotidiano' },
  { id: 11, question: "¿Quién se pondría a llorar primero con una película romántica o triste?", category: 'romantico' },
  { id: 12, question: "¿Quién es más celoso en secreto aunque no lo admita?", category: 'atrevido' },
  { id: 13, question: "¿Quién es más terco cuando cree que tiene la razón?", category: 'gracioso' },
  { id: 14, question: "¿Quién planearía la cita sorpresa más inolvidable de la vida?", category: 'romantico' },
  { id: 15, question: "¿Quién sobreviviría más tiempo en un apocalipsis zombi?", category: 'gracioso' },
  { id: 16, question: "¿Quién es más adicto a revisar el celular en la cama?", category: 'cotidiano' },
  { id: 17, question: "¿Quién es el primero en dar un abrazo cuando el otro está triste?", category: 'romantico' },
  { id: 18, question: "¿Quién dice más frases cursis a lo largo del día?", category: 'romantico' },
  { id: 19, question: "¿Quién tiene el gusto musical más peculiar o extraño?", category: 'gracioso' },
  { id: 20, question: "¿Quién es el mayor amor de la vida del otro?", category: 'romantico' },
];

export function MostLikelyGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myVote, setMyVote] = useState<'carlos' | 'mimie' | null>(null);
  const [partnerVote, setPartnerVote] = useState<'carlos' | 'mimie' | null>(null);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentQ = questionsList[currentIndex];

  const handleVote = (vote: 'carlos' | 'mimie') => {
    if (myVote) return;
    setMyVote(vote);
    soundFx.playChime(1.1);

    // Simular o preparar voto (en tiempo real o interactivo en pareja)
    // Para juego conjunto en el mismo teléfono o por turnos:
    setTimeout(() => {
      // Si están jugando juntos, o para diversión compartida
      const pVote = Math.random() > 0.4 ? vote : (vote === 'carlos' ? 'mimie' : 'carlos');
      setPartnerVote(pVote);
      setAnsweredCount(c => c + 1);
      if (pVote === vote) {
        soundFx.playChime(1.5);
        setScore(s => s + 1);
      }
    }, 600);
  };

  const nextQuestion = () => {
    setMyVote(null);
    setPartnerVote(null);
    setCurrentIndex((prev) => (prev + 1) % questionsList.length);
  };

  const isRevealed = myVote !== null && partnerVote !== null;
  const isMatch = myVote === partnerVote;

  return (
    <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-card/90 via-card/85 to-rose-100/30 dark:to-rose-950/20 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/40">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              ¿Quién es más probable que...?
            </h2>
            <p className="text-[10px] text-muted-foreground">Juego cómico y cómplice de pareja</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-serif font-medium">
          <Trophy className="w-3.5 h-3.5" />
          <span>{score} coincidencias</span>
        </div>
      </div>

      {/* Pregunta en grande */}
      <div className="py-8 text-center min-h-[140px] flex flex-col justify-center items-center">
        <span className="inline-block px-3 py-1 mb-3 rounded-full bg-rose-200/40 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-sans font-medium uppercase tracking-wider">
          Pregunta {currentIndex + 1} de {questionsList.length}
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground leading-snug max-w-sm">
          “{currentQ.question}”
        </h3>
      </div>

      {/* Botones de votación: CARLOS vs MIMIE */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={myVote !== null}
          onClick={() => handleVote('carlos')}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 active:scale-95 ${
            myVote === 'carlos'
              ? 'border-primary bg-primary/20 shadow-lg scale-102 ring-2 ring-primary/30'
              : 'border-border/60 bg-white/60 dark:bg-black/30 hover:bg-card hover:border-primary/50'
          }`}
        >
          <span className="text-3xl">👑</span>
          <span className="font-serif text-xl font-semibold text-foreground">Carlos</span>
          {myVote === 'carlos' && (
            <span className="text-[11px] text-primary font-medium">Tu elección</span>
          )}
        </button>

        <button
          type="button"
          disabled={myVote !== null}
          onClick={() => handleVote('mimie')}
          className={`relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 active:scale-95 ${
            myVote === 'mimie'
              ? 'border-rose-400 bg-rose-500/20 shadow-lg scale-102 ring-2 ring-rose-400/30'
              : 'border-border/60 bg-white/60 dark:bg-black/30 hover:bg-card hover:border-rose-300'
          }`}
        >
          <span className="text-3xl">🌸</span>
          <span className="font-serif text-xl font-semibold text-foreground">Mimie</span>
          {myVote === 'mimie' && (
            <span className="text-[11px] text-rose-500 font-medium">Tu elección</span>
          )}
        </button>
      </div>

      {/* Revelación del resultado */}
      {isRevealed && (
        <div className="mt-5 p-4 rounded-2xl bg-white/80 dark:bg-black/40 border border-border/60 text-center animate-in fade-in zoom-in duration-300">
          {isMatch ? (
            <div className="space-y-1">
              <p className="font-serif text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-400" /> ¡Totalmente de acuerdo!
              </p>
              <p className="text-xs text-muted-foreground">
                Ambos saben perfectamente que es {myVote === 'carlos' ? 'Carlos 👑' : 'Mimie 🌸'}. ¡Conexión 100%!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-serif text-lg font-bold text-amber-600 dark:text-amber-400">
                ¡Hubo debate aquí! 😆
              </p>
              <p className="text-xs text-muted-foreground">
                Uno votó por Carlos y el otro por Mimie. ¡Toca defender sus razones con un beso!
              </p>
            </div>
          )}

          <Button
            onClick={nextQuestion}
            className="mt-4 rounded-full px-6 shadow-md font-serif"
            size="sm"
          >
            Siguiente pregunta <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

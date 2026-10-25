import { useState, useEffect } from 'react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Sparkles, Heart, Lock, Unlock, MessageCircleHeart, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCouple } from '@/lib/couple-context';

export interface DailyQuestion {
  id: number;
  category: 'Amor' | 'Recuerdos' | 'Risas' | 'Futuro' | 'Espiritual';
  question: string;
  subtext: string;
}

const questionsPool: DailyQuestion[] = [
  {
    id: 1,
    category: 'Amor',
    question: '¿Qué fue lo primero que pensaste de mí el primer día que hablamos?',
    subtext: 'Recuerda el momento exacto y lo que sentiste en el pecho.',
  },
  {
    id: 2,
    category: 'Recuerdos',
    question: '¿Cuál ha sido nuestro momento juntos donde más te has reído hasta llorar?',
    subtext: 'Esa anécdota que nunca olvidaremos.',
  },
  {
    id: 3,
    category: 'Futuro',
    question: 'Si pudiéramos escapar un fin de semana a cualquier rincón del mundo, ¿adónde iríamos?',
    subtext: 'Solo nosotros dos, sin reloj ni preocupaciones.',
  },
  {
    id: 4,
    category: 'Amor',
    question: '¿Cuál es un detalle pequeño que hago por ti que te hace sentir verdaderamente amado(a)?',
    subtext: 'Algo sutil del día a día.',
  },
  {
    id: 5,
    category: 'Espiritual',
    question: '¿Por qué agradeces a Dios hoy en nuestra relación?',
    subtext: 'Una bendición que ves reflejada en nosotros.',
  },
  {
    id: 6,
    category: 'Risas',
    question: 'Si tuviéramos que elegir una canción como el himno cómico de nosotros, ¿cuál sería?',
    subtext: 'Esa canción que cantamos juntos sin vergüenza.',
  },
  {
    id: 7,
    category: 'Amor',
    question: '¿En qué momento de este último mes me miraste y pensaste: "Qué afortunado(a) soy"?',
    subtext: 'Abre tu corazón y sé sincero(a).',
  },
];

export function DailyCoupleQuiz() {
  const { couple } = useCouple();
  // Select today's question based on day of year
  const dayIndex = Math.floor(Date.now() / 86400000) % questionsPool.length;
  const currentQuestion = questionsPool[dayIndex] ?? questionsPool[0];

  const storageKey = `daily_quiz_answers_${currentQuestion.id}`;

  const [partnerAAnswer, setPartnerAAnswer] = useState('');
  const [partnerBAnswer, setPartnerBAnswer] = useState('');
  const [isASubmitted, setIsASubmitted] = useState(false);
  const [isBSubmitted, setIsBSubmitted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPartnerAAnswer(parsed.a || '');
        setPartnerBAnswer(parsed.b || '');
        setIsASubmitted(Boolean(parsed.a));
        setIsBSubmitted(Boolean(parsed.b));
        if (parsed.a && parsed.b) {
          setIsRevealed(true);
        }
      }
    } catch {}
  }, [storageKey]);

  function submitAnswerA() {
    if (!partnerAAnswer.trim()) return;
    soundFx.playChime(1.2);
    setIsASubmitted(true);
    saveAnswers(partnerAAnswer, partnerBAnswer, true, isBSubmitted);
  }

  function submitAnswerB() {
    if (!partnerBAnswer.trim()) return;
    soundFx.playWaxCrack();
    setIsBSubmitted(true);
    saveAnswers(partnerAAnswer, partnerBAnswer, isASubmitted, true);
  }

  function saveAnswers(a: string, b: string, subA: boolean, subB: boolean) {
    const bothDone = Boolean(subA && subB && a.trim() && b.trim());
    if (bothDone) {
      soundFx.playWaxCrack();
      setIsRevealed(true);
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ a, b, bothDone }));
    } catch {}
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-rose-200/70 dark:border-rose-900/50 bg-gradient-to-br from-card/95 via-rose-50/30 to-card/90 dark:via-rose-950/20 p-6 shadow-xl backdrop-blur-md space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <MessageCircleHeart className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground tracking-tight">
              Pregunta del Día
            </h2>
            <p className="text-[11px] font-sans text-muted-foreground">
              Nuestra conexión diaria · Ambos deben responder para romper el sello.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 font-serif text-[11px] font-semibold text-rose-600 dark:text-rose-300">
          {currentQuestion.category}
        </span>
      </div>

      {/* Pregunta */}
      <div className="text-center py-2 space-y-1">
        <p className="font-serif text-2xl font-semibold text-foreground leading-snug">
          «{currentQuestion.question}»
        </p>
        <p className="font-sans text-xs text-muted-foreground italic">
          {currentQuestion.subtext}
        </p>
      </div>

      {/* Caso 1: Aún no revelado (Sello de cera blind reveal) */}
      {!isRevealed ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Respuesta de Pareja 1 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                {couple.partner1}
              </span>
              {isASubmitted ? (
                <span className="text-[11px] text-emerald-600 font-mono flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sellado con cera
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-mono">Esperando respuesta</span>
              )}
            </div>

            {isASubmitted ? (
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 text-center space-y-1">
                <div className="text-2xl">💌</div>
                <p className="font-serif text-xs font-semibold text-rose-900 dark:text-rose-200">
                  ¡Respuesta guardada y sellada!
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Se romperá el sello de cera en cuanto {couple.partner2} responda.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={partnerAAnswer}
                  onChange={e => setPartnerAAnswer(e.target.value)}
                  placeholder={`Escribe aquí tu respuesta para ${couple.partner2}...`}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-border/80 bg-background/80 focus:ring-2 focus:ring-primary focus:outline-none resize-none font-serif text-foreground"
                />
                <Button
                  size="sm"
                  onClick={submitAnswerA}
                  disabled={!partnerAAnswer.trim()}
                  className="w-full text-xs font-serif gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sellar mi respuesta con cera
                </Button>
              </div>
            )}
          </div>

          {/* Respuesta de Pareja 2 */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 border border-border/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                {couple.partner2}
              </span>
              {isBSubmitted ? (
                <span className="text-[11px] text-emerald-600 font-mono flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sellado con cera
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground font-mono">Esperando respuesta</span>
              )}
            </div>

            {isBSubmitted ? (
              <div className="p-4 rounded-xl bg-pink-50/60 dark:bg-pink-950/40 border border-pink-200/60 text-center space-y-1">
                <div className="text-2xl">💌</div>
                <p className="font-serif text-xs font-semibold text-pink-900 dark:text-pink-200">
                  ¡Respuesta guardada y sellada!
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Se romperá el sello de cera en cuanto {couple.partner1} responda.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={partnerBAnswer}
                  onChange={e => setPartnerBAnswer(e.target.value)}
                  placeholder={`Escribe aquí tu respuesta para ${couple.partner1}...`}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-border/80 bg-background/80 focus:ring-2 focus:ring-primary focus:outline-none resize-none font-serif text-foreground"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={submitAnswerB}
                  disabled={!partnerBAnswer.trim()}
                  className="w-full text-xs font-serif gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sellar mi respuesta con cera
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Caso 2: ¡Ambos respondieron! Revelación Mágica lado a lado */
        <div className="space-y-4 pt-1 animate-in zoom-in-95 duration-500">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-serif text-xs font-semibold border border-rose-300/40">
              <Unlock className="w-3.5 h-3.5 text-rose-500" />
              ¡Sello de cera roto! Respuestas reveladas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta de Pareja 1 */}
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-stone-900/90 border border-rose-200 dark:border-rose-900/60 shadow-md space-y-2">
              <span className="font-serif font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                Respuesta de {couple.partner1}:
              </span>
              <p className="font-serif text-sm italic text-foreground leading-relaxed pl-2 border-l-2 border-rose-400">
                «{partnerAAnswer}»
              </p>
            </div>

            {/* Tarjeta de Pareja 2 */}
            <div className="p-4 rounded-2xl bg-pink-50/80 dark:bg-stone-900/90 border border-pink-200 dark:border-pink-900/60 shadow-md space-y-2">
              <span className="font-serif font-bold text-sm text-pink-900 dark:text-pink-200 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                Respuesta de {couple.partner2}:
              </span>
              <p className="font-serif text-sm italic text-foreground leading-relaxed pl-2 border-l-2 border-pink-400">
                «{partnerBAnswer}»
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 text-center">
            <p className="font-serif text-xs italic text-amber-900 dark:text-amber-200">
              ✨ Gracias por regalarse este momento de intimidad hoy. Guardado para siempre en su álbum de amor.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

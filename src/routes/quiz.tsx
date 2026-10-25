import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@/components/AppShell';
import { Dices, Sparkles, Heart, HelpCircle, Trophy, RefreshCw, Flame, BookOpen } from 'lucide-react';
import { useCouple } from '@/lib/couple-context';
import { soundFx } from '@/lib/sound-atmosphere';
import { toast } from 'sonner';

export const Route = createFileRoute('/quiz')({
  head: () => ({
    meta: [
      { title: 'Juegos de Pareja · Un Rincón Para Parejas' },
      { name: 'description', content: 'Juegos interactivos para conectar, reír y enamorarse más cada día.' },
    ],
  }),
  component: CoupleGamesHub,
});

const DATE_IDEAS = [
  'Cena a la luz de las velas con su comida favorita hecha en casa 🕯️',
  'Noche de masajes relajantes con aceites aromáticos y música suave 💆',
  'Maratón de películas románticas bajo una fortaleza de sábanas y almohadas 🍿',
  'Paseo nocturno bajo las estrellas tomados de la mano y hablando de sus sueños 🌌',
  'Desayuno sorpresa en la cama con café recién hecho y una flor 🥐',
  'Cocinar un postre delicioso juntos desde cero sin mirar el reloj 🧁',
  'Escribirse una carta de amor a mano y leerla en voz alta con una copa de vino 🍷',
  'Noche de karaoke en la sala cantando las canciones que marcaron su historia 🎤',
  'Pícnic al atardecer en un parque o balcón con fresas y chocolate 🍓',
  'Sesión de fotos analógicas o divertidas recreando su primera cita 📸',
];

const TRUTH_OR_DARE = [
  { type: 'truth', text: '¿Qué fue exactamente lo primero que pensaste la primera vez que me viste?' },
  { type: 'truth', text: '¿Cuál es un pequeño hábito mío que te da ternura y nunca me has dicho?' },
  { type: 'truth', text: '¿Qué momento juntos de este año te gustaría revivir una y otra vez?' },
  { type: 'dare', text: 'Bésame durante 10 segundos continuos sin soltarme la mirada.' },
  { type: 'dare', text: 'Susúrrame al oído tres cosas que te vuelven loco(a) de mí.' },
  { type: 'dare', text: 'Pon tu canción favorita y báilame un vals o un lento en medio de la habitación.' },
  { type: 'truth', text: 'Si tuviéramos un boleto de avión para mañana a cualquier lugar del mundo, ¿a dónde me llevarías?' },
  { type: 'dare', text: 'Dime un poema o improvisa una rima romántica mirándome a los ojos.' },
];

export function CoupleGamesHub() {
  const { couple } = useCouple();
  const [activeTab, setActiveTab] = useState<'wheel' | 'truth_dare' | 'trivia'>('wheel');
  
  // Wheel state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Truth or Dare state
  const [currentPrompt, setCurrentPrompt] = useState(TRUTH_OR_DARE[0]);

  // Trivia state
  const [quizScore, setQuizScore] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);

  const TRIVIA_QUESTIONS = [
    {
      q: `¿Quién suele decir "te amo" primero en el día?`,
      options: [couple.partner1, couple.partner2, 'Ambos al mismo tiempo'],
    },
    {
      q: `¿Quién es más propenso a quedarse dormido en una película?`,
      options: [couple.partner1, couple.partner2, 'Depende de qué tan cansados estén'],
    },
    {
      q: `¿Cuál es el mejor plan de fin de semana para los dos?`,
      options: ['Quedarse en casa abrazados', 'Salir a cenar y caminar', 'Una aventura al aire libre'],
    },
    {
      q: `¿Quién tarda más tiempo arreglándose antes de salir?`,
      options: [couple.partner1, couple.partner2, '¡Casi lo mismo!'],
    },
  ];

  const handleSpinWheel = () => {
    setIsSpinning(true);
    soundFx.playChime(1.1);
    let counter = 0;
    const interval = setInterval(() => {
      setSelectedDate(DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        soundFx.playChime(1.5);
        toast.success('¡Tenemos una cita ideal para ustedes!');
      }
    }, 100);
  };

  const handleNextPrompt = () => {
    soundFx.playCrunch();
    const next = TRUTH_OR_DARE[Math.floor(Math.random() * TRUTH_OR_DARE.length)];
    setCurrentPrompt(next);
  };

  const handleTriviaAnswer = (option: string) => {
    soundFx.playChime(1.3);
    setQuizScore((prev) => prev + 1);
    if (triviaIndex < TRIVIA_QUESTIONS.length - 1) {
      setTriviaIndex((prev) => prev + 1);
    } else {
      toast.success('¡Completaron la trivia de pareja! +50 monedas de amor.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Juegos de Conexión" 
        subtitle={`Momentos para reír, jugar y enamorarse más: ${couple.partner1} & ${couple.partner2}`} 
      />

      {/* Selector de pestañas de juego */}
      <div className="flex gap-1.5 rounded-2xl bg-muted/60 p-1 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('wheel')}
          className={`flex-1 py-2 px-3 rounded-xl font-serif text-xs font-semibold transition-all ${
            activeTab === 'wheel' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          🎡 Ruleta de Citas
        </button>
        <button
          onClick={() => setActiveTab('truth_dare')}
          className={`flex-1 py-2 px-3 rounded-xl font-serif text-xs font-semibold transition-all ${
            activeTab === 'truth_dare' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          🔥 Verdad o Reto
        </button>
        <button
          onClick={() => setActiveTab('trivia')}
          className={`flex-1 py-2 px-3 rounded-xl font-serif text-xs font-semibold transition-all ${
            activeTab === 'trivia' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          💡 Trivia de Amor
        </button>
      </div>

      {/* JUEGO 1: RULETA DE CITAS */}
      {activeTab === 'wheel' && (
        <div className="p-6 rounded-3xl border border-white/60 dark:border-stone-800 bg-card/90 shadow-xl backdrop-blur-md text-center space-y-5">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 text-3xl">
              🎡
            </span>
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-foreground">
              Ruleta de Citas Inolvidables
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              ¿No saben qué hacer hoy? Giren la ruleta y dejen que el destino elija su próxima aventura romántica.
            </p>
          </div>

          {selectedDate ? (
            <div className={`p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/80 to-pink-50/80 dark:from-rose-950/30 dark:to-pink-950/30 transition-all ${
              isSpinning ? 'scale-95 opacity-70' : 'scale-100 shadow-md'
            }`}>
              <p className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-snug">
                {selectedDate}
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-dashed border-border text-muted-foreground font-serif text-sm">
              Presionen el botón para girar la ruleta
            </div>
          )}

          <button
            onClick={handleSpinWheel}
            disabled={isSpinning}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-serif font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Girando el destino...' : '¡Girar Ruleta de Citas!'}</span>
          </button>
        </div>
      )}

      {/* JUEGO 2: VERDAD O RETO */}
      {activeTab === 'truth_dare' && (
        <div className="p-6 rounded-3xl border border-white/60 dark:border-stone-800 bg-card/90 shadow-xl backdrop-blur-md text-center space-y-5">
          <div className="flex justify-center">
            <span className={`flex h-16 w-16 items-center justify-center rounded-3xl text-3xl ${
              currentPrompt.type === 'dare' 
                ? 'bg-rose-500/15 text-rose-500' 
                : 'bg-indigo-500/15 text-indigo-500'
            }`}>
              {currentPrompt.type === 'dare' ? '🔥' : '💭'}
            </span>
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-serif font-bold uppercase tracking-wider ${
              currentPrompt.type === 'dare'
                ? 'bg-rose-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}>
              {currentPrompt.type === 'dare' ? 'Reto Romántico' : 'Verdad Íntima'}
            </span>
            <p className="font-serif text-xl sm:text-2xl font-semibold text-foreground mt-4 leading-relaxed px-2">
              "{currentPrompt.text}"
            </p>
          </div>

          <button
            onClick={handleNextPrompt}
            className="w-full py-3.5 rounded-2xl bg-card border border-border hover:bg-muted font-serif font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Dices className="w-4 h-4 text-primary" />
            <span>Siguiente Pregunta / Reto</span>
          </button>
        </div>
      )}

      {/* JUEGO 3: TRIVIA DE AMOR */}
      {activeTab === 'trivia' && (
        <div className="p-6 rounded-3xl border border-white/60 dark:border-stone-800 bg-card/90 shadow-xl backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <span className="font-serif text-xs font-semibold text-primary">
              Pregunta {triviaIndex + 1} de {TRIVIA_QUESTIONS.length}
            </span>
            <span className="font-serif text-xs font-bold text-amber-600 dark:text-amber-400">
              ⭐ Puntos: {quizScore}
            </span>
          </div>

          <h3 className="font-serif text-xl font-bold text-foreground text-center">
            {TRIVIA_QUESTIONS[triviaIndex].q}
          </h3>

          <div className="space-y-2 pt-2">
            {TRIVIA_QUESTIONS[triviaIndex].options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleTriviaAnswer(option)}
                className="w-full p-3.5 rounded-2xl border border-border bg-background hover:bg-primary/10 hover:border-primary font-serif text-sm font-medium text-foreground text-left transition-all active:scale-98 flex items-center justify-between"
              >
                <span>{option}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

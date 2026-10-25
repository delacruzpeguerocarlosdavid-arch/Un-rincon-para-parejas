import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle,
  Lock,
  Unlock,
  Sparkles,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Heart,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { dominicanToday } from '@/lib/stage3';
import {
  getTodayQuestion,
  type QuizAnswer,
  type QuizData,
  type QuizQuestion,
  type QuizRound,
} from '@/lib/quiz';

interface CoupleQuizProps {
  data: QuizData;
  userId: string;
  partnerName?: string;
}

export function CoupleQuiz({ data, userId, partnerName = 'tu amor' }: CoupleQuizProps) {
  const qc = useQueryClient();
  const today = dominicanToday();
  const todayQuestion = getTodayQuestion(data.questions, today);

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [myAnswer, setMyAnswer] = useState('');
  const [guessPartner, setGuessPartner] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [burstCelebration, setBurstCelebration] = useState(false);

  const currentQuestion = selectedQuestion ?? todayQuestion;

  // Buscar la ronda para la pregunta activa hoy
  const currentRound: QuizRound | undefined = currentQuestion
    ? data.rounds.find(r => r.question_id === currentQuestion.id && r.day === today)
    : undefined;

  const currentAnswers: QuizAnswer[] = currentRound
    ? data.answers.filter(a => a.round_id === currentRound.id)
    : [];

  const mySavedAnswer = currentAnswers.find(a => a.user_id === userId);
  const partnerAnswer = currentAnswers.find(a => a.user_id !== userId);
  const isRevealed = Boolean(currentRound?.revealed_at);
  const waitingForPartner = Boolean(mySavedAnswer && !isRevealed);

  async function handleSubmitAnswer() {
    if (!currentQuestion || !myAnswer.trim() || busy) return;
    setBusy(true);
    setNotice('');

    try {
      const { data: res, error } = await supabase.rpc('submit_quiz_answer', {
        p_question_id: currentQuestion.id,
        p_my_answer: myAnswer.trim(),
        p_guess: guessPartner.trim() || null,
      });

      if (error) {
        setNotice(error.message);
        return;
      }

      await qc.invalidateQueries({ queryKey: ['couple_quiz'] });
      await qc.invalidateQueries({ queryKey: ['appa'] });

      const r = res as { revealed?: boolean } | null;
      if (r?.revealed) {
        setBurstCelebration(true);
        setNotice('¡Ambos han respondido! El expediente ha sido desclasificado y revelado 🎉');
      } else {
        setNotice('Tu respuesta quedó sellada y protegida bajo secreto. Esperando a tu amor 🔒');
      }
      setMyAnswer('');
      setGuessPartner('');
    } catch {
      setNotice('No pudimos guardar la respuesta. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  // Rondas reveladas anteriores para la pestaña de historial
  const revealedRounds = data.rounds.filter(r => r.revealed_at != null);

  return (
    <div className="space-y-4">
      {/* Selector de pestañas */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeTab === 'today' ? 'default' : 'ghost'}
          onClick={() => {
            setActiveTab('today');
            setSelectedQuestion(null);
          }}
          className="flex items-center gap-1.5"
        >
          <HelpCircle className="h-4 w-4" />
          Pregunta del día
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-1.5"
        >
          <BookOpen className="h-4 w-4" />
          Expedientes resueltos ({revealedRounds.length})
        </Button>
      </div>

      {notice && (
        <div className="card-soft border-primary/30 p-3 text-center text-xs font-medium text-primary">
          {notice}
        </div>
      )}

      {activeTab === 'today' && currentQuestion && (
        <div className="card-soft relative overflow-hidden border border-border p-5 shadow-sm">
          {/* Cabecera estilo dossier confidencial pero cálido */}
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center justify-center rounded bg-primary/10 px-2 font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                Caso #{currentQuestion.order_index}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentQuestion.category}
              </span>
            </div>
            {isRevealed ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                <Unlock className="h-3 w-3" /> Revelado
              </span>
            ) : waitingForPartner ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
                <Clock className="h-3 w-3" /> Sellado · Esperando
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <Lock className="h-3 w-3" /> Pendiente
              </span>
            )}
          </div>

          {/* Pregunta */}
          <h3 className="mb-6 font-serif text-xl font-medium leading-relaxed text-foreground md:text-2xl">
            «{currentQuestion.question}»
          </h3>

          {/* Estado 1: Revelado simultáneo completado */}
          {isRevealed && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center text-xs text-primary">
                ✨ ¡Expediente revelado! Ganaron +3 monedas y +25 EXP compartidas para cuidar a Appa.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Mi respuesta */}
                <div className="card-soft border border-border/80 bg-background/50 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Tu respuesta:</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="font-serif text-sm italic leading-relaxed text-foreground">
                    «{mySavedAnswer?.my_answer}»
                  </p>
                  {mySavedAnswer?.guess_partner_answer && (
                    <div className="mt-3 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-amber-700">
                        <Search className="h-3 w-3" /> Tu deducción sobre {partnerName}:
                      </span>
                      <p className="mt-0.5 italic">«{mySavedAnswer.guess_partner_answer}»</p>
                    </div>
                  )}
                </div>

                {/* Respuesta de la pareja */}
                <div className="card-soft border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">Respuesta de {partnerName}:</span>
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <p className="font-serif text-sm italic leading-relaxed text-foreground">
                    «{partnerAnswer?.my_answer ?? 'Respuesta registrada'}»
                  </p>
                  {partnerAnswer?.guess_partner_answer && (
                    <div className="mt-3 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-primary">
                        <Search className="h-3 w-3" /> Lo que {partnerName} dedujo sobre ti:
                      </span>
                      <p className="mt-0.5 italic">«{partnerAnswer.guess_partner_answer}»</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estado 2: Esperando a la pareja */}
          {!isRevealed && waitingForPartner && (
            <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold">Tu respuesta ha sido lacrada bajo secreto</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nadie puede verla todavía. En cuanto {partnerName} envíe su respuesta, ambas se revelarán al mismo tiempo.
                </p>
              </div>
              <div className="rounded-lg bg-card p-3 text-left">
                <span className="text-[11px] font-semibold text-muted-foreground">Tu respuesta guardada:</span>
                <p className="mt-1 font-serif text-sm italic leading-relaxed text-foreground">
                  «{mySavedAnswer?.my_answer}»
                </p>
              </div>
            </div>
          )}

          {/* Estado 3: Formulario para responder */}
          {!isRevealed && !waitingForPartner && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tu respuesta sincera:
                </label>
                <Textarea
                  value={myAnswer}
                  onChange={e => setMyAnswer(e.target.value.slice(0, 300))}
                  placeholder="Escribe lo que sientes con total honestidad. Quedará en secreto hasta que ambos respondan…"
                  className="h-24 resize-none"
                />
                <div className="text-right text-[11px] text-muted-foreground">
                  {myAnswer.length}/300
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Deducción opcional: ¿Qué crees que responderá {partnerName}?
                </label>
                <Input
                  value={guessPartner}
                  onChange={e => setGuessPartner(e.target.value.slice(0, 150))}
                  placeholder="Adivina o deduce su respuesta para ver cuánto se conocen…"
                  className="h-10 text-xs"
                />
              </div>

              <Button
                disabled={!myAnswer.trim() || busy}
                onClick={handleSubmitAnswer}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                Sellar y enviar mi respuesta
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                🔒 Regla de confidencialidad: tu amor no podrá leer tu respuesta hasta que él/ella también haya respondido la suya.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pestaña de Historial de Expedientes */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg">Historial de expedientes revelados</h3>
          {!revealedRounds.length ? (
            <p className="card-soft p-5 text-center text-sm text-muted-foreground">
              Aún no tienen rondas completadas. ¡Respondan la pregunta de hoy para desbloquear el primer expediente!
            </p>
          ) : (
            <div className="space-y-2">
              {revealedRounds.map(r => {
                const q = data.questions.find(x => x.id === r.question_id);
                if (!q) return null;
                const ansList = data.answers.filter(a => a.round_id === r.id);
                return (
                  <div
                    key={r.id}
                    className="card-soft flex cursor-pointer items-center justify-between p-4 transition-colors hover:border-primary/40"
                    onClick={() => {
                      setSelectedQuestion(q);
                      setActiveTab('today');
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-primary font-bold">Caso #{q.order_index}</span>
                        <span>·</span>
                        <span>{r.day}</span>
                      </div>
                      <p className="font-serif text-sm font-medium mt-1 line-clamp-1">
                        {q.question}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

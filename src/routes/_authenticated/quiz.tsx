import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft, HelpCircle, Users, Dices, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/AppShell';
import { Gate } from '@/components/Stage3Parts';
import { useStage3 } from '@/components/Stage3Parts';
import { quizOptions } from '@/lib/quiz';
import { CoupleQuiz } from '@/components/CoupleQuiz';
import { MostLikelyGame } from '@/components/games/MostLikelyGame';
import { LoveRoulette } from '@/components/games/LoveRoulette';
import { LoveTicTacToe } from '@/components/games/LoveTicTacToe';
import { soundFx } from '@/lib/sound-atmosphere';

export const Route = createFileRoute('/_authenticated/quiz')({
  head: () => ({
    meta: [
      { title: 'Juegos de Pareja · Un lugar para nosotros dos' },
      { name: 'description', content: 'Centro de juegos divertidos e íntimos para Carlos y Mimie.' },
      { property: 'og:title', content: 'Juegos de Pareja' },
      { property: 'og:description', content: 'Cuestionarios, retos, ruleta y tres en raya de amor.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: QuizPage,
});

type GameTab = 'quiz' | 'most-likely' | 'roulette' | 'tictactoe';

function QuizPage() {
  const ctx = useStage3();
  const [activeTab, setActiveTab] = useState<GameTab>('quiz');

  const q = useQuery({
    ...quizOptions,
    enabled: Boolean(ctx.member.data),
    refetchInterval: 30_000,
  });

  const partnerName = ctx.member.data?.partnerEmail ? 'tu amor' : 'tu pareja';

  const switchTab = (tab: GameTab) => {
    soundFx.playChime(1.1);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-5 pb-8">
      <Button asChild variant="ghost" size="sm" className="mb-1">
        <Link to="/espacio">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Nuestro espacio
        </Link>
      </Button>

      <PageHeader
        title="Juegos de Pareja"
        subtitle="Diversión, complicidad y momentos inolvidables juntos."
      />

      {/* Selector de pestañas táctil y fluido */}
      <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-card/80 border border-white/60 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => switchTab('quiz')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'quiz'
              ? 'bg-primary text-primary-foreground shadow-md font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HelpCircle className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Preguntas</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('most-likely')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'most-likely'
              ? 'bg-primary text-primary-foreground shadow-md font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">¿Quién es?</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('roulette')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'roulette'
              ? 'bg-primary text-primary-foreground shadow-md font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Dices className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Ruleta</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('tictactoe')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
            activeTab === 'tictactoe'
              ? 'bg-primary text-primary-foreground shadow-md font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Tres en Raya</span>
        </button>
      </div>

      {/* Contenido de cada juego */}
      {activeTab === 'quiz' && (
        <Gate member={ctx.member} query={q}>
          {q.data && (
            <CoupleQuiz
              data={q.data}
              userId={ctx.uid}
              partnerName={partnerName}
            />
          )}
        </Gate>
      )}

      {activeTab === 'most-likely' && (
        <MostLikelyGame />
      )}

      {activeTab === 'roulette' && (
        <LoveRoulette />
      )}

      {activeTab === 'tictactoe' && (
        <LoveTicTacToe />
      )}
    </div>
  );
}

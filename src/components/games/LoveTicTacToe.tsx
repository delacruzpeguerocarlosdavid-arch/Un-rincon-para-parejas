import { useState } from 'react';
import { Trophy, RotateCcw, Heart, Sparkles, Award } from 'lucide-react';
import { soundFx } from '@/lib/sound-atmosphere';
import { Button } from '@/components/ui/button';

type Player = 'carlos' | 'mimie';
type Board = (Player | null)[];

const stakes = [
  'Un masaje de hombros',
  'Preparar el desayuno en la cama',
  'Elegir qué película ver',
  'Un helado pagado',
  'Un abrazo de 2 minutos sin soltarse',
  'Un cumplido en público',
];

export function LoveTicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('carlos');
  const [winner, setWinner] = useState<Player | 'tie' | null>(null);
  const [currentStake, setCurrentStake] = useState(stakes[0]);
  const [carlosWins, setCarlosWins] = useState(0);
  const [mimieWins, setMimieWins] = useState(0);

  const checkWinner = (squares: Board): Player | 'tie' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(Boolean)) return 'tie';
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    soundFx.playChime(turn === 'carlos' ? 1.0 : 1.3);

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
      if (result === 'carlos') {
        setCarlosWins(w => w + 1);
        soundFx.playChime(1.5);
      } else if (result === 'mimie') {
        setMimieWins(w => w + 1);
        soundFx.playChime(1.5);
      }
    } else {
      setTurn(turn === 'carlos' ? 'mimie' : 'carlos');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setTurn(winner === 'carlos' ? 'mimie' : 'carlos');
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-card/90 via-card/85 to-purple-100/30 dark:to-purple-950/20 p-6 shadow-xl backdrop-blur-md text-center">
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-purple-900/40 text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Trophy className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Tres en Raya del Amor
            </h2>
            <p className="text-[10px] text-muted-foreground">¡Juega con tu amor por turnos!</p>
          </div>
        </div>

        {/* Marcador de victorias */}
        <div className="flex items-center gap-2 text-xs font-serif font-bold">
          <span className="text-primary">👑 Carlos: {carlosWins}</span>
          <span>·</span>
          <span className="text-rose-500">🌸 Mimie: {mimieWins}</span>
        </div>
      </div>

      {/* Premio en juego */}
      <div className="my-4 p-3 rounded-2xl bg-white/70 dark:bg-black/30 border border-purple-200/50 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Award className="w-4 h-4 text-amber-500" />
          <span>En juego:</span>
          <strong className="text-foreground font-serif text-sm">{currentStake}</strong>
        </span>
        <button
          type="button"
          onClick={() => {
            const nextIdx = (stakes.indexOf(currentStake) + 1) % stakes.length;
            setCurrentStake(stakes[nextIdx]);
          }}
          className="text-primary hover:underline text-[11px]"
        >
          Cambiar premio
        </button>
      </div>

      {/* Indicador de turno */}
      <p className="font-serif text-sm mb-3">
        {winner ? (
          winner === 'tie' ? (
            <span className="text-amber-500 font-bold">¡Empate con amor! Ambos se dan un abrazo.</span>
          ) : (
            <span className="text-emerald-600 font-bold">
              ¡Ganó {winner === 'carlos' ? 'Carlos 👑' : 'Mimie 🌸'}! Reclama su premio.
            </span>
          )
        ) : (
          <span>
            Turno de: <strong className="text-primary">{turn === 'carlos' ? 'Carlos (👑)' : 'Mimie (🌸)'}</strong>
          </span>
        )}
      </p>

      {/* Tablero 3x3 */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto my-4">
        {board.map((cell, idx) => (
          <button
            key={idx}
            type="button"
            disabled={Boolean(cell) || Boolean(winner)}
            onClick={() => handleCellClick(idx)}
            className={`h-20 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all duration-200 shadow-sm active:scale-95 ${
              cell === 'carlos'
                ? 'bg-primary/20 border-primary text-primary'
                : cell === 'mimie'
                ? 'bg-rose-400/20 border-rose-400 text-rose-500'
                : 'bg-white/80 dark:bg-black/30 border-border/70 hover:bg-card hover:border-primary/40'
            }`}
          >
            {cell === 'carlos' ? '👑' : cell === 'mimie' ? '🌸' : ''}
          </button>
        ))}
      </div>

      {/* Botón de revancha */}
      {winner && (
        <Button
          onClick={resetGame}
          className="mt-2 rounded-full px-6 font-serif shadow-md"
          size="sm"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Jugar otra partida
        </Button>
      )}
    </div>
  );
}

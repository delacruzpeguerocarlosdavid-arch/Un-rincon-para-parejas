import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { buildQuiz } from '@/lib/word-quiz';

export function WordQuiz({ level, words, onClose }: { level: number; words: string[]; onClose: () => void }) {
  const quiz = buildQuiz(level, words);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const score = quiz.filter((q, i) => answers[i] === q.answer).length, done = Object.keys(answers).length === quiz.length;
  return <section aria-label={`Cuestionario del nivel ${level}`} className="card-soft mt-4 space-y-4 p-4">
    <h3 className="text-2xl">Repaso del nivel {level}</h3>
    {quiz.map((q, i) => { const chosen = answers[i]; return <div key={i} className="space-y-2">
      <p className="font-serif text-lg leading-snug">{i + 1}. {q.prompt}</p>
      <div className="flex flex-wrap gap-2">{q.options.map(o => <Button key={o} size="sm" disabled={!!chosen} variant={chosen ? (o === q.answer ? 'default' : o === chosen ? 'destructive' : 'outline') : 'outline'} onClick={() => setAnswers(a => ({ ...a, [i]: o }))}>{o}</Button>)}</div>
      {chosen && <p className="text-sm text-muted-foreground" role="status">{chosen === q.answer ? '✅ ¡Correcto! ' : `💗 La respuesta es «${q.answer}». `}{q.explanation}</p>}
    </div>; })}
    {done && <div className="flex items-center justify-between"><p className="text-sm">{score}/{quiz.length} correctas</p><Button size="sm" onClick={onClose}>Seguir al nivel {level + 1}</Button></div>}
  </section>;
}

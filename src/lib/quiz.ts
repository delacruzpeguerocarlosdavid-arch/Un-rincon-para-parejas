import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dominicanToday } from '@/lib/stage3';

export type QuizCategory = 'recuerdos' | 'detalles' | 'futuro' | 'profundo' | 'complicidad';

export type QuizQuestion = {
  id: string;
  question: string;
  category: QuizCategory | string;
  order_index: number;
  created_at: string;
};

export type QuizAnswer = {
  id: string;
  round_id: string;
  user_id: string;
  my_answer: string;
  guess_partner_answer: string | null;
  created_at: string;
};

export type QuizRound = {
  id: string;
  space_id: string;
  question_id: string;
  day: string;
  revealed_at: string | null;
  created_at: string;
  answers?: QuizAnswer[];
};

export type QuizData = {
  questions: QuizQuestion[];
  rounds: QuizRound[];
  answers: QuizAnswer[];
};

export const quizOptions = queryOptions({
  queryKey: ['couple_quiz'],
  queryFn: async (): Promise<QuizData> => {
    const [qRes, rRes, aRes] = await Promise.all([
      supabase.from('couple_quiz_questions').select('*').order('order_index', { ascending: true }),
      supabase.from('couple_quiz_rounds').select('*').order('created_at', { ascending: false }),
      supabase.from('couple_quiz_answers').select('*').order('created_at', { ascending: true }),
    ]);

    if (qRes.error) throw qRes.error;
    if (rRes.error) throw rRes.error;
    if (aRes.error) throw aRes.error;

    return {
      questions: (qRes.data as QuizQuestion[]) ?? [],
      rounds: (rRes.data as QuizRound[]) ?? [],
      answers: (aRes.data as QuizAnswer[]) ?? [],
    };
  },
});

/**
 * Selecciona la pregunta del día de forma determinista para la fecha de Santo Domingo.
 */
export function getTodayQuestion(questions: QuizQuestion[], day = dominicanToday()): QuizQuestion | null {
  if (!questions.length) return null;
  let hash = 0;
  for (let i = 0; i < day.length; i++) {
    hash = (hash << 5) - hash + day.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % questions.length;
  return questions[index] ?? questions[0] ?? null;
}

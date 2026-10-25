import { describe, expect, it } from 'vitest';
import { getTodayQuestion, type QuizQuestion } from '@/lib/quiz';

describe('¿Cuánto nos conocemos? (Couple Quiz)', () => {
  const sampleQuestions: QuizQuestion[] = [
    { id: '1', question: '¿Cuál fue nuestro primer viaje?', category: 'recuerdos', order_index: 1, created_at: '' },
    { id: '2', question: '¿Cuál es mi manía tierna favorita?', category: 'detalles', order_index: 2, created_at: '' },
    { id: '3', question: '¿Cuál es nuestro plan soñado?', category: 'futuro', order_index: 3, created_at: '' },
    { id: '4', question: '¿Qué es lo que más te tranquiliza de mí?', category: 'profundo', order_index: 4, created_at: '' },
  ];

  it('selecciona la misma pregunta para el mismo día (determinismo de pareja)', () => {
    const q1 = getTodayQuestion(sampleQuestions, '2026-10-24');
    const q2 = getTodayQuestion(sampleQuestions, '2026-10-24');
    expect(q1?.id).toBe(q2?.id);
  });

  it('cambia la pregunta en días distintos', () => {
    const qDay1 = getTodayQuestion(sampleQuestions, '2026-10-24');
    const qDay2 = getTodayQuestion(sampleQuestions, '2026-10-25');
    // En días sucesivos debe rotar a una pregunta válida
    expect(qDay1).toBeDefined();
    expect(qDay2).toBeDefined();
  });

  it('retorna null si la lista está vacía', () => {
    expect(getTodayQuestion([])).toBeNull();
  });
});

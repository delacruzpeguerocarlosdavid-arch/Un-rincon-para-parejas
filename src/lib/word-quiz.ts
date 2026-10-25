import { verses } from '@/lib/bible-verses';

export type QuizQuestion = { prompt: string; options: string[]; answer: string; explanation: string };
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const pick = <T,>(list: T[], seed: number) => list[((seed % list.length) + list.length) % list.length]!;
const shuffle = (list: string[], seed: number) => [...list].sort((a, b) => ((norm(a).charCodeAt(0) * 7 + seed) % 11) - ((norm(b).charCodeAt(0) * 7 + seed) % 11) || a.localeCompare(b));

/** Builds a deterministic three-question quiz from the level's verse and its board words. */
export function buildQuiz(level: number, words: string[]): QuizQuestion[] {
  const i = (level - 1) % verses.length, v = verses[i]!;
  const others = verses.filter(x => x.reference !== v.reference);
  const qs: QuizQuestion[] = [];
  const refs = shuffle([v.reference, pick(others, level * 3).reference, pick(others, level * 7 + 1).reference].filter((r, k, a) => a.indexOf(r) === k), level);
  qs.push({ prompt: '¿Qué cita bíblica estudiaron en este tablero?', options: refs, answer: v.reference, explanation: `El versículo de este nivel es ${v.reference}: «${v.text}»` });
  const tokens = v.text.split(/(\s+)/);
  const inVerse = words.filter(w => tokens.some(t => norm(t.replace(/[^\p{L}]/gu, '')) === w));
  if (inVerse.length) {
    const w = pick(inVerse, level), token = tokens.find(t => norm(t.replace(/[^\p{L}]/gu, '')) === w)!, original = token.replace(/[^\p{L}]/gu, '');
    const blank = tokens.map(t => t === token ? t.replace(original, '_____') : t).join('');
    const decoys = words.filter(x => x !== w).slice(0, 2).map(x => x.toLowerCase());
    qs.push({ prompt: `Completa el versículo: «${blank}»`, options: shuffle([original.toLowerCase(), ...decoys], level + 1), answer: original.toLowerCase(), explanation: `La palabra que falta es «${original}». ${v.reference} dice: «${v.text}»` });
  }
  const outside = ['TRISTEZA', 'OLVIDO', 'ENVIDIA', 'RENCOR', 'DISTANCIA', 'MENTIRA'].filter(x => !words.includes(x));
  const real = pick(words, level + 2);
  qs.push({ prompt: '¿Cuál de estas palabras encontraron en el tablero?', options: shuffle([real, pick(outside, level), pick(outside, level + 1)].filter((r, k, a) => a.indexOf(r) === k), level + 2), answer: real, explanation: `«${real}» era una de las palabras del tablero: ${words.join(', ')}.` });
  return qs;
}

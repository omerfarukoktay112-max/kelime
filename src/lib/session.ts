import { conflicts, getAllWords, getWordsByLevel } from '@/data/words';
import type { Direction, Word } from '@/data/types';
import { isDue, type WordStat } from './srs';

export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Havuzu öncelik sırasına dizer:
 * 1) tekrar zamanı gelmiş kelimeler (önce yanlış yapılanlar / alt kutudakiler, sonra en uzun süredir görülmeyenler)
 * 2) hiç görülmemiş kelimeler (rastgele)
 * 3) zamanı henüz gelmemiş kelimeler (tekrar tarihi en yakın olan önce)
 */
function prioritize(pool: Word[], stats: Record<string, WordStat>): Word[] {
  const now = Date.now();
  const scored = shuffle(pool).map((w) => {
    const s = stats[w.id];
    const group = !s ? 1 : isDue(s, now) ? 0 : 2;
    const key = !s ? 0 : group === 0 ? s.s * 1e13 + s.t : (s.d ?? 0);
    return { w, group, key };
  });
  scored.sort((a, b) => a.group - b.group || a.key - b.key);
  return scored.map((x) => x.w);
}

/**
 * Çalışılacak kelimeleri seçer. `repeat` açıksa ve havuz küçükse liste tekrar edilir
 * (seviye çalışması); kapalıysa en fazla havuz kadar kelime döner (tekrar / hatalar).
 */
export function pickStudyWords(pool: Word[], count: number, stats: Record<string, WordStat>, repeat = true): Word[] {
  if (pool.length === 0 || count <= 0) return [];
  const ordered = prioritize(pool, stats);
  if (!repeat) return ordered.slice(0, count);
  const out: Word[] = [];
  while (out.length < count) out.push(...ordered.slice(0, count - out.length));
  return out;
}

export interface ChoiceQuestion {
  word: Word;
  prompt: string;
  options: string[];
  correctIndex: number;
}

/**
 * Çoktan seçmeli soru: 1 doğru + 3 çeldirici. Çeldiriciler önce aynı seviyeden alınır;
 * doğru kelimeyle eş anlamlı / anlamı çakışan kelimeler çeldirici olamaz.
 */
export function buildChoiceQuestion(word: Word, direction: Direction, optionCount = 4): ChoiceQuestion {
  const answerOf = (w: Word) => (direction === 'en-tr' ? w.tr : w.en);
  const correct = answerOf(word);
  const picked: Word[] = [];
  const usedText = new Set([correct.toLocaleLowerCase('tr')]);

  for (const pool of [getWordsByLevel(word.level), getAllWords()]) {
    for (const w of shuffle(pool)) {
      if (picked.length >= optionCount - 1) break;
      const text = answerOf(w).toLocaleLowerCase('tr');
      if (usedText.has(text) || conflicts(word, w) || picked.some((p) => conflicts(p, w))) continue;
      usedText.add(text);
      picked.push(w);
    }
  }
  const options = shuffle([correct, ...picked.map(answerOf)]);
  return {
    word,
    prompt: direction === 'en-tr' ? word.en : word.tr,
    options,
    correctIndex: options.indexOf(correct),
  };
}

export const MATCH_BOARD_SIZE = 8;

/**
 * Eşleştirme turları: her tur en fazla 8 kelime. Bir tahtada anlamı çakışan iki kelime
 * olmaz (ör. "very" ve "much" ikisi de "çok" olduğundan aynı tahtaya konmaz).
 */
export function buildMatchBoards(pool: Word[], rounds: number, stats: Record<string, WordStat>): Word[][] {
  if (pool.length < 2) return [];
  const ordered = prioritize(pool, stats);
  const boards: Word[][] = [];
  let cursor = 0;
  for (let r = 0; r < rounds; r++) {
    const board: Word[] = [];
    // Öncelik sırasında dolaş; çakışanları atla. Liste biterse baştan devam et.
    for (let tries = 0; tries < ordered.length && board.length < MATCH_BOARD_SIZE; tries++) {
      const w = ordered[(cursor + tries) % ordered.length];
      if (!board.some((b) => conflicts(b, w))) board.push(w);
    }
    cursor = (cursor + MATCH_BOARD_SIZE) % ordered.length;
    if (board.length >= 2) boards.push(board);
  }
  return boards;
}


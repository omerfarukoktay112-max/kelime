import raw from '../../assets/data/words.json';
import { LEVELS, type Level, type Word } from './types';

/**
 * Kelime dosyası: assets/data/words.json  (kaynağı: ../ingilizce_kelimeler.json, `npm run words:sync` ile kopyalanır)
 *
 * Biçim:
 * {
 *   "A1": [ { "word": "house", "turkish": ["ev"], "meaning_groups": ["ev"], "usage_note"?: "..." }, ... ],
 *   ... "C2": [...],
 *   "_ortak_anlamlar": { ... },   // meaning_groups'tan türetilir, uygulama kullanmaz
 *   "_kaynak": { ... }
 * }
 */
interface RawEntry {
  word?: unknown;
  turkish?: unknown;
  meaning_groups?: unknown;
  usage_note?: unknown;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()) : [];

/** "saat (süre)" -> "saat" ; karşılaştırma anahtarı */
export const meaningKey = (s: string) =>
  s.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLocaleLowerCase('tr');

function load(): { words: Word[]; skipped: number } {
  const data = (raw ?? {}) as Record<string, unknown>;
  const entries: { level: Level; en: string; tr: string[]; group: string; note?: string }[] = [];
  let skipped = 0;

  for (const level of LEVELS) {
    const list = Array.isArray(data[level]) ? (data[level] as RawEntry[]) : [];
    for (const r of list) {
      const en = typeof r.word === 'string' ? r.word.trim() : '';
      const tr = strings(r.turkish);
      if (!en || tr.length === 0) {
        skipped++;
        continue;
      }
      const group = strings(r.meaning_groups)[0] ?? tr[0];
      entries.push({ level, en, tr, group, note: typeof r.usage_note === 'string' ? r.usage_note : undefined });
    }
  }

  // Aynı gruptaki kelimeler (eş anlamlılar)
  const byGroup = new Map<string, string[]>();
  for (const e of entries) byGroup.set(e.group, [...(byGroup.get(e.group) ?? []), e.en]);

  // Ana Türkçe anlamı başka bir gruptaki kelimeyle çakışıyor mu?
  const groupsByMain = new Map<string, Set<string>>();
  for (const e of entries) {
    const k = meaningKey(e.tr[0]);
    groupsByMain.set(k, (groupsByMain.get(k) ?? new Set()).add(e.group));
  }

  const ids = new Set<string>();
  const words: Word[] = [];
  for (const e of entries) {
    const id = e.en.toLowerCase();
    if (ids.has(id)) {
      skipped++;
      continue;
    }
    ids.add(id);
    const ambiguous = (groupsByMain.get(meaningKey(e.tr[0]))?.size ?? 0) > 1;
    // Belirsizse bağlam etiketli grup adını göster ("saat (süre)"), değilse ilk anlamı
    const display = ambiguous && /\(.+\)/.test(e.group) ? e.group : e.tr[0];
    words.push({
      id,
      level: e.level,
      en: e.en,
      tr: display,
      group: e.group,
      enAccepted: [e.en, ...(byGroup.get(e.group) ?? []).filter((w) => w !== e.en)],
      trAccepted: e.tr,
      trKeys: [...new Set([...e.tr, e.group].map(meaningKey))],
      note: e.note,
    });
  }
  return { words, skipped };
}

const { words: ALL_WORDS, skipped } = load();

if (__DEV__ && skipped > 0) {
  console.warn(`[words] ${skipped} kayıt geçersiz ya da tekrar olduğu için atlandı.`);
}

const BY_LEVEL: Record<Level, Word[]> = Object.fromEntries(
  LEVELS.map((l) => [l, ALL_WORDS.filter((w) => w.level === l)]),
) as Record<Level, Word[]>;

const BY_ID = new Map(ALL_WORDS.map((w) => [w.id, w]));

export function getAllWords(): Word[] {
  return ALL_WORDS;
}

export function getWordsByLevel(level: Level): Word[] {
  return BY_LEVEL[level];
}

export function getWord(id: string): Word | undefined {
  return BY_ID.get(id);
}

/**
 * İki kelime aynı soruda / eşleştirme tahtasında yan yana olmamalı mı?
 * Aynı gruptaysa ya da Türkçe anlamlarından biri ortaksa birbirinin yerine geçebilirler.
 */
export function conflicts(a: Word, b: Word): boolean {
  if (a.id === b.id || a.group === b.group) return true;
  return a.trKeys.some((k) => b.trKeys.includes(k));
}

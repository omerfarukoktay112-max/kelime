export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = {
  A1: 'Başlangıç',
  A2: 'Temel',
  B1: 'Orta',
  B2: 'Orta üstü',
  C1: 'İleri',
  C2: 'Uzman',
};

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value);
}

/** Uygulama içinde kullanılan normalize edilmiş kelime. */
export interface Word {
  /** Kalıcı kimlik (küçük harfli İngilizce kelime): ilerleme ve pasif listesi bu id ile saklanır. */
  id: string;
  level: Level;
  /** İngilizce kelime (ekranda gösterilen). */
  en: string;
  /**
   * Ekranda gösterilen Türkçe karşılık. Aynı Türkçe kelime birden fazla İngilizce kelimeye
   * karşılık geliyorsa bağlam etiketli hali gösterilir: "saat (süre)" / "saat (cihaz)".
   */
  tr: string;
  /** Ortak anlam grubu: aynı gruptaki kelimeler eş anlamlı sayılır. */
  group: string;
  /** Sesli / yazılı modda doğru kabul edilen İngilizce cevaplar (kelimenin kendisi + aynı gruptakiler). */
  enAccepted: string[];
  /** Kelimenin tüm Türkçe karşılıkları. */
  trAccepted: string[];
  /** Karşılaştırma için sadeleştirilmiş Türkçe anlamlar (parantezsiz, küçük harf). */
  trKeys: string[];
  /** Kullanım notu (varsa). */
  note?: string;
}

export type StudyMode = 'choice' | 'match' | 'speak';

/** Soru yönü: İngilizce → Türkçe ya da tersi. */
export type Direction = 'en-tr' | 'tr-en';

/** Çalışma destesi: bir seviye, ya da tüm seviyelerden zamanı gelen tekrarlar / hatalar. */
export type Deck = Level | 'review' | 'mistakes';

export function isDeck(value: unknown): value is Deck {
  return value === 'review' || value === 'mistakes' || isLevel(value);
}

export const DECK_TITLES: Record<'review' | 'mistakes', string> = {
  review: 'Tekrar',
  mistakes: 'Hatalarım',
};

/** Ekranda gösterilecek kısa ad: "A1", "Tekrar", "Hatalarım" */
export function deckLabel(deck: Deck): string {
  return isLevel(deck) ? deck : DECK_TITLES[deck];
}

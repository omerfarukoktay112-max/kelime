import type { Direction } from '@/data/types';

export interface Settings {
  dailyGoal: number;
  defaultRounds: number;
  direction: Direction;
  autoplay: boolean;
  accent: 'en-US' | 'en-GB';
  speechRate: 'slow' | 'normal' | 'fast';
  microphone: boolean;
  sfx: boolean;
  haptics: boolean;
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 20,
  defaultRounds: 10,
  direction: 'en-tr',
  autoplay: true,
  accent: 'en-US',
  speechRate: 'normal',
  microphone: true,
  sfx: true,
  haptics: false,
  theme: 'dark',
  fontSize: 'medium',
};

export const ROUND_OPTIONS = [5, 10, 20, 30] as const;

/** Ayarlar ekranında değer satırına dokununca sırayla dönülen seçenekler. */
export const SETTING_OPTIONS = {
  dailyGoal: [10, 20, 30, 50],
  defaultRounds: [...ROUND_OPTIONS],
  direction: ['en-tr', 'tr-en'],
  accent: ['en-US', 'en-GB'],
  speechRate: ['slow', 'normal', 'fast'],
  theme: ['dark', 'light'],
  fontSize: ['small', 'medium', 'large'],
} as const satisfies Partial<Record<keyof Settings, readonly unknown[]>>;

export const SPEECH_RATE_VALUE: Record<Settings['speechRate'], number> = {
  slow: 0.7,
  normal: 1,
  fast: 1.25,
};

export function formatSetting<K extends keyof typeof SETTING_OPTIONS>(key: K, value: Settings[K]): string {
  switch (key) {
    case 'dailyGoal':
      return `${value} kelime`;
    case 'direction':
      return value === 'en-tr' ? 'İng → Tür' : 'Tür → İng';
    case 'accent':
      return value === 'en-US' ? 'ABD' : 'İngiltere';
    case 'speechRate':
      return value === 'slow' ? 'Yavaş' : value === 'fast' ? 'Hızlı' : 'Normal';
    case 'theme':
      return value === 'light' ? 'Açık' : 'Koyu';
    case 'fontSize':
      return value === 'small' ? 'Küçük' : value === 'large' ? 'Büyük' : 'Orta';
    default:
      return String(value);
  }
}

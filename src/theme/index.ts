import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useAppStore } from '@/store/AppStore';

export type ThemeName = 'dark' | 'light';

// Tasarımdaki (Kelime Kartları artifact'ı) renkler.
const dark = {
  bg: '#2d1b69',
  surface: '#3a2878',
  border: '#54429b',
  divider: '#4a3a8f',
  accent: '#c8ff3d',
  onAccent: '#2d1b69',
  /** accent zemin üzerindeki ilerleme çubuğu izi */
  onAccentTrack: 'rgba(45, 27, 105, 0.25)',
  /** mikrofon halkası gibi yumuşak vurgu */
  accentSoft: 'rgba(200, 255, 61, 0.4)',
  text: '#F6F3FF',
  textMuted: '#CFC6F0',
  textDisabled: '#B5A9E0',
  ring: '#8272c9',
  danger: '#FFB4A8',
  // Ağaç çizimi
  leaf: '#c8ff3d',
  leafShade: '#8fd12a',
  trunk: '#b08a6a',
  soil: '#54429b',
  flower: '#ffd1f0',
  fruit: '#ff7a6b',
};

export type Colors = typeof dark;

/** Açık tema: koyu temadaki renklerin tersi (danger hariç; kırmızı anlamını korusun diye). */
const light: Colors = {
  bg: '#d2e496',
  surface: '#c5d787',
  border: '#abbd64',
  divider: '#b5c570',
  accent: '#3700c2',
  onAccent: '#d2e496',
  onAccentTrack: 'rgba(210, 228, 150, 0.3)',
  accentSoft: 'rgba(55, 0, 194, 0.35)',
  text: '#090c00',
  textMuted: '#30390f',
  textDisabled: '#4a561f',
  ring: '#7d8d36',
  danger: '#b3261e',
  leaf: '#3f8a1c',
  leafShade: '#2d6b12',
  trunk: '#6b4a2b',
  soil: '#abbd64',
  flower: '#ffffff',
  fruit: '#d93a2b',
};

export const THEMES: Record<ThemeName, Colors> = { dark, light };

/** Ayarlardaki temaya göre renkler. */
export function useColors(): Colors {
  return THEMES[useAppStore().settings.theme];
}

/**
 * Temaya bağlı stil tanımı. Kullanım:
 *   const useStyles = makeStyles((c) => ({ box: { backgroundColor: c.surface } }));
 *   const styles = useStyles();
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(factory: (c: Colors) => T): () => T {
  const cache = new Map<Colors, T>();
  return function useStyles() {
    const c = useColors();
    let s = cache.get(c);
    if (!s) {
      s = StyleSheet.create(factory(c));
      cache.set(c, s);
    }
    return s;
  };
}

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
} as const;

/** Ekran yatay kenar boşluğu */
export const SCREEN_PADDING = 24;

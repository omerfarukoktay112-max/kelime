import { Text, type TextProps, type TextStyle } from 'react-native';

import { useAppStore } from '@/store/AppStore';
import { fonts, useColors } from '@/theme';

type Variant = 'regular' | 'medium' | 'bold' | 'display' | 'caps';

const FONT_SCALE = { small: 0.9, medium: 1, large: 1.15 } as const;

interface Props extends TextProps {
  variant?: Variant;
  size?: number;
  color?: string;
}

/**
 * Uygulamadaki tüm metinler için. Ayarlardaki "Yazı boyutu"nu ve temayı uygular.
 * `caps`: tasarımdaki küçük, büyük harfli bölüm başlıkları.
 */
export function Txt({ variant = 'regular', size = 16, color, style, ...rest }: Props) {
  const { settings } = useAppStore();
  const c = useColors();
  const scale = FONT_SCALE[settings.fontSize];
  const base: TextStyle = {
    fontFamily: variant === 'caps' ? fonts.bold : fonts[variant],
    fontSize: size * scale,
    color: color ?? (variant === 'caps' ? c.textMuted : c.text),
  };
  return (
    <Text
      {...rest}
      style={[
        base,
        variant === 'display' && { letterSpacing: -0.5 },
        variant === 'caps' && { textTransform: 'uppercase', letterSpacing: 1.1 },
        style,
      ]}
    />
  );
}

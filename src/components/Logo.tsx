import Svg, { Path, Rect } from 'react-native-svg';

import { useColors } from '@/theme';

/**
 * kelime logosu ("Filiz k"): üst kolu yaprak olan küçük harf k.
 * Rengi temadan gelir: koyu temada lime, açık temada mor. Ana dosyalar: design/logo/
 */
export function LogoMark({ size = 28, color }: { size?: number; color?: string }) {
  const c = useColors();
  const fill = color ?? c.accent;
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessibilityLabel="kelime logosu">
      <Rect x={54} y={18} width={40} height={200} rx={20} fill={fill} />
      <Path d="M90 146 L174 212" stroke={fill} strokeWidth={40} strokeLinecap="round" />
      <Path d="M86 140 C90 82 134 46 202 38 C198 106 154 140 86 140 Z" fill={fill} />
    </Svg>
  );
}

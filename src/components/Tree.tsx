import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { useColors } from '@/theme';

/** Yaprak kümesi (taç) daireleri: [x, y, yarıçap] — 200x200 alanda */
const CANOPY_SMALL: [number, number, number][] = [
  [100, 96, 30],
  [78, 110, 22],
  [122, 110, 22],
];
const CANOPY_BIG: [number, number, number][] = [
  [100, 70, 38],
  [66, 92, 30],
  [134, 92, 30],
  [84, 116, 28],
  [116, 116, 28],
  [100, 100, 34],
];
const FLOWERS: [number, number][] = [
  [80, 70], [118, 60], [140, 98], [64, 104], [100, 120], [122, 122], [92, 90],
];

/**
 * Ağacın aşamaya göre çizimi.
 * stage: 0 tohum · 1 filiz · 2 fidan · 3 genç ağaç · 4 ağaç · 5 çiçekli · 6 meyveli
 * thirsty: solgun yapraklar (son günlerde hedef tamamlanmadı)
 */
export function Tree({ stage, thirsty, size = 160 }: { stage: number; thirsty?: boolean; size?: number }) {
  const c = useColors();
  const leaf = thirsty ? c.textDisabled : c.leaf;
  const leafShade = thirsty ? c.ring : c.leafShade;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* toprak */}
      <Ellipse cx={100} cy={178} rx={70} ry={12} fill={c.soil} />

      {stage === 0 && <Ellipse cx={100} cy={172} rx={9} ry={6} fill={c.trunk} />}

      {stage === 1 && (
        <G>
          <Path d="M100 176 C100 162 100 156 100 148" stroke={leafShade} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M100 152 C88 150 82 142 84 134 C94 136 100 144 100 152 Z" fill={leaf} />
          <Path d="M100 150 C112 148 118 140 116 132 C106 134 100 142 100 150 Z" fill={leaf} />
        </G>
      )}

      {stage === 2 && (
        <G>
          <Path d="M100 176 C100 150 98 130 100 110" stroke={c.trunk} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d="M100 140 C86 140 76 130 78 120 C90 122 100 130 100 140 Z" fill={leaf} />
          <Path d="M100 132 C114 132 124 122 122 112 C110 114 100 122 100 132 Z" fill={leaf} />
          <Path d="M100 116 C90 114 86 104 90 96 C98 100 102 108 100 116 Z" fill={leafShade} />
          <Path d="M100 114 C110 112 114 102 110 94 C102 98 98 106 100 114 Z" fill={leaf} />
        </G>
      )}

      {stage >= 3 && (
        <G>
          {/* gövde ve dallar */}
          <Path
            d={stage === 3 ? 'M94 176 L97 120 L103 120 L106 176 Z' : 'M90 176 L95 104 L105 104 L110 176 Z'}
            fill={c.trunk}
          />
          {stage >= 4 && (
            <>
              <Path d="M98 130 L76 108" stroke={c.trunk} strokeWidth={5} strokeLinecap="round" />
              <Path d="M102 122 L126 100" stroke={c.trunk} strokeWidth={5} strokeLinecap="round" />
            </>
          )}
          {/* taç: önce gölge, sonra yapraklar */}
          {(stage === 3 ? CANOPY_SMALL : CANOPY_BIG).map(([x, y, r], i) => (
            <Circle key={`s${i}`} cx={x + 3} cy={y + 4} r={r} fill={leafShade} />
          ))}
          {(stage === 3 ? CANOPY_SMALL : CANOPY_BIG).map(([x, y, r], i) => (
            <Circle key={`l${i}`} cx={x} cy={y} r={r} fill={leaf} />
          ))}
          {/* çiçekler / meyveler */}
          {stage >= 5 &&
            !thirsty &&
            FLOWERS.map(([x, y], i) =>
              stage === 6 && i % 2 === 0 ? (
                <Circle key={`f${i}`} cx={x} cy={y} r={6} fill={c.fruit} />
              ) : (
                <G key={`f${i}`}>
                  <Circle cx={x} cy={y} r={5} fill={c.flower} />
                  <Circle cx={x} cy={y} r={2} fill={c.fruit} />
                </G>
              ),
            )}
        </G>
      )}
    </Svg>
  );
}

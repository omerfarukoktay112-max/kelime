import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { LogoMark } from '@/components/Logo';
import { TabBar } from '@/components/TabBar';
import { Tree } from '@/components/Tree';
import { Txt } from '@/components/Txt';
import { ProgressBar, Screen } from '@/components/ui';
import { LEVEL_NAMES, LEVELS, type Level } from '@/data/types';
import { isThirsty, treeStage } from '@/lib/tree';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

/** 1 · Ana ekran: tekrar / hatalar + seviyeler */
export default function HomeScreen() {
  const styles = useStyles();
  const { levelProgress, lastLevel, reviewCount, mistakeCount, garden } = useAppStore();

  return (
    <Screen>
      <View style={styles.brand}>
        <LogoMark size={30} />
        <Txt variant="display" size={24} style={{ flex: 1 }}>
          kelime
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Ağacını gör" onPress={() => router.replace('/profile')}>
          <Tree stage={treeStage(garden.days)} thirsty={isThirsty(garden)} size={44} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.deckRow}>
          <DeckCard
            title="Tekrar"
            count={reviewCount}
            empty="Bugünlük tekrar yok"
            onPress={() => router.push({ pathname: '/level/[level]', params: { level: 'review' } })}
          />
          <DeckCard
            title="Hatalarım"
            count={mistakeCount}
            empty="Hata yok"
            onPress={() => router.push({ pathname: '/level/[level]', params: { level: 'mistakes' } })}
          />
        </View>

        <Txt variant="display" size={36} style={styles.title}>
          Seviyeni seç
        </Txt>

        <View style={styles.grid}>
          {LEVELS.map((level) => (
            <LevelCard key={level} level={level} highlighted={level === lastLevel} {...levelProgress(level)} />
          ))}
        </View>
      </ScrollView>

      <TabBar active="levels" />
    </Screen>
  );
}

function DeckCard({ title, count, empty, onPress }: { title: string; count: number; empty: string; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const disabled = count === 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} kelime`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.deck, pressed && { opacity: 0.85 }]}
    >
      <Txt variant="bold" size={16}>
        {title}
      </Txt>
      {disabled ? (
        <Txt size={14} color={colors.textMuted}>
          {empty}
        </Txt>
      ) : (
        <Txt variant="display" size={30} color={colors.accent} style={{ lineHeight: 34 }}>
          {count}
          <Txt variant="medium" size={14} color={colors.textMuted}>
            {'  kelime'}
          </Txt>
        </Txt>
      )}
    </Pressable>
  );
}

function LevelCard({
  level,
  learned,
  total,
  highlighted,
}: {
  level: Level;
  learned: number;
  total: number;
  highlighted: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const fg = highlighted ? colors.onAccent : colors.text;
  const muted = highlighted ? colors.onAccent : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${level} ${LEVEL_NAMES[level]}, ${learned} / ${total} öğrenildi`}
      onPress={() => router.push({ pathname: '/level/[level]', params: { level } })}
      style={({ pressed }) => [styles.card, highlighted ? styles.cardOn : styles.cardOff, pressed && { opacity: 0.85 }]}
    >
      <View>
        <Txt variant="display" size={52} color={fg} style={{ lineHeight: 56 }}>
          {level}
        </Txt>
        <Txt variant="medium" size={15} color={muted}>
          {LEVEL_NAMES[level]}
        </Txt>
      </View>
      <View style={{ gap: 8 }}>
        <Txt variant="bold" size={14} color={muted}>
          {learned} / {total}
        </Txt>
        <ProgressBar
          value={total ? learned / total : 0}
          height={6}
          track={highlighted ? colors.onAccentTrack : colors.border}
          fill={highlighted ? colors.onAccent : colors.accent}
        />
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  deckRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  deck: {
    flex: 1,
    minHeight: 96,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
  },
  title: { marginTop: 28, marginBottom: 20, lineHeight: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    flexGrow: 1,
    height: 156,
    borderRadius: radius.xl,
    padding: 18,
    justifyContent: 'space-between',
  },
  cardOn: { backgroundColor: colors.accent },
  cardOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
}));

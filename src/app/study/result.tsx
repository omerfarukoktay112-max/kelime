import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { LinkButton, PrimaryButton, ProgressBar, Screen, Spacer } from '@/components/ui';
import { deckLabel, isDeck, isLevel, type StudyMode } from '@/data/types';
import { dayKey } from '@/lib/tree';
import { MODE_ROUTES } from '@/lib/useLevelParam';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

const MODE_TITLES: Record<StudyMode, string> = {
  choice: 'Çoktan seçmeli',
  match: 'Eşleştirme',
  speak: 'Sesli',
};

/** Tur sonu özeti */
export default function ResultScreen() {
  const styles = useStyles();
  const colors = useColors();
  const p = useLocalSearchParams<{ level?: string; rounds?: string; mode?: string; correct?: string; total?: string }>();
  const { todayCount, settings, levelProgress, deckWords, garden } = useAppStore();

  const deck = isDeck(p.level) ? p.level : 'A1';
  const mode: StudyMode = p.mode === 'match' || p.mode === 'speak' ? p.mode : 'choice';
  const correct = Number(p.correct) || 0;
  const total = Number(p.total) || 0;
  const ratio = total ? correct / total : 0;
  const remaining = deckWords(deck).length;
  const watered = garden.last === dayKey();

  const headline = ratio >= 0.9 ? 'Harika!' : ratio >= 0.6 ? 'İyi gidiyor' : 'Biraz daha pratik';

  let deckStat: { label: string; value: string };
  if (isLevel(deck)) {
    const { learned, total: levelTotal } = levelProgress(deck);
    deckStat = { label: `${deck} öğrenilen`, value: `${learned} / ${levelTotal}` };
  } else {
    deckStat = { label: deck === 'review' ? 'Kalan tekrar' : 'Kalan hata', value: String(remaining) };
  }

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <View style={{ marginTop: 48, gap: 8 }}>
        <Txt variant="caps" size={14}>
          {deckLabel(deck)} · {MODE_TITLES[mode]}
        </Txt>
        <Txt variant="display" size={44} style={{ lineHeight: 48 }}>
          {headline}
        </Txt>
      </View>

      <View style={styles.hero}>
        <Txt variant="bold" size={15} color={colors.onAccent}>
          {mode === 'match' ? 'İlk denemede doğru' : 'Doğru cevap'}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginVertical: 8 }}>
          <Txt variant="display" size={72} color={colors.onAccent} style={{ lineHeight: 76 }}>
            {correct}
          </Txt>
          <Txt variant="medium" size={18} color={colors.onAccent}>
            / {total}
          </Txt>
        </View>
        <ProgressBar value={ratio} track={colors.onAccentTrack} fill={colors.onAccent} />
      </View>

      <View style={{ marginTop: 24, gap: 14 }}>
        <Stat label={deckStat.label} value={deckStat.value} />
        <Stat label="Bugünkü hedef" value={`${Math.min(todayCount, settings.dailyGoal)} / ${settings.dailyGoal}`} />
      </View>

      {watered && (
        <Txt variant="medium" size={15} color={colors.textMuted} style={{ marginTop: 16, textAlign: 'center' }}>
          Bugünkü hedef tamam, ağacın sulandı.
        </Txt>
      )}

      <Spacer />

      <View style={{ gap: 4 }}>
        {remaining > 0 && (
          <PrimaryButton
            title="Tekrar çalış"
            onPress={() => router.replace({ pathname: MODE_ROUTES[mode], params: { level: deck, rounds: p.rounds ?? '10' } })}
          />
        )}
        <LinkButton title="Ana ekrana dön" onPress={() => router.dismissTo('/')} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.stat}>
      <Txt variant="medium" size={17} style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt variant="bold" size={17} color={colors.accent}>
        {value}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  hero: { marginTop: 28, padding: 22, borderRadius: radius.xxl, backgroundColor: colors.accent },
  stat: {
    minHeight: 60,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

import { ScrollView, View } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { Tree } from '@/components/Tree';
import { Txt } from '@/components/Txt';
import { ProgressBar, Screen } from '@/components/ui';
import { LEVELS } from '@/data/types';
import { daysToNextStage, isThirsty, TREE_STAGES, treeStage } from '@/lib/tree';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

/** 7 · Profil */
export default function ProfileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { levelProgress, todayCount, settings, garden } = useAppStore();
  const rows = LEVELS.map((level) => ({ level, ...levelProgress(level) }));
  const learned = rows.reduce((n, r) => n + r.learned, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);

  const stage = treeStage(garden.days);
  const thirsty = isThirsty(garden);
  const next = daysToNextStage(garden.days);
  const goalDone = todayCount >= settings.dailyGoal;

  let treeNote: string;
  if (garden.days === 0) treeNote = 'Günlük hedefini ilk kez tamamladığında tohumun filizlenecek.';
  else if (thirsty) treeNote = 'Ağacın susadı. Bugün hedefini tamamla, yeniden canlansın.';
  else if (next) treeNote = `${next.days} gün daha hedefini tamamlarsan: ${next.name}`;
  else treeNote = 'Ağacın tam olgunluğa ulaştı. Sulamaya devam!';

  return (
    <Screen>
      <Txt variant="display" size={44} style={{ marginTop: 8, lineHeight: 48 }}>
        Profil
      </Txt>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.treeCard}>
          <Tree stage={stage} thirsty={thirsty} size={150} />
          <View style={{ flex: 1, gap: 6 }}>
            <Txt variant="caps" size={13}>
              Ağacın
            </Txt>
            <Txt variant="display" size={26} style={{ lineHeight: 30 }}>
              {TREE_STAGES[stage].name}
            </Txt>
            <Txt variant="medium" size={14} color={colors.textMuted}>
              {garden.days} gün sulandı · bugün {goalDone ? 'sulandı' : `${Math.max(0, settings.dailyGoal - todayCount)} doğru kaldı`}
            </Txt>
            <Txt size={14} color={colors.textMuted}>
              {treeNote}
            </Txt>
          </View>
        </View>

        <View style={styles.hero}>
          <Txt variant="bold" size={15} color={colors.onAccent}>
            Öğrenilen kelime
          </Txt>
          <View style={styles.heroRow}>
            <Txt variant="display" size={72} color={colors.onAccent} style={{ lineHeight: 76 }}>
              {learned}
            </Txt>
            <Txt variant="medium" size={16} color={colors.onAccent}>
              / {total}
            </Txt>
          </View>
          <ProgressBar value={total ? learned / total : 0} track={colors.onAccentTrack} fill={colors.onAccent} />
          <Txt variant="medium" size={14} color={colors.onAccent} style={{ marginTop: 12 }}>
            Bugün {todayCount} / {settings.dailyGoal} doğru cevap
          </Txt>
        </View>

        <Txt variant="caps" size={14} style={{ marginTop: 28, marginBottom: 12 }}>
          Seviyelere göre
        </Txt>
        <View style={{ gap: 18 }}>
          {rows.map((r) => (
            <View key={r.level} style={styles.levelRow}>
              <Txt variant="display" size={22} style={{ width: 36 }}>
                {r.level}
              </Txt>
              <View style={{ flex: 1 }}>
                <ProgressBar value={r.total ? r.learned / r.total : 0} />
              </View>
              <Txt variant="medium" size={15} color={colors.textMuted} style={{ minWidth: 72, textAlign: 'right' }}>
                {r.learned} / {r.total}
              </Txt>
            </View>
          ))}
        </View>
        <Txt size={13} color={colors.textMuted} style={{ marginTop: 18 }}>
          Bir kelime farklı günlerde 4 kez doğru bilinince öğrenilmiş sayılır. Öğrenilen kelimeler de aralıklarla
          tekrar sorulur.
        </Txt>
      </ScrollView>

      <TabBar active="profile" />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  treeCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hero: { marginTop: 16, padding: 22, borderRadius: radius.xxl, backgroundColor: colors.accent },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4, marginBottom: 16 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
}));

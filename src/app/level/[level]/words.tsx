import { router } from 'expo-router';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { IconButton, Screen, Switch } from '@/components/ui';
import { LEVELS } from '@/data/types';
import { getWordsByLevel } from '@/data/words';
import { useLevelParam } from '@/lib/useLevelParam';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

/** 6 · Kelime listesi (aktif / pasif) */
export default function WordListScreen() {
  const styles = useStyles();
  const colors = useColors();
  const level = useLevelParam();
  const { passive, togglePassive } = useAppStore();
  const words = getWordsByLevel(level);
  const passiveCount = words.filter((w) => passive[w.id]).length;

  return (
    <Screen>
      <IconButton icon="back" label="Geri" />

      <Txt variant="display" size={36} style={{ marginTop: 12, lineHeight: 40 }}>
        {level} kelimeleri
      </Txt>

      {/* Seviye değiştirici (Ayarlar > Pasif kelimeler'den gelindiğinde de işe yarar) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
        {LEVELS.map((l) => {
          const on = l === level;
          return (
            <Pressable
              key={l}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => !on && router.setParams({ level: l })}
              style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
            >
              <Txt variant="bold" size={14} color={on ? colors.onAccent : colors.text}>
                {l}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Txt variant="bold" size={16} color={colors.accent} style={{ marginTop: 10 }}>
        {words.length - passiveCount} aktif · {passiveCount} pasif
      </Txt>
      <Txt size={15} color={colors.textMuted} style={{ marginTop: 2 }}>
        Kapattığın kelimeler çalışmada çıkmaz.
      </Txt>

      <View style={styles.list}>
        <FlatList
          data={words}
          keyExtractor={(w) => w.id}
          ListEmptyComponent={
            <Txt size={15} color={colors.textMuted} style={{ padding: 20 }}>
              Bu seviyede henüz kelime yok.
            </Txt>
          }
          renderItem={({ item }) => {
            const off = !!passive[item.id];
            return (
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt
                    variant={off ? 'medium' : 'bold'}
                    size={18}
                    color={off ? colors.textDisabled : colors.text}
                    style={off && { textDecorationLine: 'line-through' }}
                  >
                    {item.en}
                  </Txt>
                  <Txt size={15} color={off ? colors.textDisabled : colors.textMuted}>
                    {item.trAccepted.join(', ')}
                  </Txt>
                  {!!item.note && (
                    <Txt size={13} color={colors.textDisabled}>
                      {item.note}
                    </Txt>
                  )}
                </View>
                <Switch value={!off} onChange={() => togglePassive(item.id)} label={`${item.en} kelimesini öner`} />
              </View>
            );
          }}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  chips: { flexGrow: 0, marginTop: 16 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  list: {
    flex: 1,
    marginTop: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    paddingLeft: 20,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

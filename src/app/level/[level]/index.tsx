import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { IconButton, LinkButton, PrimaryButton, Screen } from '@/components/ui';
import { deckLabel, isLevel, type StudyMode } from '@/data/types';
import { MATCH_BOARD_SIZE } from '@/lib/session';
import { MODE_ROUTES, useDeckParam } from '@/lib/useLevelParam';
import { useAppStore } from '@/store/AppStore';
import { ROUND_OPTIONS } from '@/store/settings';
import { makeStyles, radius, useColors } from '@/theme';

const MODES: { id: StudyMode; title: string; desc: string }[] = [
  { id: 'choice', title: 'Çoktan seçmeli', desc: 'Kelime gelir, 4 karşılıktan birini seç' },
  { id: 'match', title: 'Eşleştirme', desc: `${MATCH_BOARD_SIZE} İngilizce kelimeyi Türkçe karşılığıyla eşleştir` },
  { id: 'speak', title: 'Sesli', desc: 'Türkçe kelime çıkar, İngilizcesini sesli söyle' },
];

/** 2 · Çalışma ayarı */
export default function SetupScreen() {
  const styles = useStyles();
  const colors = useColors();
  const deck = useDeckParam();
  const { settings, deckWords, setLastLevel } = useAppStore();
  const [mode, setMode] = useState<StudyMode>('choice');
  const [rounds, setRounds] = useState<number>(settings.defaultRounds);

  const available = deckWords(deck).length;
  const isLevelDeck = isLevel(deck);
  const minNeeded = mode === 'match' ? 2 : 1;
  const canStart = available >= minNeeded;

  const start = () => {
    if (isLevel(deck)) setLastLevel(deck);
    router.push({ pathname: MODE_ROUTES[mode], params: { level: deck, rounds: String(rounds) } });
  };

  return (
    <Screen>
      <IconButton icon="back" label="Geri" />

      <View style={{ marginTop: 12, alignItems: 'flex-start', gap: 12 }}>
        <View style={styles.badge}>
          <Txt variant="bold" size={14} color={colors.onAccent}>
            {deckLabel(deck)}
          </Txt>
        </View>
        <Txt variant="display" size={36} style={{ lineHeight: 40 }}>
          Nasıl çalışalım?
        </Txt>
        {!isLevelDeck && (
          <Txt size={15} color={colors.textMuted}>
            {deck === 'review'
              ? 'Tüm seviyelerden tekrar zamanı gelen kelimeler. Doğru bildiğin kelime birkaç gün sonra yeniden gelir.'
              : 'Son cevabını yanlış verdiğin kelimeler. Doğru bildiğinde listeden çıkar.'}
          </Txt>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 28, gap: 10 }}>
          {MODES.map((m) => {
            const on = m.id === mode;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setMode(m.id)}
                style={[styles.mode, on ? styles.modeOn : styles.modeOff]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bold" size={18} color={on ? colors.onAccent : colors.text}>
                    {m.title}
                  </Txt>
                  <Txt size={14} color={on ? colors.onAccent : colors.textMuted}>
                    {m.desc}
                  </Txt>
                </View>
                {on ? (
                  <View style={styles.checkOn}>
                    <Icon name="check" size={16} color={colors.accent} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.checkOff} />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 28, gap: 12 }}>
          <Txt variant="caps" size={14}>
            Tur sayısı
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {ROUND_OPTIONS.map((n) => {
              const on = n === rounds;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setRounds(n)}
                  style={[styles.round, on ? styles.modeOn : styles.modeOff]}
                >
                  <Txt variant="bold" size={20} color={on ? colors.onAccent : colors.text}>
                    {n}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Txt size={14} color={colors.textMuted}>
            {mode === 'match'
              ? `Eşleştirmede her tur ${MATCH_BOARD_SIZE} kelimedir.`
              : `Bu destede ${available} kelime var.`}
          </Txt>
        </View>
      </ScrollView>

      <View style={{ gap: 4 }}>
        {!canStart && (
          <Txt size={14} color={colors.danger} style={{ textAlign: 'center', marginBottom: 8 }}>
            {isLevelDeck
              ? 'Bu seviyede çalışılacak aktif kelime yok.'
              : mode === 'match' && available === 1
                ? 'Eşleştirme için en az 2 kelime gerekiyor.'
                : 'Şu an burada çalışılacak kelime yok.'}
          </Txt>
        )}
        <PrimaryButton title="Başla" onPress={start} disabled={!canStart} />
        {isLevel(deck) && (
          <LinkButton
            title="Kelime listesini düzenle"
            onPress={() => router.push({ pathname: '/level/[level]/words', params: { level: deck } })}
          />
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  badge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.accent },
  mode: {
    minHeight: 80,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modeOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeOff: { backgroundColor: colors.surface, borderColor: colors.border },
  checkOn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.ring },
  round: { flex: 1, height: 56, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
}));

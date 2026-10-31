import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { LinkButton, PrimaryButton, Screen, Spacer, StudyHeader } from '@/components/ui';
import type { Word } from '@/data/types';
import { matchSpoken } from '@/lib/answer';
import { answerFeedback } from '@/lib/feedback';
import { isLevel } from '@/data/types';
import { pickStudyWords } from '@/lib/session';
import { speakEnglish } from '@/lib/speech';
import { useStudyParams } from '@/lib/useLevelParam';
import { useSpeechRecognizer } from '@/lib/useSpeechRecognizer';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, fonts, radius, useColors } from '@/theme';

/** 5 · Sesli — Türkçe kelime gösterilir, İngilizcesi söylenir */
export default function SpeakScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { deck, rounds } = useStudyParams();
  const { stats, deckWords, settings, recordAnswer } = useAppStore();
  const rec = useSpeechRecognizer(settings.accent);
  // Mikrofon ayarda kapalıysa ya da konuşma tanıma yoksa (ör. Expo Go) yazarak cevaplanır
  const voice = rec.available && settings.microphone;

  const [words] = useState<Word[]>(() => pickStudyWords(deckWords(deck), rounds, stats, isLevel(deck)));
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; matched: string | null; heard: string } | null>(null);
  const [typed, setTyped] = useState('');
  const [correctCount, setCorrectCount] = useState(0);

  const w = words[idx];

  const evaluate = (heard: string[]) => {
    if (!w || result) return;
    const matched = matchSpoken(heard, w.enAccepted);
    const ok = matched !== null;
    setResult({ ok, matched, heard: heard[0] ?? '' });
    if (ok) setCorrectCount((n) => n + 1);
    recordAnswer(w.id, ok);
    answerFeedback(ok, settings);
    if (settings.autoplay) speakEnglish(w.en, settings);
  };

  // Konuşma tanıma bitince değerlendir
  useEffect(() => {
    if (rec.status === 'done' && rec.heard.length > 0) evaluate(rec.heard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.status]);

  if (!w) {
    return (
      <Screen>
        <StudyHeader current={0} total={0} />
        <Txt style={{ marginTop: 40 }}>Bu destede çalışılacak kelime yok.</Txt>
      </Screen>
    );
  }

  const next = () => {
    rec.reset();
    if (idx + 1 >= words.length) {
      router.replace({
        pathname: '/study/result',
        params: { level: deck, rounds: String(rounds), mode: 'speak', correct: String(correctCount), total: String(words.length) },
      });
      return;
    }
    setIdx(idx + 1);
    setResult(null);
    setTyped('');
  };

  const listening = rec.status === 'listening';

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <StudyHeader current={idx + 1} total={words.length} />

      <View style={styles.prompt}>
        <Txt variant="caps" size={14}>
          Türkçe
        </Txt>
        <Txt variant="display" size={w.tr.length > 10 ? 48 : 80} style={{ textAlign: 'center', lineHeight: w.tr.length > 10 ? 54 : 88 }}>
          {w.tr.charAt(0).toLocaleUpperCase('tr') + w.tr.slice(1)}
        </Txt>
        <Txt size={18} color={colors.textMuted} style={{ marginTop: 4 }}>
          İngilizcesini {voice ? 'söyle' : 'yaz'}
        </Txt>
      </View>

      {voice ? (
        <View style={{ marginTop: 44, alignItems: 'center' }}>
          <View style={[styles.micRing, listening && { borderColor: colors.accent }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Dinlemeyi bitir' : 'Konuşmak için dokun'}
              disabled={!!result}
              onPress={listening ? rec.stop : rec.start}
              style={[styles.mic, !!result && { opacity: 0.4 }]}
            >
              <Icon name="mic" size={48} color={colors.onAccent} />
            </Pressable>
          </View>
          <Txt size={15} color={colors.textMuted} style={{ marginTop: 12 }}>
            {listening ? 'Dinleniyor…' : rec.error ? rec.error : result ? '' : 'Dokun ve söyle'}
          </Txt>
        </View>
      ) : (
        <View style={{ marginTop: 40, gap: 12 }}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={!result}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="İngilizce karşılık"
            placeholderTextColor={colors.textDisabled}
            keyboardAppearance={settings.theme}
            onSubmitEditing={() => typed.trim() && evaluate([typed])}
            returnKeyType="done"
            style={styles.input}
          />
          {!result && <PrimaryButton title="Kontrol et" onPress={() => evaluate([typed])} disabled={!typed.trim()} />}
          {!rec.available && (
            <Txt size={13} color={colors.textDisabled} style={{ textAlign: 'center' }}>
              Konuşma tanıma bu ortamda yok (Expo Go). APK olarak kurulduğunda mikrofonla çalışır.
            </Txt>
          )}
        </View>
      )}

      {result && (
        <View style={{ marginTop: 28, alignItems: 'center', gap: 12 }}>
          <Txt variant="caps" size={14}>
            Kabul edilen cevaplar
          </Txt>
          <View style={styles.answers}>
            {w.enAccepted.map((a) => {
              const hit = a === result.matched;
              return (
                <View key={a} style={[styles.answer, hit ? styles.answerHit : styles.answerOther]}>
                  {hit && <Icon name="check" size={18} color={colors.onAccent} strokeWidth={3} />}
                  <Txt variant={hit ? 'bold' : 'medium'} size={18} color={hit ? colors.onAccent : colors.text}>
                    {a}
                  </Txt>
                </View>
              );
            })}
          </View>
          <Txt size={15} color={result.ok ? colors.textMuted : colors.danger}>
            {result.ok ? `Duyulan: ${result.heard}` : `Yanlış${result.heard ? ` — duyulan: ${result.heard}` : ''}`}
          </Txt>
        </View>
      )}

      <Spacer />

      <View style={{ gap: 4 }}>
        {result && <PrimaryButton title={idx + 1 >= words.length ? 'Bitir' : 'Devam'} onPress={next} />}
        {!result && <LinkButton title="Atla" onPress={next} />}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  prompt: { marginTop: 56, alignItems: 'center', gap: 4 },
  micRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    borderColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 60,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 20,
  },
  answers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  answer: { height: 44, paddingHorizontal: 18, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerHit: { backgroundColor: colors.accent },
  answerOther: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
}));

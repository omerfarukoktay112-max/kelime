import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { PrimaryButton, Screen, Spacer, StudyHeader } from '@/components/ui';
import { answerFeedback } from '@/lib/feedback';
import { isLevel } from '@/data/types';
import { buildChoiceQuestion, pickStudyWords, type ChoiceQuestion } from '@/lib/session';
import { speakEnglish, stopSpeaking } from '@/lib/speech';
import { useStudyParams } from '@/lib/useLevelParam';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

/** 3 · Çoktan seçmeli */
export default function QuizScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { deck, rounds } = useStudyParams();
  const { stats, deckWords, settings, recordAnswer } = useAppStore();

  // Sorular ekran açılınca bir kez üretilir
  const [questions] = useState<ChoiceQuestion[]>(() =>
    pickStudyWords(deckWords(deck), rounds, stats, isLevel(deck)).map((w) => buildChoiceQuestion(w, settings.direction)),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[idx];
  const englishShown = settings.direction === 'en-tr';

  useEffect(() => {
    if (q && englishShown && settings.autoplay) speakEnglish(q.word.en, settings);
    return stopSpeaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!q) {
    return (
      <Screen>
        <StudyHeader current={0} total={0} />
        <Txt style={{ marginTop: 40 }}>Bu destede çalışılacak kelime yok.</Txt>
      </Screen>
    );
  }

  const pick = (i: number) => {
    if (picked !== null) return;
    const ok = i === q.correctIndex;
    setPicked(i);
    if (ok) setCorrectCount((n) => n + 1);
    recordAnswer(q.word.id, ok);
    answerFeedback(ok, settings);
    if (!englishShown && settings.autoplay) speakEnglish(q.word.en, settings);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      router.replace({
        pathname: '/study/result',
        params: { level: deck, rounds: String(rounds), mode: 'choice', correct: String(correctCount), total: String(questions.length) },
      });
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <StudyHeader current={idx + 1} total={questions.length} />

      <View style={styles.promptBox}>
        <Txt variant="caps" size={14}>
          {englishShown ? 'İngilizce' : 'Türkçe'}
        </Txt>
        <View style={styles.promptRow}>
          <Txt variant="display" size={q.prompt.length > 10 ? 44 : 64} style={{ textAlign: 'center', flexShrink: 1 }}>
            {q.prompt}
          </Txt>
          {englishShown && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kelimeyi sesli dinle"
              onPress={() => speakEnglish(q.word.en, settings)}
              style={styles.speaker}
            >
              <Icon name="speaker" color={colors.accent} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={{ marginTop: 40, gap: 12 }}>
        {q.options.map((label, i) => {
          const answered = picked !== null;
          const isCorrect = answered && i === q.correctIndex;
          const isWrong = answered && i === picked && i !== q.correctIndex;
          return (
            <Pressable
              key={`${idx}-${i}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered }}
              onPress={() => pick(i)}
              style={[styles.option, isCorrect ? styles.optCorrect : isWrong ? styles.optWrong : styles.optDefault]}
            >
              <Txt
                variant={isCorrect ? 'bold' : 'medium'}
                size={20}
                numberOfLines={2}
                adjustsFontSizeToFit
                color={isCorrect ? colors.onAccent : colors.text}
                style={[{ flex: 1 }, isWrong && { textDecorationLine: 'line-through' }]}
              >
                {label}
              </Txt>
              {isCorrect && <Icon name="check" color={colors.onAccent} strokeWidth={3} />}
              {isWrong && <Icon name="close" color={colors.text} strokeWidth={3} />}
            </Pressable>
          );
        })}
      </View>

      <Spacer />

      {picked !== null ? (
        <PrimaryButton title={idx + 1 >= questions.length ? 'Bitir' : 'Devam'} onPress={next} />
      ) : (
        <View style={{ height: 60, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} color={colors.textMuted}>
            Doğru karşılığı seç
          </Txt>
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  promptBox: { marginTop: 44, alignItems: 'center', gap: 4 },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speaker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.ring,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    height: 68,
    paddingHorizontal: 22,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optDefault: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  optCorrect: { borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.accent },
  optWrong: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.text, backgroundColor: colors.bg },
}));

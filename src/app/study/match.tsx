import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Screen, Spacer, StudyHeader } from '@/components/ui';
import { isLevel, type Word } from '@/data/types';
import { answerFeedback } from '@/lib/feedback';
import { buildMatchBoards, MATCH_BOARD_SIZE, shuffle } from '@/lib/session';
import { speakEnglish } from '@/lib/speech';
import { useStudyParams } from '@/lib/useLevelParam';
import { useAppStore } from '@/store/AppStore';
import { makeStyles, radius, useColors } from '@/theme';

type Side = 'en' | 'tr';

/** 4 · Eşleştirme — her tur en fazla 8 kelime */
export default function MatchScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { deck, rounds } = useStudyParams();
  const { stats, deckWords, settings, recordAnswer } = useAppStore();

  const [boards] = useState<Word[][]>(() => {
    const pool = deckWords(deck);
    // Tekrar / hatalar destesinde aynı kelimeler tekrar tekrar gelmesin
    const n = isLevel(deck) ? rounds : Math.min(rounds, Math.ceil(pool.length / MATCH_BOARD_SIZE));
    return buildMatchBoards(pool, n, stats);
  });
  const [boardIdx, setBoardIdx] = useState(0);
  const [selected, setSelected] = useState<{ side: Side; id: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ en: string; tr: string } | null>(null);
  /** Bu turda en az bir kez yanlış eşleştirilen kelimeler (ilk denemede doğru sayılmaz) */
  const missed = useRef<Set<string>>(new Set());
  const firstTryCorrect = useRef(0);
  const totalWords = useRef(0);

  const board = boards[boardIdx] ?? [];
  const left = useMemo(() => shuffle(board), [board]);
  const right = useMemo(() => shuffle(board), [board]);

  useEffect(() => {
    if (!wrongPair) return;
    const t = setTimeout(() => setWrongPair(null), 600);
    return () => clearTimeout(t);
  }, [wrongPair]);

  if (boards.length === 0) {
    return (
      <Screen>
        <StudyHeader current={0} total={0} />
        <Txt style={{ marginTop: 40 }}>Eşleştirme için en az 2 aktif kelime gerekiyor.</Txt>
      </Screen>
    );
  }

  const finishBoard = (nextMatched: Set<string>) => {
    if (nextMatched.size < board.length) return;
    totalWords.current += board.length;
    setTimeout(() => {
      if (boardIdx + 1 >= boards.length) {
        router.replace({
          pathname: '/study/result',
          params: {
            level: deck,
            rounds: String(rounds),
            mode: 'match',
            correct: String(firstTryCorrect.current),
            total: String(totalWords.current),
          },
        });
        return;
      }
      setBoardIdx((i) => i + 1);
      setMatched(new Set());
      setSelected(null);
      missed.current = new Set();
    }, 400);
  };

  const tap = (side: Side, id: string) => {
    if (matched.has(id) || wrongPair) return;
    if (side === 'en' && settings.autoplay) {
      const w = board.find((x) => x.id === id);
      if (w) speakEnglish(w.en, settings);
    }
    if (!selected || selected.side === side) {
      setSelected(selected?.id === id && selected.side === side ? null : { side, id });
      return;
    }
    const enId = side === 'en' ? id : selected.id;
    const trId = side === 'tr' ? id : selected.id;
    setSelected(null);

    if (enId === trId) {
      const firstTry = !missed.current.has(enId);
      if (firstTry) firstTryCorrect.current += 1;
      recordAnswer(enId, firstTry);
      answerFeedback(true, settings);
      const next = new Set(matched).add(enId);
      setMatched(next);
      finishBoard(next);
    } else {
      missed.current.add(enId);
      answerFeedback(false, settings);
      setWrongPair({ en: enId, tr: trId });
    }
  };

  const renderCell = (side: Side, w: Word) => {
    const isMatched = matched.has(w.id);
    const isSelected = selected?.side === side && selected.id === w.id;
    const isWrong = wrongPair?.[side] === w.id;
    const label = side === 'en' ? w.en : w.tr;
    return (
      <Pressable
        key={`${side}-${w.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isMatched }}
        onPress={() => tap(side, w.id)}
        style={[
          styles.cell,
          isMatched ? styles.cellMatched : isSelected ? styles.cellSelected : isWrong ? styles.cellWrong : styles.cellDefault,
        ]}
      >
        <Txt
          variant={isSelected ? 'bold' : 'medium'}
          size={17}
          numberOfLines={1}
          adjustsFontSizeToFit
          color={isMatched ? colors.textDisabled : isSelected ? colors.onAccent : colors.text}
          style={{ flex: 1 }}
        >
          {label}
        </Txt>
        {isMatched && <Icon name="check" size={18} color={colors.accent} strokeWidth={3} />}
      </Pressable>
    );
  };

  return (
    <Screen style={{ paddingBottom: 24 }}>
      <StudyHeader current={boardIdx + 1} total={boards.length} />
      <Txt variant="display" size={32} style={{ marginTop: 24 }}>
        Eşleştir
      </Txt>

      <View style={styles.columns}>
        <View style={styles.col}>{left.map((w) => renderCell('en', w))}</View>
        <View style={styles.col}>{right.map((w) => renderCell('tr', w))}</View>
      </View>

      <Spacer />
      <Txt variant="medium" size={15} color={colors.textMuted} style={{ textAlign: 'center' }}>
        {matched.size} / {board.length} eşleşti
      </Txt>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  columns: { marginTop: 24, flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 8 },
  cell: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cellDefault: { borderColor: colors.border, backgroundColor: colors.surface },
  cellSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  cellMatched: { borderColor: colors.border, backgroundColor: colors.bg },
  cellWrong: { borderColor: colors.danger, borderStyle: 'dashed', backgroundColor: colors.bg },
}));

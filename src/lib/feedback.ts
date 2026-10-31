import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import type { Settings } from '@/store/settings';

const SOURCES = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
};

let players: Record<keyof typeof SOURCES, AudioPlayer> | null = null;

/** Oynatıcılar ilk kullanımda bir kez oluşturulur. */
function getPlayers() {
  if (!players) {
    // Ses efektleri diğer sesleri (müzik, seslendirme) kesmesin; sessiz modda çalmasın
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    players = { correct: createAudioPlayer(SOURCES.correct), wrong: createAudioPlayer(SOURCES.wrong) };
  }
  return players;
}

function playSound(kind: keyof typeof SOURCES) {
  try {
    const p = getPlayers()[kind];
    p.seekTo(0).catch(() => {});
    p.play();
  } catch (e) {
    if (__DEV__) console.warn('[sfx] çalınamadı', e);
  }
}

/** Doğru / yanlış cevapta ses efekti ve titreşim (ayarlara göre). */
export function answerFeedback(correct: boolean, settings: Pick<Settings, 'haptics' | 'sfx'>) {
  if (settings.sfx) playSound(correct ? 'correct' : 'wrong');
  if (settings.haptics) {
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  }
}

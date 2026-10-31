import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { SPEECH_RATE_VALUE, type Settings } from '@/store/settings';

type Accent = Settings['accent'];

/**
 * Harf harf ya da yanlış okunan kelimeler için seslendirme metni.
 * Ekranda kelimenin kendisi gösterilir, sadece okunuşu değişir.
 */
const PRONUNCIATION: Record<string, string> = {
  'a.m.': 'A M',
  'p.m.': 'P M',
  'etc.': 'et cetera',
  'e.g.': 'for example',
  'i.e.': 'that is',
  'approx.': 'approximately',
};

/** Seçilen ses aksan başına bir kez bulunur ve saklanır (null = uygun ses yok, varsayılanı kullan). */
const voiceCache = new Map<Accent, string | null>();
/** Hata veren sesler (ör. Android'de indirilmemiş ses) bir daha denenmez. */
const brokenVoices = new Set<string>();

const normalizeLang = (lang: string) => lang.replace('_', '-').toLowerCase();

/** Cihazdaki o aksana ait en kaliteli, internet gerektirmeyen sesi seçer. */
async function pickVoice(accent: Accent): Promise<string | null> {
  if (voiceCache.has(accent)) return voiceCache.get(accent) ?? null;

  let chosen: string | null = null;
  try {
    const target = accent.toLowerCase();
    const voices = (await Speech.getAvailableVoicesAsync()).filter(
      (v) =>
        normalizeLang(v.language) === target &&
        !brokenVoices.has(v.identifier) &&
        // Android'de "network" sesler internet ister ve gecikmeli başlar.
        !(Platform.OS === 'android' && /network/i.test(v.identifier)),
    );
    const score = (v: Speech.Voice) =>
      (v.quality === Speech.VoiceQuality.Enhanced ? 2 : 0) +
      // iOS'taki Eloquence/novelty sesleri robotik; kullanılmasın.
      (/eloquence|compact/i.test(v.identifier) ? -3 : 0);
    voices.sort((a, b) => score(b) - score(a));
    chosen = voices[0]?.identifier ?? null;
  } catch {
    chosen = null;
  }
  voiceCache.set(accent, chosen);
  return chosen;
}

let requestId = 0;

/** İngilizce kelimeyi ayarlardaki aksan ve hızla seslendirir. */
export async function speakEnglish(text: string, settings: Pick<Settings, 'accent' | 'speechRate'>) {
  const id = ++requestId;
  const voice = await pickVoice(settings.accent);
  if (id !== requestId) return; // bu arada başka bir kelime istendi

  // Konuşma yokken stop() çağırmak bazı Android cihazlarda ilk heceyi kesiyor.
  if (await Speech.isSpeakingAsync()) Speech.stop();

  const spoken = PRONUNCIATION[text.toLowerCase()] ?? text;
  Speech.speak(spoken, {
    language: settings.accent,
    voice: voice ?? undefined,
    rate: SPEECH_RATE_VALUE[settings.speechRate],
    onError: () => {
      if (!voice) return;
      // Seçilen ses çalışmadı: işaretle, varsayılan sesle tekrar dene.
      brokenVoices.add(voice);
      voiceCache.delete(settings.accent);
      Speech.speak(spoken, { language: settings.accent, rate: SPEECH_RATE_VALUE[settings.speechRate] });
    },
  });
}

export function stopSpeaking() {
  requestId++;
  Speech.stop();
}

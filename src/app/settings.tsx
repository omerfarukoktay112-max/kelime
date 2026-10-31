import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';
import { Txt } from '@/components/Txt';
import { Screen, Switch } from '@/components/ui';
import { pickBackup, shareBackup } from '@/lib/backup';
import { useAppStore } from '@/store/AppStore';
import { formatSetting, SETTING_OPTIONS, type Settings } from '@/store/settings';
import { makeStyles, radius, useColors } from '@/theme';

type CycleKey = keyof typeof SETTING_OPTIONS;
type ToggleKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

type Row =
  | { kind: 'cycle'; key: CycleKey; label: string }
  | { kind: 'toggle'; key: ToggleKey; label: string }
  | { kind: 'action'; label: string; value?: string; onPress: () => void }
  | { kind: 'info'; label: string; value: string }
  | { kind: 'danger'; label: string; onPress: () => void };

const WORD_SOURCE_URL = 'https://github.com/tema4p/english-vocabulary';

/** 8 · Ayarlar */
export default function SettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { settings, updateSettings, resetProgress, lastLevel, exportBackup, importBackup } = useAppStore();

  const backup = () =>
    shareBackup(exportBackup()).catch((e: Error) => Alert.alert('Yedeklenemedi', e.message));

  const restore = async () => {
    try {
      const json = await pickBackup();
      if (json === null) return;
      Alert.alert('Yedeği geri yükle', 'Şu anki ilerlemen, pasif kelimelerin ve ayarların yedektekilerle değişecek.', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri yükle',
          style: 'destructive',
          onPress: () => {
            try {
              importBackup(json);
              Alert.alert('Tamam', 'Yedek geri yüklendi.');
            } catch (e) {
              Alert.alert('Geri yüklenemedi', (e as Error).message);
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Dosya açılamadı', (e as Error).message);
    }
  };

  const cycle = (key: CycleKey) => {
    const options = SETTING_OPTIONS[key] as readonly Settings[CycleKey][];
    const i = options.indexOf(settings[key]);
    updateSettings({ [key]: options[(i + 1) % options.length] } as Partial<Settings>);
  };

  const confirmReset = () =>
    Alert.alert('İlerlemeyi sıfırla', 'Tüm seviyelerdeki öğrenme ilerlemen ve ağacın sıfırlanacak. Pasif kelimeler ve ayarlar korunur. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: resetProgress },
    ]);

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Çalışma',
      rows: [
        { kind: 'cycle', key: 'dailyGoal', label: 'Günlük hedef' },
        { kind: 'cycle', key: 'defaultRounds', label: 'Varsayılan tur sayısı' },
        { kind: 'cycle', key: 'direction', label: 'Soru yönü' },
        { kind: 'toggle', key: 'autoplay', label: 'Kelimeyi otomatik seslendir' },
      ],
    },
    {
      title: 'Ses',
      rows: [
        { kind: 'cycle', key: 'accent', label: 'Aksan' },
        { kind: 'cycle', key: 'speechRate', label: 'Konuşma hızı' },
        { kind: 'toggle', key: 'microphone', label: 'Mikrofon erişimi' },
        { kind: 'toggle', key: 'sfx', label: 'Ses efektleri' },
        { kind: 'toggle', key: 'haptics', label: 'Titreşim' },
      ],
    },
    {
      title: 'Görünüm',
      rows: [
        { kind: 'cycle', key: 'theme', label: 'Tema' },
        { kind: 'cycle', key: 'fontSize', label: 'Yazı boyutu' },
      ],
    },
    {
      title: 'Veri',
      rows: [
        {
          kind: 'action',
          label: 'Pasif kelimeler',
          value: lastLevel,
          onPress: () => router.push({ pathname: '/level/[level]/words', params: { level: lastLevel } }),
        },
        { kind: 'action', label: 'Yedekle (dosyaya kaydet)', onPress: backup },
        { kind: 'action', label: 'Yedekten geri yükle', onPress: restore },
        { kind: 'danger', label: 'İlerlemeyi sıfırla', onPress: confirmReset },
      ],
    },
    {
      title: 'Hakkında',
      rows: [
        {
          kind: 'action',
          label: 'Kelime kaynağı',
          value: 'CC BY-NC 4.0',
          onPress: () => Linking.openURL(WORD_SOURCE_URL).catch(() => {}),
        },
        { kind: 'info', label: 'Sürüm', value: Constants.expoConfig?.version ?? '1.0.0' },
      ],
    },
  ];

  return (
    <Screen>
      <Txt variant="display" size={44} style={{ marginTop: 8, lineHeight: 48 }}>
        Ayarlar
      </Txt>

      <ScrollView
        style={{ flex: 1, marginTop: 20, marginBottom: 12 }}
        contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((sec) => (
          <View key={sec.title} style={{ gap: 8 }}>
            <Txt variant="caps" size={14}>
              {sec.title}
            </Txt>
            <View style={styles.group}>
              {sec.rows.map((r) => {
                if (r.kind === 'toggle') {
                  return (
                    <View key={r.label} style={[styles.row, { paddingRight: 8 }]}>
                      <Txt variant="medium" size={17} style={{ flex: 1 }}>
                        {r.label}
                      </Txt>
                      <Switch
                        label={r.label}
                        value={settings[r.key]}
                        onChange={() => updateSettings({ [r.key]: !settings[r.key] } as Partial<Settings>)}
                      />
                    </View>
                  );
                }
                if (r.kind === 'info') {
                  return (
                    <View key={r.label} style={styles.row}>
                      <Txt variant="medium" size={17} style={{ flex: 1 }}>
                        {r.label}
                      </Txt>
                      <Txt size={16} color={colors.textMuted}>
                        {r.value}
                      </Txt>
                    </View>
                  );
                }
                if (r.kind === 'danger') {
                  return (
                    <Pressable key={r.label} accessibilityRole="button" onPress={r.onPress} style={styles.row}>
                      <Txt variant="bold" size={17} color={colors.danger}>
                        {r.label}
                      </Txt>
                    </Pressable>
                  );
                }
                const value =
                  r.kind === 'cycle' ? formatSetting(r.key, settings[r.key] as never) : (r.value ?? '');
                return (
                  <Pressable
                    key={r.label}
                    accessibilityRole="button"
                    accessibilityHint={r.kind === 'cycle' ? 'Dokununca sonraki seçeneğe geçer' : undefined}
                    onPress={r.kind === 'cycle' ? () => cycle(r.key) : r.onPress}
                    style={styles.row}
                  >
                    <Txt variant="medium" size={17} style={{ flex: 1 }}>
                      {r.label}
                    </Txt>
                    <View style={styles.value}>
                      {!!value && (
                        <Txt size={16} color={colors.textMuted}>
                          {value}
                        </Txt>
                      )}
                      <Icon name="chevron" size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <TabBar active="settings" />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  group: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.divider,
    gap: 1,
  },
  row: {
    minHeight: 60,
    paddingLeft: 18,
    paddingRight: 18,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6 },
}));

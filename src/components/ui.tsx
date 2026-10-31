import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, radius, SCREEN_PADDING, useColors } from '@/theme';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** Tüm ekranların kapsayıcısı: tema arka planı + güvenli alan + kenar boşluğu. */
export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.screen, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: 'back' | 'close';
  label: string;
  onPress?: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={styles.iconBtn}
    >
      <Icon name={icon} size={icon === 'back' ? 26 : 24} color={colors.text} />
    </Pressable>
  );
}

export function ProgressBar({
  value,
  height = 8,
  track,
  fill,
}: {
  /** 0..1 */
  value: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  const colors = useColors();
  track ??= colors.border;
  fill ??= colors.accent;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      {pct > 0 && (
        <View style={{ width: `${pct * 100}%`, minWidth: height, height, borderRadius: height / 2, backgroundColor: fill }} />
      )}
    </View>
  );
}

/** Çalışma ekranlarının üst çubuğu: kapat + ilerleme + sayaç. */
export function StudyHeader({ current, total, onClose }: { current: number; total: number; onClose?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.studyHeader}>
      <IconButton icon="close" label="Kapat" onPress={onClose} />
      <View style={{ flex: 1 }}>
        <ProgressBar value={total ? current / total : 0} />
      </View>
      <Txt variant="bold" size={15} style={{ minWidth: 48, textAlign: 'right' }}>
        {current} / {total}
      </Txt>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.85 }]}
    >
      <Txt variant="bold" size={20} color={colors.onAccent}>
        {title}
      </Txt>
    </Pressable>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Txt variant="medium" size={16} color={colors.textMuted} style={{ textDecorationLine: 'underline' }}>
        {title}
      </Txt>
    </Pressable>
  );
}

/** Tasarımdaki aç/kapa düğmesi. */
export function Switch({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onChange}
      style={styles.switchHit}
    >
      <View style={[styles.switchTrack, value ? styles.switchOn : styles.switchOff]}>
        <View
          style={
            value
              ? { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.onAccent }
              : { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textMuted }
          }
        />
      </View>
    </Pressable>
  );
}

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: 16, paddingBottom: 16 },
  iconBtn: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  studyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primary: {
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { height: 44, alignItems: 'center', justifyContent: 'center' },
  switchHit: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  switchTrack: { width: 52, height: 30, padding: 3, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  switchOn: { backgroundColor: colors.accent, justifyContent: 'flex-end' },
  switchOff: { backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.ring, justifyContent: 'flex-start' },
}));

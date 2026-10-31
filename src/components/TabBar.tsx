import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { makeStyles, useColors } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

const TABS: { key: string; label: string; icon: IconName; href: Href }[] = [
  { key: 'levels', label: 'Seviyeler', icon: 'levels', href: '/' },
  { key: 'profile', label: 'Profil', icon: 'profile', href: '/profile' },
  { key: 'settings', label: 'Ayarlar', icon: 'settings', href: '/settings' },
];

export type TabKey = 'levels' | 'profile' | 'settings';

/** Tasarımdaki yuvarlak alt gezinme çubuğu. Ana 3 ekranın altında yer alır. */
export function TabBar({ active }: { active: TabKey }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => !on && router.replace(t.href)}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Icon name={t.icon} size={22} color={on ? colors.onAccent : colors.textMuted} />
            <Txt variant={on ? 'bold' : 'medium'} size={13} color={on ? colors.onAccent : colors.textMuted}>
              {t.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  bar: {
    height: 64,
    padding: 6,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabOn: { backgroundColor: colors.accent },
}));

import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStoreProvider, useAppStore } from '@/store/AppStore';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { ready, settings } = useAppStore();
  const colors = useColors();
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Uyarı pencereleri ve klavye de uygulamanın temasını izlesin
  useEffect(() => {
    try {
      Appearance.setColorScheme(settings.theme);
    } catch {}
  }, [settings.theme]);

  if (!loaded) return null;

  return (
    <>
    <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      {/* Alt menüdeki 3 ana ekran arasında geçiş animasyonsuz */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="profile" options={{ animation: 'none' }} />
      <Stack.Screen name="settings" options={{ animation: 'none' }} />
      {/* Çalışma ekranları geri kaydırma ile kapanmasın (yanlışlıkla çıkmayı önler) */}
      <Stack.Screen name="study/quiz" options={{ gestureEnabled: false }} />
      <Stack.Screen name="study/match" options={{ gestureEnabled: false }} />
      <Stack.Screen name="study/speak" options={{ gestureEnabled: false }} />
      <Stack.Screen name="study/result" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <RootStack />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}

import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStoreProvider, useAppStore } from '@/store/AppStore';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Yükleme ne kadar uzarsa uzasın açılış ekranı en geç bu süre sonra kapanır. */
const STARTUP_TIMEOUT_MS = 5000;

function RootStack() {
  const { ready, settings } = useAppStore();
  const colors = useColors();
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  // Bir şey takılırsa uygulama logoda kalmasın; zaman aşımında yine de açılır.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), STARTUP_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (fontError) console.warn('[fonts] yüklenemedi, sistem fontu kullanılacak', fontError);
  }, [fontError]);
  // Font hatası uygulamayı engellemesin: sistem fontuyla devam edilir.
  const loaded = (ready && (fontsLoaded || !!fontError)) || timedOut;

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

/** Açılışta bir hata olursa logoda takılı kalmak yerine hatayı ekranda göster. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#2d1b69', padding: 24, paddingTop: 64 }}>
      <Text style={{ color: '#F6F3FF', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
        Bir hata oluştu
      </Text>
      <ScrollView style={{ flex: 1 }}>
        <Text selectable style={{ color: '#CFC6F0', fontSize: 13 }}>
          {String(error?.stack ?? error?.message ?? error)}
        </Text>
      </ScrollView>
      <Pressable
        onPress={retry}
        style={{ backgroundColor: '#c8ff3d', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#2d1b69', fontWeight: '700' }}>Tekrar dene</Text>
      </Pressable>
    </View>
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

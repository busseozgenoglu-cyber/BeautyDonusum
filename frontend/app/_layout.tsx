import { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { initPurchases } from '../src/utils/purchases';
import { COLORS } from '../src/utils/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    initPurchases();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <LanguageProvider>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.bg.primary }} onLayout={onLayoutRootView}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg.primary }, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="analysis/camera" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="analysis/loading" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="analysis/results" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </View>
      </AuthProvider>
    </LanguageProvider>
  );
}

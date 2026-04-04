import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { initPurchases } from '../src/utils/purchases';

export default function RootLayout() {
  useEffect(() => {
    initPurchases();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' }, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="analysis/camera" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="analysis/loading" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="analysis/results" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS, FONT } from '../src/utils/theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence } from 'react-native-reanimated';

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(withTiming(1.05, { duration: 600 }), withTiming(1, { duration: 400 }));
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#141414', '#0A0A0A']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowCircle} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoIcon}>
          <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.logoGradient}>
            <Text style={styles.logoLetter}>F</Text>
          </LinearGradient>
        </View>
        <Text style={styles.logoText}>{t('appName')}</Text>
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>
      <ActivityIndicator color={COLORS.brand.primary} style={styles.loader} size="small" />
      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center' },
  glowCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(229,192,123,0.06)' },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoIcon: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 40, fontWeight: '700', color: '#000' },
  logoText: { ...FONT.h1, color: COLORS.text.primary, letterSpacing: 2 },
  tagline: { ...FONT.body, color: COLORS.text.secondary, marginTop: 8 },
  loader: { position: 'absolute', bottom: 120 },
  disclaimer: { position: 'absolute', bottom: 40, paddingHorizontal: 40, ...FONT.xs, color: COLORS.text.tertiary, textAlign: 'center' },
});

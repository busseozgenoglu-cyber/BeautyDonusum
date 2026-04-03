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
      <LinearGradient colors={['#0A0A14', '#12091E', '#0D1422']} style={StyleSheet.absoluteFill} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />
      {/* Vibrant glow effects */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoWrapper}>
          <LinearGradient colors={['#FF6EC7', '#B06EFF', '#6EAEFF']} style={styles.logoBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.logoInner}>
              <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.logoGradient}>
                <Text style={styles.logoLetter}>F</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.logoText}>{t('appName')}</Text>
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>
      <ActivityIndicator color="#B06EFF" style={styles.loader} size="small" />
      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14', alignItems: 'center', justifyContent: 'center' },
  glowTopRight: { position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(176,110,255,0.18)' },
  glowBottomLeft: { position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(110,174,255,0.14)' },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoWrapper: { marginBottom: 20 },
  logoBorder: { width: 90, height: 90, borderRadius: 28, padding: 3, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 42, fontWeight: '700', color: '#000' },
  logoText: { ...FONT.h1, color: COLORS.text.primary, letterSpacing: 2 },
  tagline: { ...FONT.body, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  loader: { position: 'absolute', bottom: 120 },
  disclaimer: { position: 'absolute', bottom: 40, paddingHorizontal: 40, ...FONT.xs, color: COLORS.text.tertiary, textAlign: 'center' },
});

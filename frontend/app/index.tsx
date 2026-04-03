import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS, FONT, SHADOWS } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSequence, withRepeat, withSpring, interpolate, Extrapolation,
} from 'react-native-reanimated';

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(16);
  const particle1Rotate = useSharedValue(0);
  const particle2Rotate = useSharedValue(0);
  const particle1Scale = useSharedValue(0);
  const particle2Scale = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);
  const dotsOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 900 });
    logoScale.value = withSpring(1, { damping: 10, stiffness: 80 });
    // Tagline entrance
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 700 }));
    taglineY.value = withDelay(500, withTiming(0, { duration: 600 }));
    // Rotating particles
    particle1Scale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 60 }));
    particle2Scale.value = withDelay(450, withSpring(1, { damping: 8, stiffness: 60 }));
    particle1Rotate.value = withDelay(300, withRepeat(withTiming(360, { duration: 8000 }), -1, false));
    particle2Rotate.value = withDelay(450, withRepeat(withTiming(-360, { duration: 10000 }), -1, false));
    // Glow pulse
    glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.6, { duration: 1500 })), -1, false);
    // Dots
    dotsOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth');
        }
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: particle1Scale.value },
      { rotate: `${particle1Rotate.value}deg` },
    ],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: particle2Scale.value },
      { rotate: `${particle2Rotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0.6, 1], [0.08, 0.2], Extrapolation.CLAMP),
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#08080B', '#0D0518', '#08080B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Pulsing glow */}
      <Animated.View style={[styles.glowCircle, glowStyle]} />

      {/* Rotating particle rings */}
      <Animated.View style={[styles.particle, styles.particle1, particle1Style]} />
      <Animated.View style={[styles.particle, styles.particle2, particle2Style]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <LinearGradient colors={COLORS.gradient.primary} style={styles.logoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="sparkles" size={42} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.logoText}>{t('appName')}</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </Animated.View>

      <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center' },
  glowCircle: { position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: COLORS.brand.primary },
  particle: { position: 'absolute', borderRadius: 999 },
  particle1: { width: 260, height: 260, borderWidth: 1, borderColor: 'rgba(255,0,110,0.25)', borderStyle: 'dashed' },
  particle2: { width: 340, height: 340, borderWidth: 1, borderColor: 'rgba(58,134,255,0.2)', borderStyle: 'dashed' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoIcon: { width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 22, ...SHADOWS.glow },
  logoText: { ...FONT.h1, color: COLORS.text.primary, letterSpacing: 2 },
  tagline: { ...FONT.body, color: COLORS.text.secondary, marginTop: 4, letterSpacing: 0.8, textAlign: 'center' },
  dotsRow: { position: 'absolute', bottom: 130, flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dot1: { backgroundColor: COLORS.brand.primary },
  dot2: { backgroundColor: COLORS.brand.secondary },
  dot3: { backgroundColor: COLORS.brand.accent1 },
  disclaimer: { position: 'absolute', bottom: 44, paddingHorizontal: 40, fontSize: 11, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 16 },
});

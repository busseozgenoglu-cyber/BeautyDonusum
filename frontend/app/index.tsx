import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, interpolate, Easing,
} from 'react-native-reanimated';
import { COLORS } from '../src/utils/theme';

function Ring({ delay, size }: { delay: number; size: number }) {
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ), -1
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 0.25, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.5, 1.25]) }],
    width: size, height: size, borderRadius: size / 2,
  }));
  return <Animated.View style={[styles.ring, style]} />;
}

export default function SplashScreen() {
  const { user, loading, autoLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const logoS = useSharedValue(0.5);
  const logoO = useSharedValue(0);
  const txtO = useSharedValue(0);
  const subO = useSharedValue(0);

  useEffect(() => {
    logoS.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.8)) });
    logoO.value = withTiming(1, { duration: 700 });
    txtO.value = withDelay(600, withTiming(1, { duration: 700 }));
    subO.value = withDelay(1000, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const run = async () => {
        if (!user) await autoLogin();
        router.replace('/(tabs)/home');
      };
      const timer = setTimeout(run, 1200);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoO.value, transform: [{ scale: logoS.value }] }));
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtO.value }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#F0F5F4', '#E8EEF0', '#F4F6F8']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={styles.bloomTeal} />
      <View style={styles.bloomGold} />

      <View style={styles.rings}>
        <Ring delay={0} size={220} />
        <Ring delay={800} size={340} />
        <Ring delay={1600} size={460} />
      </View>

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoGlow} />
        <View style={styles.logoBox}>
          <LinearGradient colors={[...COLORS.gradient.teal]} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoLetter}>V</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.brand, txtStyle]}>{t('appName')}</Animated.Text>
      <Animated.Text style={[styles.tagline, subStyle]}>{t('tagline')}</Animated.Text>

      <Text style={styles.disc}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bloomTeal: { position: 'absolute', top: -50, left: -40, width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.brand.primary, opacity: 0.08 },
  bloomGold: { position: 'absolute', bottom: -40, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.brand.secondary, opacity: 0.1 },
  rings: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(13,92,94,0.25)' },
  logoWrap: { alignItems: 'center', marginBottom: 28, zIndex: 1 },
  logoGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.brand.primary, opacity: 0.15, transform: [{ scale: 1.45 }] },
  logoBox: { width: 88, height: 88, borderRadius: 26, overflow: 'hidden' },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 44, fontWeight: '900', color: '#FFFFFF' },
  brand: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 0.5, marginBottom: 10, textAlign: 'center', paddingHorizontal: 24 },
  tagline: { fontSize: 14, color: COLORS.brand.primary, letterSpacing: 0.2, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  disc: { position: 'absolute', bottom: 44, paddingHorizontal: 40, fontSize: 10, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 16 },
});

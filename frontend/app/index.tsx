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
    opacity: interpolate(a.value, [0, 0.25, 1], [0, 0.6, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.5, 1.3]) }],
    width: size, height: size, borderRadius: size / 2,
  }));
  return <Animated.View style={[styles.ring, style]} />;
}

export default function SplashScreen() {
  const { user, loading } = useAuth();
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
      const t = setTimeout(() => router.replace(user ? '/(tabs)/home' : '/auth'), 2600);
      return () => clearTimeout(t);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoO.value, transform: [{ scale: logoS.value }] }));
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtO.value }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0D0900', '#0A0A0C', '#080810']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Big ambient blooms */}
      <View style={styles.bloomTL} />
      <View style={styles.bloomBR} />

      {/* Rings */}
      <View style={styles.rings}>
        <Ring delay={0} size={220} />
        <Ring delay={800} size={340} />
        <Ring delay={1600} size={460} />
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoGlow} />
        <View style={styles.logoBox}>
          <LinearGradient colors={['#F8ECC0', '#E5C07B', '#B8882E']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoLetter}>F</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Brand */}
      <Animated.Text style={[styles.brand, txtStyle]}>FaceGlow Pro</Animated.Text>
      <Animated.Text style={[styles.tagline, subStyle]}>{t('tagline')}</Animated.Text>

      <Text style={styles.disc}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bloomTL: { position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: 160, backgroundColor: '#E5C07B', opacity: 0.15 },
  bloomBR: { position: 'absolute', bottom: -60, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: '#B76E79', opacity: 0.12 },
  rings: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: '#E5C07B' },
  logoWrap: { alignItems: 'center', marginBottom: 28, zIndex: 1 },
  logoGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#E5C07B', opacity: 0.25, transform: [{ scale: 1.4 }] },
  logoBox: { width: 90, height: 90, borderRadius: 28, overflow: 'hidden' },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 46, fontWeight: '900', color: '#1A0E00' },
  brand: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2, marginBottom: 10 },
  tagline: { fontSize: 15, color: '#E5C07B', letterSpacing: 0.3 },
  disc: { position: 'absolute', bottom: 44, paddingHorizontal: 48, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 18 },
});

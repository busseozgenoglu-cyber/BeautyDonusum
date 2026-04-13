import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, interpolate, Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

function FloatingOrb({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [-12, 12]) }],
  }));
  return (
    <Animated.View style={[{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
    }, style]} />
  );
}

function HexGrid() {
  const fadeIn = useSharedValue(0);
  useEffect(() => {
    fadeIn.value = withDelay(400, withTiming(1, { duration: 1500 }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: fadeIn.value * 0.12 }));

  const hexes: { cx: number; cy: number }[] = [];
  const hexR = 30;
  const rows = 8, cols = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = r % 2 === 0 ? 0 : hexR;
      hexes.push({ cx: c * hexR * 2 + offsetX + 20, cy: r * hexR * 1.7 + H * 0.25 });
    }
  }
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      {hexes.map((h, i) => (
        <View key={i} style={{
          position: 'absolute', left: h.cx - 12, top: h.cy - 12,
          width: 24, height: 24, borderRadius: 6,
          borderWidth: 0.5, borderColor: '#2DD4A8',
          transform: [{ rotate: '45deg' }],
        }} />
      ))}
    </Animated.View>
  );
}

export default function SplashScreen() {
  const { user, loading, autoLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const logoS = useSharedValue(0.3);
  const logoO = useSharedValue(0);
  const txtO = useSharedValue(0);
  const subO = useSharedValue(0);
  const lineW = useSharedValue(0);

  useEffect(() => {
    logoS.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.6)) });
    logoO.value = withTiming(1, { duration: 600 });
    txtO.value = withDelay(500, withTiming(1, { duration: 700 }));
    subO.value = withDelay(900, withTiming(1, { duration: 600 }));
    lineW.value = withDelay(700, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const run = async () => {
        if (!user) await autoLogin();
        router.replace('/(tabs)/home');
      };
      const timer = setTimeout(run, 1400);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoO.value, transform: [{ scale: logoS.value }] }));
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtO.value, transform: [{ translateY: interpolate(txtO.value, [0, 1], [20, 0]) }] }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineW.value }] }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030A0C', '#050D0F', '#071215', '#050D0F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      <HexGrid />

      <FloatingOrb x={-40} y={H * 0.15} size={180} color="rgba(45,212,168,0.08)" delay={0} />
      <FloatingOrb x={W * 0.6} y={H * 0.7} size={200} color="rgba(247,133,110,0.06)" delay={800} />
      <FloatingOrb x={W * 0.3} y={H * 0.4} size={120} color="rgba(45,212,168,0.04)" delay={1200} />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoOuter}>
          <LinearGradient
            colors={['#2DD4A8', '#1A9B7A', '#0F7A5C']}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInnerRing}>
              <Text style={styles.logoLetter}>YA</Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.brand, txtStyle]}>Yüz Atölyem</Animated.Text>

      <Animated.View style={[styles.dividerLine, lineStyle]} />

      <Animated.Text style={[styles.tagline, subStyle]}>{t('tagline')}</Animated.Text>

      <Text style={styles.disc}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 24, zIndex: 1 },
  logoOuter: { width: 100, height: 100, borderRadius: 30, overflow: 'hidden', shadowColor: '#2DD4A8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 20 },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  logoInnerRing: { width: '100%', height: '100%', borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 32, fontWeight: '900', color: '#F0F6F4', letterSpacing: 2 },
  brand: { fontSize: 36, fontWeight: '800', color: '#F0F6F4', letterSpacing: 1.5, marginBottom: 12 },
  dividerLine: { width: 60, height: 2, backgroundColor: '#2DD4A8', borderRadius: 1, marginBottom: 12 },
  tagline: { fontSize: 15, color: '#2DD4A8', letterSpacing: 0.5, fontWeight: '500' },
  disc: { position: 'absolute', bottom: 44, paddingHorizontal: 48, fontSize: 11, color: 'rgba(240,246,244,0.15)', textAlign: 'center', lineHeight: 18 },
});

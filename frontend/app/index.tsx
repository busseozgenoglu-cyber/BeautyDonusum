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
import { Ionicons } from '@expo/vector-icons';

function FloatingOrb({ delay, size, color, x, y }: { delay: number; size: number; color: string; x: number; y: number }) {
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
      ), -1
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 0.5, 1], [0.15, 0.35, 0.15]),
    transform: [{ translateY: interpolate(a.value, [0, 1], [0, -18]) }, { scale: interpolate(a.value, [0, 0.5, 1], [1, 1.08, 1]) }],
    width: size, height: size, borderRadius: size / 2,
    position: 'absolute' as const, left: x, top: y, backgroundColor: color,
  }));
  return <Animated.View style={style} />;
}

export default function SplashScreen() {
  const { user, loading, autoLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const logoS = useSharedValue(0.6);
  const logoO = useSharedValue(0);
  const txtO = useSharedValue(0);
  const subO = useSharedValue(0);

  useEffect(() => {
    logoS.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.5)) });
    logoO.value = withTiming(1, { duration: 600 });
    txtO.value = withDelay(500, withTiming(1, { duration: 600 }));
    subO.value = withDelay(900, withTiming(1, { duration: 500 }));
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
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtO.value, transform: [{ translateY: interpolate(txtO.value, [0, 1], [12, 0]) }] }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subO.value }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#EEF2FF', '#FAFBFE', '#F0FDFA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <FloatingOrb delay={0} size={200} color="#3B82F6" x={-40} y={80} />
      <FloatingOrb delay={600} size={160} color="#8B5CF6" x={250} y={180} />
      <FloatingOrb delay={1200} size={180} color="#06B6D4" x={60} y={550} />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="compass" size={42} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      <Animated.Text style={[styles.brand, txtStyle]}>Estetik Pusula</Animated.Text>
      <Animated.Text style={[styles.tagline, subStyle]}>{t('tagline')}</Animated.Text>

      <Text style={styles.disc}>{t('disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFE' },
  logoWrap: { alignItems: 'center', marginBottom: 24, zIndex: 1 },
  logoGrad: { width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  brand: { fontSize: 32, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 15, color: '#3B82F6', fontWeight: '500', letterSpacing: 0.2 },
  disc: { position: 'absolute', bottom: 50, paddingHorizontal: 48, fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 17 },
});

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
import { AetherScreen } from '../src/components/AetherScreen';
import { COLORS, RADIUS, SHADOWS } from '../src/utils/theme';

function PulseOrb({ delay, size }: { delay: number; size: number }) {
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 0.35, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(a.value, [0, 1], [0.4, 1.15]) }],
    width: size,
    height: size,
    borderRadius: size / 2,
  }));
  return <Animated.View style={[styles.orbRing, style]} />;
}

export default function SplashScreen() {
  const { user, loading, autoLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const logoS = useSharedValue(0.4);
  const logoO = useSharedValue(0);
  const lineW = useSharedValue(0);
  const txtO = useSharedValue(0);

  useEffect(() => {
    logoS.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.6)) });
    logoO.value = withTiming(1, { duration: 600 });
    lineW.value = withDelay(400, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    txtO.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    if (!loading) {
      const run = async () => {
        if (!user) await autoLogin();
        router.replace('/(tabs)/home');
      };
      const timer = setTimeout(run, 1100);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoO.value, transform: [{ scale: logoS.value }] }));
  const lineStyle = useAnimatedStyle(() => ({
    opacity: lineW.value,
    transform: [{ scaleX: lineW.value }],
  }));
  const txtStyle = useAnimatedStyle(() => ({ opacity: txtO.value }));

  return (
    <AetherScreen>
      <View style={styles.root}>
        <View style={styles.orbits}>
          <PulseOrb delay={0} size={200} />
          <PulseOrb delay={600} size={300} />
          <PulseOrb delay={1200} size={400} />
        </View>

        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <LinearGradient colors={[...COLORS.gradient.beam]} style={styles.logoHex} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.logoLetter}>F</Text>
          </LinearGradient>
          <View style={styles.badgeVelum}>
            <Text style={styles.badgeVelumTxt}>VELUM</Text>
          </View>
        </Animated.View>

        <Text style={styles.brand}>FaceGlow Pro</Text>
        <Animated.View style={[styles.lineWrap, lineStyle]}>
          <LinearGradient colors={['transparent', COLORS.brand.primary, 'transparent']} style={styles.lineGrad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
        </Animated.View>
        <Animated.Text style={[styles.tagline, txtStyle]}>{t('tagline')}</Animated.Text>

        <Text style={styles.disc}>{t('disclaimer')}</Text>
      </View>
    </AetherScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  orbits: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  orbRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)' },

  logoBlock: { alignItems: 'center', marginBottom: 20, zIndex: 2 },
  logoHex: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  logoLetter: { fontSize: 44, fontFamily: 'Outfit_900Black', color: COLORS.text.inverse },
  badgeVelum: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    backgroundColor: 'rgba(45,212,191,0.08)',
  },
  badgeVelumTxt: { fontSize: 9, fontFamily: 'Outfit_700Bold', color: COLORS.brand.secondary, letterSpacing: 2 },

  brand: { fontSize: 34, fontFamily: 'CormorantGaramond_700Bold', color: COLORS.text.primary, letterSpacing: 0.8 },
  lineWrap: { width: '72%', height: 2, marginVertical: 14, borderRadius: 1, overflow: 'hidden' },
  lineGrad: { flex: 1 },
  tagline: { fontSize: 15, fontFamily: 'Outfit_500Medium', color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22 },

  disc: { position: 'absolute', bottom: 40, fontSize: 11, fontFamily: 'Outfit_400Regular', color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 17 },
});

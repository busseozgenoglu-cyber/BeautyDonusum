import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS } from '../src/utils/theme';

function PulseLine({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + progress.value * 0.5,
    transform: [{ scaleX: 0.7 + progress.value * 0.3 }],
  }));

  return <Animated.View style={[styles.pulseLine, animatedStyle]} />;
}

export default function SplashScreen() {
  const { user, loading, autoLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);
  const copyOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.4)) });
    cardOpacity.value = withTiming(1, { duration: 600 });
    copyOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, [cardOpacity, cardScale, copyOpacity]);

  useEffect(() => {
    if (!loading) {
      const run = async () => {
        if (!user) {
          await autoLogin();
        }
        router.replace('/(tabs)/home');
      };

      const timer = setTimeout(run, 1400);
      return () => clearTimeout(timer);
    }
  }, [autoLogin, loading, router, user]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const copyStyle = useAnimatedStyle(() => ({ opacity: copyOpacity.value }));

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#08111F', '#0D1A30', '#15253F']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.pulseWrap}>
        <PulseLine delay={0} />
        <PulseLine delay={400} />
        <PulseLine delay={800} />
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient colors={COLORS.gradient.lagoon} style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>AA</Text>
        </LinearGradient>
        <Text style={styles.brand}>Ayna Atlas</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </Animated.View>

      <Animated.View style={[styles.copyWrap, copyStyle]}>
        <Text style={styles.copyTitle}>Karar vermeden once dosyani hazirla.</Text>
        <Text style={styles.copyBody}>
          Estetik surecini analiz, danisma sorulari ve toparlanma planlamasi ile daha bilincli
          ilerletmek icin tasarlandi.
        </Text>
      </Animated.View>

      <Animated.Text entering={FadeIn.delay(600)} style={styles.disclaimer}>
        {t('disclaimer')}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(70,198,255,0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,176,120,0.16)',
  },
  pulseWrap: { position: 'absolute', top: 190, width: '100%', alignItems: 'center', gap: 22 },
  pulseLine: {
    width: 220,
    height: 1,
    backgroundColor: 'rgba(198,212,255,0.55)',
  },
  card: {
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 24,
    backgroundColor: 'rgba(16,27,50,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(198,212,255,0.18)',
    marginBottom: 22,
  },
  cardBadge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardBadgeText: { fontSize: 30, fontWeight: '900', color: COLORS.text.inverse },
  brand: { fontSize: 34, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8 },
  tagline: { fontSize: 14, color: COLORS.brand.primary, fontWeight: '700' },
  copyWrap: { alignItems: 'center', paddingHorizontal: 8 },
  copyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text.primary, textAlign: 'center', marginBottom: 10 },
  copyBody: { fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 21 },
  disclaimer: {
    position: 'absolute',
    bottom: 42,
    paddingHorizontal: 20,
    fontSize: 11,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

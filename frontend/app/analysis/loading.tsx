import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS } from '../../src/utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay,
  interpolate, Easing,
} from 'react-native-reanimated';
import api from '../../src/utils/api';
import { pendingPhotoStore } from '../../src/utils/pendingPhotoStore';
import { useAuth } from '../../src/context/AuthContext';
import * as SecureStore from 'expo-secure-store';


function Ring({ index }: { index: number }) {
  const anim = useSharedValue(0);
  const baseSize = 130 + index * 70;
  const delay = index * 400;

  useEffect(() => {
    anim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.7, 1.1]) }],
    width: baseSize,
    height: baseSize,
    borderRadius: baseSize / 2,
  }));

  return (
    <Animated.View style={[styles.ring, style, { borderColor: `rgba(229,192,123,${0.7 - index * 0.18})` }]} />
  );
}

function ScanLine() {
  const pos = useSharedValue(-50);
  useEffect(() => {
    pos.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-50, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: pos.value }] }));
  return (
    <Animated.View style={[styles.scanLine, style]}>
      <LinearGradient colors={['transparent', 'rgba(13,92,94,0.75)', 'transparent']} style={styles.scanLineGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
    </Animated.View>
  );
}

const STEPS = [
  { icon: '🔍', label: 'Yüz taranıyor...' },
  { icon: '📊', label: 'Metrikler hesaplanıyor...' },
  { icon: '✨', label: 'AI öneriler üretiliyor...' },
  { icon: '🎯', label: 'Sonuçlar hazırlanıyor...' },
];

export default function LoadingScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { autoLogin } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const run = async () => {
      try {
        // Token yoksa önce auth sağla
        const existingToken = await SecureStore.getItemAsync('auth_token');
        if (!existingToken) {
          await autoLogin();
        }

        const photoBase64 = pendingPhotoStore.photo ?? 'placeholder_photo_data';
        setStep(0); await delay(800);
        if (cancelled.current) return;

        setStep(1);
        const { data: analysisData } = await api.post('/analysis/create', {
          category: category || 'medikal',
          photo_base64: photoBase64,
        });
        if (cancelled.current) return;

        setStep(2);
        await api.post(`/analysis/${analysisData.analysis_id}/recommendations`);
        if (cancelled.current) return;

        setStep(3); await delay(800);
        if (cancelled.current) return;

        pendingPhotoStore.photo = null;
        router.replace({ pathname: '/analysis/results', params: { analysisId: analysisData.analysis_id } });
      } catch (e: any) {
        if (!cancelled.current) {
          setError(e.response?.data?.detail || 'Analiz sırasında bir hata oluştu');
        }
      }
    };
    run();
    return () => { cancelled.current = true; };
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <View style={styles.root}>
      <Image source={require('../../assets/images/analysis-bg.png')} style={StyleSheet.absoluteFillObject} blurRadius={10} />
      <LinearGradient colors={['rgba(244,246,248,0.92)', 'rgba(238,242,244,0.96)', 'rgba(244,246,248,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientGlow} />

      <SafeAreaView style={styles.container}>
        {/* Rings + Face icon */}
        <View style={styles.ringsWrap}>
          <Ring index={0} />
          <Ring index={1} />
          <Ring index={2} />
          <View style={styles.centerCircle}>
            <LinearGradient colors={['rgba(13,92,94,0.12)', 'rgba(13,92,94,0.04)']} style={styles.centerGrad}>
              <ScanLine />
              <Text style={styles.faceIcon}>👤</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Analiz Ediliyor</Text>

        {/* Steps */}
        <View style={styles.stepsWrap}>
          {STEPS.map((s, i) => (
            <View key={i} style={[styles.stepRow, i === step && styles.stepRowActive]}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
                {i < step ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : (
                  <Text style={styles.stepNum}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive, i < step && styles.stepLabelDone]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress)}%</Text>

        {/* Error state */}
        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>← Geri Dön</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  ambientGlow: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: 200, backgroundColor: 'rgba(13,92,94,0.06)',
    alignSelf: 'center', top: '20%',
  },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Rings
  ringsWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, height: 280 },
  ring: {
    position: 'absolute', borderWidth: 1.5,
  },
  centerCircle: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden' },
  centerGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceIcon: { fontSize: 48 },
  scanLine: { position: 'absolute', width: '100%', height: 2 },
  scanLineGrad: { flex: 1, height: 2 },

  // Text
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 32, letterSpacing: -0.3 },

  // Steps
  stepsWrap: { width: '100%', marginBottom: 32, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 0.4 },
  stepRowActive: { opacity: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border.subtle,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: COLORS.status.success, borderColor: COLORS.status.success },
  stepDotActive: { borderColor: COLORS.brand.primary, backgroundColor: 'rgba(13,92,94,0.08)' },
  stepNum: { ...FONT.xs, color: COLORS.text.tertiary, fontWeight: '700' },
  stepCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
  stepLabel: { ...FONT.body, color: COLORS.text.tertiary },
  stepLabelActive: { color: COLORS.text.primary, fontWeight: '600' },
  stepLabelDone: { color: COLORS.status.success },

  // Progress
  progressTrack: {
    width: '100%', height: 3, borderRadius: 2,
    backgroundColor: COLORS.border.subtle, marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.brand.primary, borderRadius: 2 },
  progressPct: { ...FONT.xs, color: COLORS.text.tertiary },

  // Error
  errorWrap: { alignItems: 'center', marginTop: 24, gap: 14 },
  errorText: { ...FONT.body, color: COLORS.status.error, textAlign: 'center' },
  backBtn: {
    borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 32,
    borderWidth: 1, borderColor: COLORS.border.subtle,
    backgroundColor: COLORS.surface.card,
  },
  backBtnText: { ...FONT.body, color: COLORS.text.primary },
});

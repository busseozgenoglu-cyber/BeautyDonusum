import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS } from '../../src/utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, withDelay,
  interpolate, Easing,
} from 'react-native-reanimated';
import api, { setToken } from '../../src/utils/api';
import { pendingPhotoStore } from '../../src/utils/pendingPhotoStore';
import { useAuth } from '../../src/context/AuthContext';
import * as SecureStore from 'expo-secure-store';

function PulseRing({ index }: { index: number }) {
  const anim = useSharedValue(0);
  const baseSize = 120 + index * 65;

  useEffect(() => {
    anim.value = withDelay(
      index * 400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ), -1
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2, 1], [0, 0.4, 0]),
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.7, 1.1]) }],
    width: baseSize, height: baseSize, borderRadius: baseSize / 2,
  }));

  return <Animated.View style={[styles.ring, style, { borderColor: `rgba(45,212,168,${0.6 - index * 0.15})` }]} />;
}

function ScanBeam() {
  const pos = useSharedValue(-50);
  useEffect(() => {
    pos.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-50, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ), -1
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: pos.value }] }));
  return (
    <Animated.View style={[styles.scanBeam, style]}>
      <LinearGradient colors={['transparent', 'rgba(45,212,168,0.6)', 'transparent']} style={styles.scanBeamGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
    </Animated.View>
  );
}

const STEPS = [
  { label: 'Yüz taranıyor...' },
  { label: 'Metrikler hesaplanıyor...' },
  { label: 'AI öneriler üretiliyor...' },
  { label: 'Sonuçlar hazırlanıyor...' },
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
        const existingToken = await SecureStore.getItemAsync('auth_token');
        if (!existingToken) await autoLogin();

        const photoBase64 = pendingPhotoStore.photo ?? 'placeholder_photo_data';
        setStep(0); await sleepMs(800);
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

        setStep(3); await sleepMs(800);
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
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientGlow} />

      <SafeAreaView style={styles.container}>
        <View style={styles.ringsWrap}>
          <PulseRing index={0} />
          <PulseRing index={1} />
          <PulseRing index={2} />
          <View style={styles.centerCircle}>
            <LinearGradient colors={['rgba(45,212,168,0.12)', 'rgba(45,212,168,0.03)']} style={styles.centerGrad}>
              <ScanBeam />
              <Text style={styles.faceIcon}>👤</Text>
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.title}>Analiz Ediliyor</Text>

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

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress)}%</Text>

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

function sleepMs(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  ambientGlow: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(45,212,168,0.03)', alignSelf: 'center', top: '20%' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  ringsWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, height: 280 },
  ring: { position: 'absolute', borderWidth: 1.5 },
  centerCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  centerGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceIcon: { fontSize: 44 },
  scanBeam: { position: 'absolute', width: '100%', height: 2 },
  scanBeamGrad: { flex: 1, height: 2 },
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 32, letterSpacing: -0.3 },
  stepsWrap: { width: '100%', marginBottom: 32, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 0.35 },
  stepRowActive: { opacity: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: '#2DD4A8', borderColor: '#2DD4A8' },
  stepDotActive: { borderColor: '#2DD4A8', backgroundColor: 'rgba(45,212,168,0.08)' },
  stepNum: { ...FONT.xs, color: COLORS.text.tertiary, fontWeight: '700' },
  stepCheck: { fontSize: 12, color: '#050D0F', fontWeight: '700' },
  stepLabel: { ...FONT.body, color: COLORS.text.tertiary },
  stepLabelActive: { color: COLORS.text.primary, fontWeight: '600' },
  stepLabelDone: { color: '#2DD4A8' },
  progressTrack: { width: '100%', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2DD4A8', borderRadius: 2 },
  progressPct: { ...FONT.xs, color: COLORS.text.tertiary },
  errorWrap: { alignItems: 'center', marginTop: 24, gap: 14 },
  errorText: { ...FONT.body, color: COLORS.status.error, textAlign: 'center' },
  backBtn: { borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  backBtnText: { ...FONT.body, color: COLORS.text.primary },
});

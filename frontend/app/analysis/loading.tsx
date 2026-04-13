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
  const baseSize = 100 + index * 60;
  const ringDelay = index * 350;

  useEffect(() => {
    anim.value = withDelay(
      ringDelay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 0.2, 1], [0, 0.4, 0]),
    transform: [{ scale: interpolate(anim.value, [0, 1], [0.8, 1.15]) }],
    width: baseSize,
    height: baseSize,
    borderRadius: baseSize / 2,
  }));

  return (
    <Animated.View style={[styles.ring, style, { borderColor: `rgba(59,130,246,${0.5 - index * 0.12})` }]} />
  );
}

const STEPS = [
  { icon: 'scan-outline', label: 'Yüz taranıyor...' },
  { icon: 'analytics-outline', label: 'Metrikler hesaplanıyor...' },
  { icon: 'bulb-outline', label: 'Kişisel öneriler oluşturuluyor...' },
  { icon: 'checkmark-circle-outline', label: 'Sonuçlar hazırlanıyor...' },
];

export default function LoadingScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { autoLogin, user } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    const run = async () => {
      try {
        const existingToken = await SecureStore.getItemAsync('auth_token');
        if (!existingToken) {
          await autoLogin();
        }

        const photoBase64 = pendingPhotoStore.photo ?? 'placeholder_photo_data';
        setStep(0); await delayMs(800);
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

        setStep(3); await delayMs(800);
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
      <LinearGradient colors={['#EEF2FF', '#FAFBFE', '#F0FDFA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <SafeAreaView style={styles.container}>
        <View style={styles.ringsWrap}>
          <PulseRing index={0} />
          <PulseRing index={1} />
          <PulseRing index={2} />
          <View style={styles.centerCircle}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.centerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.faceIcon}>
                <View><Text style={{ fontSize: 38, color: '#FFFFFF' }}>AI</Text></View>
              </Text>
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

function delayMs(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  ringsWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 48, height: 260 },
  ring: { position: 'absolute', borderWidth: 2 },
  centerCircle: { width: 90, height: 90, borderRadius: 28, overflow: 'hidden', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  centerGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceIcon: { fontSize: 38, color: '#FFFFFF', fontWeight: '900' },

  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 32 },

  stepsWrap: { width: '100%', marginBottom: 32, gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 0.35 },
  stepRowActive: { opacity: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  stepDotDone: { backgroundColor: COLORS.status.success, borderColor: COLORS.status.success },
  stepDotActive: { borderColor: COLORS.brand.primary, backgroundColor: '#EEF2FF' },
  stepNum: { ...FONT.xs, color: COLORS.text.tertiary, fontWeight: '700' },
  stepCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
  stepLabel: { ...FONT.body, color: COLORS.text.tertiary },
  stepLabelActive: { color: COLORS.text.primary, fontWeight: '600' },
  stepLabelDone: { color: COLORS.status.success },

  progressTrack: {
    width: '100%', height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.brand.primary, borderRadius: 2 },
  progressPct: { ...FONT.xs, color: COLORS.text.tertiary },

  errorWrap: { alignItems: 'center', marginTop: 24, gap: 14 },
  errorText: { ...FONT.body, color: COLORS.status.error, textAlign: 'center' },
  backBtn: {
    borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 32,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
  },
  backBtnText: { ...FONT.body, color: COLORS.text.primary },
});

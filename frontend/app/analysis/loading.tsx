import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING } from '../../src/utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import api from '../../src/utils/api';

export default function LoadingScreen() {
  const { category, photoBase64 } = useLocalSearchParams<{ category: string; photoBase64: string }>();
  const { t } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const pulseVal = useSharedValue(1);

  const steps = [
    'Yüz taranıyor...',
    'Metrikler hesaplanıyor...',
    'AI öneriler üretiliyor...',
    'Sonuçlar hazırlanıyor...',
  ];

  useEffect(() => {
    pulseVal.value = withRepeat(withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })), -1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runAnalysis = async () => {
      try {
        setStep(0);
        await new Promise(r => setTimeout(r, 1200));
        if (cancelled) return;

        setStep(1);
        const { data: analysisData } = await api.post('/analysis/create', {
          category: category || 'medikal',
          photo_base64: photoBase64 || 'placeholder_photo_data',
        });
        if (cancelled) return;

        setStep(2);
        const { data: recsData } = await api.post(`/analysis/${analysisData.analysis_id}/recommendations`);
        if (cancelled) return;

        setStep(3);
        await new Promise(r => setTimeout(r, 800));
        if (cancelled) return;

        router.replace({ pathname: '/analysis/results', params: { analysisId: analysisData.analysis_id } });
      } catch (e: any) {
        if (!cancelled) {
          setError(e.response?.data?.detail || 'Analiz sırasında hata oluştu');
        }
      }
    };
    runAnalysis();
    return () => { cancelled = true; };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseVal.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#141414', '#0A0A0A']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.scanCircle, pulseStyle]}>
        <View style={styles.innerCircle}>
          <ActivityIndicator size="large" color={COLORS.brand.primary} />
        </View>
      </Animated.View>
      <Text style={styles.title}>{t('analyzing')}</Text>
      <Text style={styles.stepText}>{error || steps[step] || steps[0]}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
      </View>
      {error ? (
        <Text style={styles.errorText}>Lütfen tekrar deneyin</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  scanCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(229,192,123,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  innerCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(229,192,123,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { ...FONT.h3, color: COLORS.text.primary, marginBottom: 8 },
  stepText: { ...FONT.body, color: COLORS.text.secondary, marginBottom: 32 },
  progressBar: { width: '80%', height: 4, backgroundColor: COLORS.bg.tertiary, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.brand.primary, borderRadius: 2 },
  errorText: { ...FONT.small, color: COLORS.status.error, marginTop: 16 },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing,
} from 'react-native-reanimated';
import api from '../../src/utils/api';
import { purchasePremium } from '../../src/utils/purchases';

const METRIC_LABELS: Record<string, string> = {
  symmetry_score: 'Simetri', jawline_definition: 'Çene Hattı',
  nose_proportion: 'Burun', eye_spacing: 'Göz Aralığı',
  lip_ratio: 'Dudak', skin_quality: 'Cilt',
  cheekbone_prominence: 'Elmacık', forehead_proportion: 'Alın',
  chin_projection: 'Çene Ucu', overall_harmony: 'Genel Uyum',
};

function AnimatedMetricBar({ label, value, delay: delayMs = 0 }: { label: string; value: number; delay?: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? COLORS.status.success : pct >= 65 ? COLORS.status.warning : COLORS.status.error;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delayMs, withTiming(pct, { duration: 900, easing: Easing.out(Easing.quad) }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

  return (
    <Animated.View entering={FadeInDown.delay(delayMs).duration(400)} style={mStyles.row}>
      <Text style={mStyles.label}>{label}</Text>
      <View style={mStyles.track}>
        <Animated.View style={[mStyles.fill, { backgroundColor: color }, barStyle]} />
      </View>
      <Text style={[mStyles.val, { color }]}>{pct}%</Text>
    </Animated.View>
  );
}

const mStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { width: 86, ...FONT.xs, color: COLORS.text.secondary },
  track: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { width: 38, ...FONT.xs, textAlign: 'right', fontWeight: '700' },
});

function RecCard({ rec, locked }: { rec: any; locked: boolean }) {
  const prioColor = rec.priority === 'high' ? COLORS.status.error : rec.priority === 'medium' ? COLORS.status.warning : COLORS.status.success;
  return (
    <View style={[rStyles.card, locked && rStyles.locked]}>
      <View style={rStyles.header}>
        <View style={[rStyles.prioBadge, { backgroundColor: prioColor + '1A' }]}>
          <View style={[rStyles.prioDot, { backgroundColor: prioColor }]} />
          <Text style={[rStyles.prioText, { color: prioColor }]}>
            {rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'}
          </Text>
        </View>
        <Text style={rStyles.area}>{rec.area}</Text>
      </View>
      <Text style={rStyles.title}>{rec.title}</Text>
      {locked ? (
        <View style={rStyles.lockRow}>
          <Ionicons name="lock-closed" size={16} color={COLORS.brand.primary} />
          <Text style={rStyles.lockText}>Premium ile tüm önerileri görün</Text>
        </View>
      ) : (
        <>
          <Text style={rStyles.desc}>{rec.description}</Text>
          <Text style={rStyles.reason}>{rec.reason}</Text>
          {rec.improvement_potential != null && (
            <View style={rStyles.improvRow}>
              <Text style={rStyles.improvLabel}>İyileşme Potansiyeli</Text>
              <Text style={rStyles.improvVal}>{Math.round(rec.improvement_potential * 100)}%</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const rStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  locked: { opacity: 0.65 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { ...FONT.xs, fontWeight: '700' },
  area: { ...FONT.xs, color: COLORS.text.tertiary },
  title: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 8 },
  desc: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 6 },
  reason: { ...FONT.xs, color: COLORS.text.tertiary, fontStyle: 'italic', marginBottom: 10 },
  improvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  improvLabel: { ...FONT.xs, color: COLORS.text.tertiary },
  improvVal: { ...FONT.small, color: COLORS.brand.primary, fontWeight: '700' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  lockText: { ...FONT.small, color: COLORS.brand.primary },
});

export default function ResultsScreen() {
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transforming, setTransforming] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const isPremium = user?.subscription === 'premium';

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/analysis/${analysisId}`);
        setAnalysis(data);
        if (!isPremium && !data.is_unlocked) setShowPaywall(true);
      } catch {
        Alert.alert('Hata', 'Analiz yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    if (analysisId) fetch();
  }, [analysisId]);

  // Animated score counter
  useEffect(() => {
    if (!analysis) return;
    const recs = analysis.recommendations || {};
    const target = parseFloat(
      recs.overall_score != null
        ? recs.overall_score
        : ((analysis.metrics?.overall_harmony ?? 0) * 10).toFixed(1)
    );
    let current = 0;
    const steps = 40;
    const inc = target / steps;
    const iv = setInterval(() => {
      current += inc;
      if (current >= target) { setDisplayScore(target); clearInterval(iv); }
      else setDisplayScore(parseFloat(current.toFixed(1)));
    }, 40);
    return () => clearInterval(iv);
  }, [analysis]);

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const isPremiumNow = await purchasePremium();
      if (isPremiumNow) {
        await api.post('/subscription/activate', { plan: 'premium' });
        setShowPaywall(false);
        Alert.alert('Tebrikler!', 'Premium aboneliğiniz aktif edildi.');
      }
    } catch (e: any) {
      if (e?.userCancelled) { setPurchasing(false); return; }
      Alert.alert('Hata', e?.message || 'Satın alma tamamlanamadı.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleTransform = async () => {
    if (!isPremium) { setShowPaywall(true); return; }
    setTransforming(true);
    try {
      const { data } = await api.post(`/analysis/${analysisId}/transform`);
      setAnalysis((prev: any) => ({ ...prev, transformation_base64: data.transformation_base64 }));
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.detail || 'Dönüşüm oluşturulamadı');
    } finally { setTransforming(false); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} />
      </View>
    );
  }

  const metrics = analysis?.metrics || {};
  const recs = analysis?.recommendations || {};
  const recList: any[] = recs.recommendations || [];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A0A', '#0D0D0D', '#0A0A0A']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="results-back-btn" onPress={() => router.replace('/(tabs)/home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('analysisComplete')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Score Card */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.scoreCardOuter}>
            <LinearGradient
              colors={['rgba(229,192,123,0.12)', 'rgba(229,192,123,0.02)', 'transparent']}
              style={styles.scoreCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreLabel}>Uyum Skoru</Text>
                  <View style={styles.scoreNumRow}>
                    <Text style={styles.scoreNum}>{displayScore.toFixed(1)}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                  </View>
                </View>
                <View style={styles.scoreRing}>
                  <LinearGradient colors={['#F5E0A0', '#C9963A']} style={styles.scoreRingFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.scoreRingText}>{displayScore.toFixed(1)}</Text>
                  </LinearGradient>
                </View>
              </View>
              <View style={styles.catBadge}>
                <Ionicons
                  name={analysis?.category === 'cerrahi' ? 'cut-outline' : 'sparkles-outline'}
                  size={14} color={COLORS.brand.primary}
                />
                <Text style={styles.catText}>
                  {analysis?.category === 'cerrahi' ? t('surgical') : t('medicalAesthetic')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Summary */}
          {recs.summary ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.brand.primary} />
              </View>
              <Text style={styles.summaryText}>{recs.summary}</Text>
            </Animated.View>
          ) : null}

          {/* Metrics */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Yüz Metrikleri</Text>
            <View style={styles.metricsCard}>
              {Object.entries(metrics).map(([key, val], i) => (
                <AnimatedMetricBar
                  key={key}
                  label={METRIC_LABELS[key] || key}
                  value={val as number}
                  delay={i * 60}
                />
              ))}
            </View>
          </Animated.View>

          {/* Recommendations */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recommendations')}</Text>
            {recList.map((rec: any, i: number) => (
              <RecCard key={i} rec={rec} locked={!isPremium && i > 0} />
            ))}
          </Animated.View>

          {/* Before / After */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('beforeAfter')}</Text>
            {analysis?.transformation_base64 ? (
              <View style={styles.transformCard}>
                <Image
                  source={{ uri: `data:image/png;base64,${analysis.transformation_base64}` }}
                  style={styles.transformImage}
                  resizeMode="cover"
                />
                <View style={styles.simBadge}>
                  <Ionicons name="sparkles" size={11} color={COLORS.brand.primary} />
                  <Text style={styles.simText}>{t('aiSimulation')}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                testID="generate-transform-btn"
                onPress={handleTransform}
                activeOpacity={0.85}
                style={styles.transformPlaceholder}
              >
                {transforming ? (
                  <View style={styles.transformLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.brand.primary} />
                    <Text style={styles.transformLoadingText}>{t('generating')}</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={isPremium ? ['rgba(229,192,123,0.1)', 'rgba(229,192,123,0.03)'] : ['rgba(255,255,255,0.03)', 'transparent']}
                    style={styles.transformPlaceholderInner}
                  >
                    <Ionicons
                      name={isPremium ? 'image-outline' : 'lock-closed'}
                      size={36}
                      color={isPremium ? COLORS.brand.primary : COLORS.text.tertiary}
                    />
                    <Text style={[styles.transformPlaceholderText, isPremium && { color: COLORS.brand.primary }]}>
                      {isPremium ? 'AI Dönüşüm Oluştur' : 'Premium ile AI Dönüşüm'}
                    </Text>
                    {!isPremium && <Text style={styles.transformSubText}>Önce ve sonra simülasyonu</Text>}
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={13} color={COLORS.text.tertiary} />
            <Text style={styles.disclaimerText}>{t('disclaimer')}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Paywall Modal */}
      {showPaywall && (
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallCard}>
            {/* Close → goes back, not just hides */}
            <TouchableOpacity
              testID="close-paywall"
              style={styles.paywallClose}
              onPress={() => router.replace('/(tabs)/home')}
            >
              <Ionicons name="close" size={22} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <LinearGradient
              colors={['rgba(229,192,123,0.12)', 'transparent']}
              style={styles.paywallTopGlow}
            />

            <View style={styles.paywallIconWrap}>
              <LinearGradient colors={['#F5E0A0', '#C9963A']} style={styles.paywallIconGrad}>
                <Ionicons name="diamond" size={28} color="#0A0700" />
              </LinearGradient>
            </View>

            <Text style={styles.paywallTitle}>Premium Gerekli</Text>
            <Text style={styles.paywallDesc}>
              {"Tüm önerileri, detaylı metrikleri ve AI dönüşüm simülasyonunu görmek için Premium'a yükseltin."}
            </Text>

            <View style={styles.featureGrid}>
              {[
                { icon: 'document-text-outline', text: t('fullReport') },
                { icon: 'infinite-outline', text: t('unlimitedAnalysis') },
                { icon: 'images-outline', text: t('hdTransform') },
                { icon: 'bookmark-outline', text: t('saveCompare') },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Ionicons name={f.icon as any} size={17} color={COLORS.brand.primary} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity testID="paywall-upgrade-btn" onPress={handleUpgrade} activeOpacity={0.85} style={styles.paywallBtnWrap} disabled={purchasing}>
              <LinearGradient colors={['#F5E0A0', '#E5C07B', '#C9963A']} style={styles.paywallBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {purchasing ? (
                  <ActivityIndicator size="small" color="#0A0700" />
                ) : (
                  <>
                    <Ionicons name="diamond" size={18} color="#0A0700" />
                    <Text style={styles.paywallBtnText}>{t('activatePremium')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.paywallNote}>App Store üzerinden ödeme yapılacaktır</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bg.primary, alignItems: 'center', justifyContent: 'center' },
  glowTop: {
    position: 'absolute', top: -80, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(229,192,123,0.06)',
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { ...FONT.h4, color: COLORS.text.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 48 },

  // Score
  scoreCardOuter: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(229,192,123,0.15)' },
  scoreCard: { padding: 24 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scoreLabel: { ...FONT.small, color: COLORS.text.secondary, marginBottom: 4 },
  scoreNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNum: { fontSize: 52, fontWeight: '800', color: COLORS.brand.primary, lineHeight: 58 },
  scoreMax: { ...FONT.h3, color: COLORS.text.tertiary },
  scoreRing: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  scoreRingFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreRingText: { fontSize: 22, fontWeight: '800', color: '#0A0700' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, backgroundColor: 'rgba(229,192,123,0.08)',
    borderWidth: 1, borderColor: 'rgba(229,192,123,0.2)',
  },
  catText: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '600' },

  // Summary
  summaryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryIcon: { marginTop: 1 },
  summaryText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 22 },

  // Section
  section: { marginBottom: 28 },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 14 },
  metricsCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.xl,
    padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },

  // Transform
  transformCard: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  transformImage: { width: '100%', height: 340 },
  simBadge: {
    position: 'absolute', bottom: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  simText: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '600' },
  transformPlaceholder: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderStyle: 'dashed' },
  transformPlaceholderInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  transformPlaceholderText: { ...FONT.body, color: COLORS.text.secondary, fontWeight: '500' },
  transformSubText: { ...FONT.small, color: COLORS.text.tertiary },
  transformLoadingRow: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  transformLoadingText: { ...FONT.small, color: COLORS.text.secondary },

  // Disclaimer
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  disclaimerText: { ...FONT.xs, color: COLORS.text.tertiary, flex: 1, lineHeight: 17 },

  // Paywall
  paywallOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', paddingHorizontal: SPACING.lg,
  },
  paywallCard: {
    backgroundColor: '#131313', borderRadius: 28,
    padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(229,192,123,0.15)', overflow: 'hidden',
  },
  paywallClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 6 },
  paywallTopGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 140,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  paywallIconWrap: { width: 72, height: 72, borderRadius: 22, overflow: 'hidden', marginBottom: 16, marginTop: 8 },
  paywallIconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  paywallTitle: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 10, textAlign: 'center' },
  paywallDesc: { ...FONT.body, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  featureGrid: { width: '100%', gap: 12, marginBottom: 28 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(229,192,123,0.08)',
    borderWidth: 1, borderColor: 'rgba(229,192,123,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { ...FONT.body, color: COLORS.text.primary },
  paywallBtnWrap: { width: '100%', borderRadius: RADIUS.lg, overflow: 'hidden' },
  paywallBtn: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  paywallBtnText: { ...FONT.h4, color: '#0A0700', fontWeight: '700' },
  paywallNote: { ...FONT.xs, color: COLORS.text.tertiary, marginTop: 14 },
});

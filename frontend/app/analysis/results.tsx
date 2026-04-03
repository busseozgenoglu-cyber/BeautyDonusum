import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../src/utils/api';

const METRIC_LABELS: Record<string, string> = {
  symmetry_score: 'Simetri', jawline_definition: 'Çene Hattı', nose_proportion: 'Burun',
  eye_spacing: 'Göz Aralığı', lip_ratio: 'Dudak', skin_quality: 'Cilt',
  cheekbone_prominence: 'Elmacık', forehead_proportion: 'Alın', chin_projection: 'Çene', overall_harmony: 'Uyum',
};

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? COLORS.status.success : pct >= 65 ? COLORS.status.warning : COLORS.status.error;
  return (
    <View style={metricStyles.row}>
      <Text style={metricStyles.label}>{label}</Text>
      <View style={metricStyles.barBg}>
        <View style={[metricStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[metricStyles.value, { color }]}>{pct}%</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 80, ...FONT.xs, color: COLORS.text.secondary },
  barBg: { flex: 1, height: 6, backgroundColor: COLORS.bg.tertiary, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  value: { width: 36, ...FONT.xs, textAlign: 'right', fontWeight: '600' },
});

function RecCard({ rec, locked }: { rec: any; locked: boolean }) {
  const prioColor = rec.priority === 'high' ? COLORS.status.error : rec.priority === 'medium' ? COLORS.status.warning : COLORS.status.success;
  return (
    <View style={[recStyles.card, locked && recStyles.locked]}>
      <View style={recStyles.header}>
        <View style={[recStyles.prioBadge, { backgroundColor: prioColor + '20' }]}>
          <View style={[recStyles.prioDot, { backgroundColor: prioColor }]} />
          <Text style={[recStyles.prioText, { color: prioColor }]}>{rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'}</Text>
        </View>
        <Text style={recStyles.area}>{rec.area}</Text>
      </View>
      <Text style={recStyles.title}>{rec.title}</Text>
      {locked ? (
        <View style={recStyles.blurOverlay}>
          <Ionicons name="lock-closed" size={20} color={COLORS.brand.primary} />
          <Text style={recStyles.lockText}>Premium ile açın</Text>
        </View>
      ) : (
        <>
          <Text style={recStyles.desc}>{rec.description}</Text>
          <Text style={recStyles.reason}>{rec.reason}</Text>
          {rec.improvement_potential != null && (
            <View style={recStyles.improvRow}>
              <Text style={recStyles.improvLabel}>İyileşme Potansiyeli:</Text>
              <Text style={recStyles.improvValue}>{Math.round(rec.improvement_potential * 100)}%</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const recStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  locked: { opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { ...FONT.xs, fontWeight: '600' },
  area: { ...FONT.xs, color: COLORS.text.tertiary },
  title: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 6 },
  desc: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 6 },
  reason: { ...FONT.xs, color: COLORS.text.tertiary, fontStyle: 'italic', marginBottom: 8 },
  improvRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  improvLabel: { ...FONT.xs, color: COLORS.text.tertiary },
  improvValue: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '700' },
  blurOverlay: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 16 },
  lockText: { ...FONT.small, color: COLORS.brand.primary },
});

export default function ResultsScreen() {
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transforming, setTransforming] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const isPremium = user?.subscription === 'premium';

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data } = await api.get(`/analysis/${analysisId}`);
        setAnalysis(data);
        if (!isPremium && !data.is_unlocked) setShowPaywall(true);
      } catch (e) { Alert.alert('Hata', 'Analiz yüklenemedi'); }
      finally { setLoading(false); }
    };
    if (analysisId) fetchAnalysis();
  }, [analysisId]);

  const handleUpgrade = async () => {
    try {
      await api.post('/subscription/activate', { plan: 'premium' });
      await refreshUser();
      setShowPaywall(false);
      Alert.alert('Premium aktifleştirildi!');
    } catch { Alert.alert('Hata'); }
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.brand.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const metrics = analysis?.metrics || {};
  const recs = analysis?.recommendations || {};
  const recList = recs.recommendations || [];
  const score = recs.overall_score || (metrics.overall_harmony * 10).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="results-back-btn" onPress={() => router.replace('/(tabs)/home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('analysisComplete')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.scoreCard}>
          <LinearGradient colors={['rgba(229,192,123,0.1)', 'rgba(229,192,123,0.02)']} style={styles.scoreGradient}>
            <Text style={styles.scoreLabel}>{t('yourScore')}</Text>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </LinearGradient>
        </Animated.View>

        {/* Category badge */}
        <View style={styles.catBadge}>
          <Ionicons name={analysis?.category === 'cerrahi' ? 'cut-outline' : 'sparkles-outline'} size={16} color={COLORS.brand.primary} />
          <Text style={styles.catText}>{analysis?.category === 'cerrahi' ? t('surgical') : t('medicalAesthetic')}</Text>
        </View>

        {/* Metrics */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Yüz Metrikleri</Text>
          <View style={styles.metricsCard}>
            {Object.entries(metrics).map(([key, val]) => (
              <MetricBar key={key} label={METRIC_LABELS[key] || key} value={val as number} />
            ))}
          </View>
        </Animated.View>

        {/* Summary */}
        {recs.summary && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.summaryCard}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.brand.primary} />
            <Text style={styles.summaryText}>{recs.summary}</Text>
          </Animated.View>
        )}

        {/* Recommendations */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recommendations')}</Text>
          {recList.map((rec: any, i: number) => (
            <RecCard key={i} rec={rec} locked={!isPremium && i > 0} />
          ))}
        </Animated.View>

        {/* Before/After Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('beforeAfter')}</Text>
          {analysis?.transformation_base64 ? (
            <View style={styles.transformCard}>
              <Image source={{ uri: `data:image/png;base64,${analysis.transformation_base64}` }} style={styles.transformImage} resizeMode="cover" />
              <View style={styles.simLabel}>
                <Ionicons name="sparkles" size={12} color={COLORS.brand.primary} />
                <Text style={styles.simText}>{t('aiSimulation')}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity testID="generate-transform-btn" onPress={handleTransform} activeOpacity={0.8} style={styles.transformPlaceholder}>
              {transforming ? (
                <View style={styles.transformLoading}>
                  <ActivityIndicator size="small" color={COLORS.brand.primary} />
                  <Text style={styles.transformLoadingText}>{t('generating')}</Text>
                </View>
              ) : (
                <>
                  <Ionicons name={isPremium ? 'image-outline' : 'lock-closed'} size={32} color={isPremium ? COLORS.brand.primary : COLORS.text.tertiary} />
                  <Text style={styles.transformPlaceholderText}>{isPremium ? 'AI Dönüşüm Oluştur' : 'Premium ile AI Dönüşüm'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.text.tertiary} />
          <Text style={styles.disclaimerText}>{t('disclaimer')}</Text>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      {showPaywall && (
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallCard}>
            <TouchableOpacity testID="close-paywall" style={styles.paywallClose} onPress={() => setShowPaywall(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <LinearGradient colors={['rgba(229,192,123,0.15)', 'transparent']} style={styles.paywallGlow} />
            <Ionicons name="diamond" size={48} color={COLORS.brand.primary} />
            <Text style={styles.paywallTitle}>{t('premiumRequired')}</Text>
            <Text style={styles.paywallDesc}>Tüm önerileri, detaylı raporu ve AI dönüşüm simülasyonunu görmek için Premium'a yükseltin.</Text>
            <View style={styles.featureList}>
              {[t('fullReport'), t('unlimitedAnalysis'), t('hdTransform'), t('saveCompare')].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.status.success} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity testID="paywall-upgrade-btn" onPress={handleUpgrade} activeOpacity={0.8}>
              <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.paywallBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.paywallBtnText}>{t('activatePremium')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.paywallNote}>App Store üzerinden ödeme yapılacaktır</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...FONT.h4, color: COLORS.text.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  scoreCard: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 16 },
  scoreGradient: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 28, gap: 4 },
  scoreLabel: { ...FONT.body, color: COLORS.text.secondary, marginRight: 12 },
  scoreValue: { fontSize: 48, fontWeight: '700', color: COLORS.brand.primary },
  scoreMax: { ...FONT.h3, color: COLORS.text.tertiary },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surface.glass, borderWidth: 1, borderColor: COLORS.surface.glassBorder, marginBottom: 24 },
  catText: { ...FONT.small, color: COLORS.brand.primary, fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 14 },
  metricsCard: { backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.surface.card, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 24, borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  summaryText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  transformCard: { borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface.card },
  transformImage: { width: '100%', height: 350, borderRadius: RADIUS.lg },
  simLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  simText: { ...FONT.xs, color: COLORS.brand.primary },
  transformPlaceholder: { height: 200, backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.surface.glassBorder, borderStyle: 'dashed' },
  transformPlaceholderText: { ...FONT.body, color: COLORS.text.secondary },
  transformLoading: { alignItems: 'center', gap: 12 },
  transformLoadingText: { ...FONT.small, color: COLORS.text.secondary },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, paddingVertical: 12 },
  disclaimerText: { ...FONT.xs, color: COLORS.text.tertiary, flex: 1, lineHeight: 16 },
  // Paywall
  paywallOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  paywallCard: { backgroundColor: COLORS.bg.secondary, borderRadius: RADIUS.xl, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  paywallClose: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  paywallGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  paywallTitle: { ...FONT.h2, color: COLORS.text.primary, marginTop: 16, marginBottom: 8 },
  paywallDesc: { ...FONT.body, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  featureList: { width: '100%', gap: 12, marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { ...FONT.body, color: COLORS.text.primary },
  paywallBtn: { borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 48 },
  paywallBtnText: { ...FONT.body, fontWeight: '700', color: COLORS.text.inverse },
  paywallNote: { ...FONT.xs, color: COLORS.text.tertiary, marginTop: 12 },
});

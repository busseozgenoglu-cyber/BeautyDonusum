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
  const color = pct >= 80 ? '#2DD4A8' : pct >= 65 ? '#F5B731' : '#F7564A';
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
  track: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { width: 38, ...FONT.xs, textAlign: 'right', fontWeight: '700' },
});

function RecCard({ rec, locked }: { rec: any; locked: boolean }) {
  const prioColor = rec.priority === 'high' ? '#F7564A' : rec.priority === 'medium' ? '#F5B731' : '#2DD4A8';
  const hasCost = rec.cost_min_tl != null && rec.cost_max_tl != null;
  return (
    <View style={[rStyles.card, locked && rStyles.locked]}>
      <View style={rStyles.header}>
        <View style={[rStyles.prioBadge, { backgroundColor: prioColor + '15' }]}>
          <View style={[rStyles.prioDot, { backgroundColor: prioColor }]} />
          <Text style={[rStyles.prioText, { color: prioColor }]}>
            {rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'}
          </Text>
        </View>
        <Text style={rStyles.area}>{rec.area}</Text>
      </View>
      <View style={rStyles.titleRow}>
        <Text style={rStyles.title}>{rec.title}</Text>
        {hasCost && (
          <View style={rStyles.costBadge}>
            <Ionicons name="cash-outline" size={12} color="#2DD4A8" />
            <Text style={rStyles.costText}>
              {(rec.cost_min_tl / 1000).toFixed(0)}K–{(rec.cost_max_tl / 1000).toFixed(0)}K ₺
            </Text>
          </View>
        )}
      </View>
      {locked ? (
        <View style={rStyles.lockRow}>
          <Ionicons name="lock-closed" size={16} color="#2DD4A8" />
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
  card: { backgroundColor: '#0C1619', borderRadius: RADIUS.lg, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  locked: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { ...FONT.xs, fontWeight: '700' },
  area: { ...FONT.xs, color: COLORS.text.tertiary },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  title: { ...FONT.h4, color: COLORS.text.primary, flex: 1 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,212,168,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(45,212,168,0.2)' },
  costText: { fontSize: 11, fontWeight: '700', color: '#2DD4A8' },
  desc: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 6 },
  reason: { ...FONT.xs, color: COLORS.text.tertiary, fontStyle: 'italic', marginBottom: 10 },
  improvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  improvLabel: { ...FONT.xs, color: COLORS.text.tertiary },
  improvVal: { ...FONT.small, color: '#2DD4A8', fontWeight: '700' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  lockText: { ...FONT.small, color: '#2DD4A8' },
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
      } catch { Alert.alert('Hata', 'Analiz yüklenemedi'); }
      finally { setLoading(false); }
    };
    if (analysisId) fetch();
  }, [analysisId]);

  useEffect(() => {
    if (!analysis) return;
    const recs = analysis.recommendations || {};
    const target = parseFloat(
      recs.overall_score != null ? recs.overall_score : ((analysis.metrics?.overall_harmony ?? 0) * 10).toFixed(1)
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
      if (e?.userCancelled) return;
      Alert.alert('Hata', e?.message || 'Satın alma tamamlanamadı.');
    } finally { setPurchasing(false); }
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
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2DD4A8" /></View>;
  }

  const metrics = analysis?.metrics || {};
  const recs = analysis?.recommendations || {};
  const recList: any[] = recs.recommendations || [];
  const isSurgical = analysis?.category === 'cerrahi';
  const accentColor = isSurgical ? '#2DD4A8' : '#F7856E';

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity testID="results-back-btn" onPress={() => router.replace('/(tabs)/home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('analysisComplete')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.scoreCardOuter}>
            <LinearGradient
              colors={[accentColor + '15', accentColor + '05', 'transparent']}
              style={styles.scoreCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreLabel}>Uyum Skoru</Text>
                  <View style={styles.scoreNumRow}>
                    <Text style={[styles.scoreNum, { color: accentColor }]}>{displayScore.toFixed(1)}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                  </View>
                </View>
                <View style={styles.scoreRing}>
                  <LinearGradient colors={isSurgical ? ['#2DD4A8', '#1A9B7A'] : ['#F7856E', '#E05A42']} style={styles.scoreRingFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.scoreRingText}>{displayScore.toFixed(1)}</Text>
                  </LinearGradient>
                </View>
              </View>
              <View style={[styles.catBadge, { borderColor: accentColor + '30', backgroundColor: accentColor + '08' }]}>
                <Ionicons name={isSurgical ? 'cut-outline' : 'sparkles-outline'} size={14} color={accentColor} />
                <Text style={[styles.catText, { color: accentColor }]}>
                  {isSurgical ? t('surgical') : t('medicalAesthetic')}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {recs.summary ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryCard}>
              <View style={styles.summaryIcon}><Ionicons name="document-text-outline" size={18} color="#2DD4A8" /></View>
              <Text style={styles.summaryText}>{recs.summary}</Text>
            </Animated.View>
          ) : null}

          {recs.face_shape ? (
            <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Yüz Şekli Analizi</Text>
              <View style={styles.faceShapeCard}>
                <View style={styles.faceShapeHeader}>
                  <LinearGradient colors={['rgba(45,212,168,0.15)', 'rgba(45,212,168,0.05)']} style={styles.faceShapeIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="scan-outline" size={22} color="#2DD4A8" />
                  </LinearGradient>
                  <View style={styles.faceShapeMeta}>
                    <Text style={styles.faceShapeName}>{recs.face_shape.charAt(0).toUpperCase() + recs.face_shape.slice(1)} Yüz</Text>
                    <Text style={styles.faceShapeDesc} numberOfLines={2}>{recs.face_shape_tips?.description}</Text>
                  </View>
                </View>
                {recs.face_shape_tips?.makeup ? (
                  <View style={styles.fsTipRow}>
                    <View style={styles.fsTipIcon}><Ionicons name="color-palette-outline" size={14} color="#2DD4A8" /></View>
                    <View style={styles.fsTipContent}>
                      <Text style={styles.fsTipLabel}>Makyaj</Text>
                      <Text style={styles.fsTipText}>{recs.face_shape_tips.makeup}</Text>
                    </View>
                  </View>
                ) : null}
                {recs.face_shape_tips?.hair ? (
                  <View style={styles.fsTipRow}>
                    <View style={styles.fsTipIcon}><Ionicons name="cut-outline" size={14} color="#2DD4A8" /></View>
                    <View style={styles.fsTipContent}>
                      <Text style={styles.fsTipLabel}>Saç</Text>
                      <Text style={styles.fsTipText}>{recs.face_shape_tips.hair}</Text>
                    </View>
                  </View>
                ) : null}
                {recs.face_shape_tips?.glasses ? (
                  <View style={styles.fsTipRow}>
                    <View style={styles.fsTipIcon}><Ionicons name="glasses-outline" size={14} color="#2DD4A8" /></View>
                    <View style={styles.fsTipContent}>
                      <Text style={styles.fsTipLabel}>Gözlük</Text>
                      <Text style={styles.fsTipText}>{recs.face_shape_tips.glasses}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Yüz Metrikleri</Text>
            <View style={styles.metricsCard}>
              {Object.entries(metrics).filter(([key]) => key !== 'face_shape').map(([key, val], i) => (
                <AnimatedMetricBar key={key} label={METRIC_LABELS[key] || key} value={val as number} delay={i * 60} />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recommendations')}</Text>
            {recList.map((rec: any, i: number) => (
              <RecCard key={i} rec={rec} locked={!isPremium && i > 0} />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('beforeAfter')}</Text>
            {analysis?.transformation_base64 ? (
              <View style={styles.transformCard}>
                <Image source={{ uri: `data:image/png;base64,${analysis.transformation_base64}` }} style={styles.transformImage} resizeMode="cover" />
                <View style={styles.simBadge}>
                  <Ionicons name="sparkles" size={11} color="#2DD4A8" />
                  <Text style={styles.simText}>{t('aiSimulation')}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity testID="generate-transform-btn" onPress={handleTransform} activeOpacity={0.85} style={styles.transformPlaceholder}>
                {transforming ? (
                  <View style={styles.transformLoadingRow}>
                    <ActivityIndicator size="small" color="#2DD4A8" />
                    <Text style={styles.transformLoadingText}>{t('generating')}</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={isPremium ? ['rgba(45,212,168,0.06)', 'rgba(45,212,168,0.02)'] : ['rgba(255,255,255,0.02)', 'transparent']}
                    style={styles.transformPlaceholderInner}
                  >
                    <Ionicons name={isPremium ? 'image-outline' : 'lock-closed'} size={36} color={isPremium ? '#2DD4A8' : COLORS.text.tertiary} />
                    <Text style={[styles.transformPlaceholderText, isPremium && { color: '#2DD4A8' }]}>
                      {isPremium ? 'AI Dönüşüm Oluştur' : 'Premium ile AI Dönüşüm'}
                    </Text>
                    {!isPremium && <Text style={styles.transformSubText}>Önce ve sonra simülasyonu</Text>}
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={13} color={COLORS.text.tertiary} />
            <Text style={styles.disclaimerText}>{t('disclaimer')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {showPaywall && (
        <View style={styles.paywallOverlay}>
          <ScrollView contentContainerStyle={styles.paywallScroll} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.paywallCard}>
              <TouchableOpacity testID="close-paywall" style={styles.paywallClose} onPress={() => router.replace('/(tabs)/home')}>
                <Ionicons name="close" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>

              <LinearGradient colors={['rgba(45,212,168,0.12)', 'rgba(45,212,168,0.03)', 'transparent']} style={styles.paywallTopGlow} />

              <View style={styles.trialBadge}>
                <LinearGradient colors={['#0A2A22', '#061A15']} style={styles.trialBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="gift-outline" size={13} color="#2DD4A8" />
                  <Text style={styles.trialBadgeText}>7 GÜN ÜCRETSİZ DENEME</Text>
                </LinearGradient>
              </View>

              <View style={styles.paywallIconWrap}>
                <LinearGradient colors={['#2DD4A8', '#1A9B7A', '#0F7A5C']} style={styles.paywallIconGrad}>
                  <Ionicons name="diamond" size={30} color="#050D0F" />
                </LinearGradient>
              </View>

              <Text style={styles.paywallTitle}>Premium'a Geç</Text>
              <Text style={styles.paywallSubtitle}>Uzman seviyesinde AI analiz</Text>
              <Text style={styles.paywallDesc}>
                Altın oran hesaplamaları, estetik uzman önerileri ve kişisel dönüşüm simülasyonuyla yüzünüzün gerçek potansiyelini keşfedin.
              </Text>

              <View style={styles.socialProof}>
                <View style={styles.socialItem}><Text style={styles.socialNum}>AI</Text><Text style={styles.socialLabel}>Destekli</Text></View>
                <View style={styles.socialDivider} />
                <View style={styles.socialItem}><Text style={styles.socialNum}>10+</Text><Text style={styles.socialLabel}>Metrik</Text></View>
                <View style={styles.socialDivider} />
                <View style={styles.socialItem}><Text style={styles.socialNum}>HD</Text><Text style={styles.socialLabel}>Simülasyon</Text></View>
              </View>

              <View style={styles.featureGrid}>
                {[
                  { icon: 'analytics-outline', title: 'Altın Oran Analizi', desc: 'Fibonacci oranlarıyla yüz geometrinizi ölçün' },
                  { icon: 'medical-outline', title: 'Uzman Tavsiyeleri', desc: 'Rinoplasti, çene kontürleme ve daha fazlası' },
                  { icon: 'sparkles-outline', title: 'AI Dönüşüm', desc: 'İşlem öncesi gerçekçi HD görüntünüzü görün' },
                  { icon: 'journal-outline', title: 'Cilt Günlüğü', desc: 'Günlük cilt takibi ve bakım rutini' },
                  { icon: 'infinite-outline', title: 'Sınırsız Analiz', desc: 'İstediğiniz kadar analiz yapın' },
                ].map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <LinearGradient colors={['rgba(45,212,168,0.08)', 'rgba(45,212,168,0.02)']} style={styles.featureIconBox}>
                      <Ionicons name={f.icon as any} size={18} color="#2DD4A8" />
                    </LinearGradient>
                    <View style={styles.featureTextWrap}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color="#2DD4A8" />
                  </View>
                ))}
              </View>

              <View style={styles.pricingBox}>
                <LinearGradient colors={['rgba(45,212,168,0.06)', 'rgba(45,212,168,0.02)']} style={styles.pricingGrad}>
                  <View style={styles.pricingRow}>
                    <View>
                      <Text style={styles.pricingFree}>İlk 7 gün ücretsiz</Text>
                      <Text style={styles.pricingAfter}>Sonrasında aylık ₺599</Text>
                    </View>
                    <Text style={styles.pricingNow}>₺599/ay</Text>
                  </View>
                </LinearGradient>
              </View>

              <TouchableOpacity testID="paywall-upgrade-btn" onPress={handleUpgrade} activeOpacity={0.88} style={styles.paywallBtnWrap} disabled={purchasing}>
                <LinearGradient colors={['#2DD4A8', '#1A9B7A', '#0F7A5C']} style={styles.paywallBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {purchasing ? <ActivityIndicator size="small" color="#050D0F" /> : (
                    <>
                      <Ionicons name="diamond" size={18} color="#050D0F" />
                      <Text style={styles.paywallBtnText}>7 Gün Ücretsiz Başla</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.paywallNote}>İstediğiniz zaman iptal edebilirsiniz · App Store üzerinden ödeme</Text>

              {__DEV__ && (
                <TouchableOpacity
                  onPress={async () => { await api.post('/subscription/activate', { plan: 'premium' }); setShowPaywall(false); }}
                  style={styles.devBypass}
                >
                  <Text style={styles.devBypassText}>TEST: Paywallı Geç</Text>
                </TouchableOpacity>
              )}

              <View style={styles.trustRow}>
                <View style={styles.trustItem}><Ionicons name="shield-checkmark-outline" size={14} color={COLORS.text.tertiary} /><Text style={styles.trustText}>Güvenli ödeme</Text></View>
                <View style={styles.trustItem}><Ionicons name="lock-closed-outline" size={14} color={COLORS.text.tertiary} /><Text style={styles.trustText}>Veriler şifreli</Text></View>
                <View style={styles.trustItem}><Ionicons name="refresh-outline" size={14} color={COLORS.text.tertiary} /><Text style={styles.trustText}>Kolay iptal</Text></View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  loadingContainer: { flex: 1, backgroundColor: '#050D0F', alignItems: 'center', justifyContent: 'center' },
  glowTop: { position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(45,212,168,0.04)' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTitle: { ...FONT.h4, color: COLORS.text.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 48 },

  scoreCardOuter: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(45,212,168,0.1)' },
  scoreCard: { padding: 24 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scoreLabel: { ...FONT.small, color: COLORS.text.secondary, marginBottom: 4 },
  scoreNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNum: { fontSize: 52, fontWeight: '800', lineHeight: 58 },
  scoreMax: { ...FONT.h3, color: COLORS.text.tertiary },
  scoreRing: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  scoreRingFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreRingText: { fontSize: 22, fontWeight: '800', color: '#050D0F' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  catText: { ...FONT.xs, fontWeight: '600' },

  summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#0C1619', borderRadius: RADIUS.lg, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  summaryIcon: { marginTop: 1 },
  summaryText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 22 },

  section: { marginBottom: 28 },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 14 },
  metricsCard: { backgroundColor: '#0C1619', borderRadius: RADIUS.xl, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  faceShapeCard: { backgroundColor: '#0C1619', borderRadius: RADIUS.lg, padding: 18, borderWidth: 1, borderColor: 'rgba(45,212,168,0.12)' },
  faceShapeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  faceShapeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  faceShapeMeta: { flex: 1 },
  faceShapeName: { fontSize: 17, fontWeight: '700', color: '#2DD4A8', marginBottom: 4 },
  faceShapeDesc: { fontSize: 12, color: COLORS.text.secondary, lineHeight: 18 },
  fsTipRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  fsTipIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(45,212,168,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  fsTipContent: { flex: 1 },
  fsTipLabel: { fontSize: 11, fontWeight: '700', color: '#2DD4A8', letterSpacing: 0.5, marginBottom: 3 },
  fsTipText: { fontSize: 12, color: COLORS.text.secondary, lineHeight: 18 },

  transformCard: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  transformImage: { width: '100%', height: 340 },
  simBadge: { position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  simText: { ...FONT.xs, color: '#2DD4A8', fontWeight: '600' },
  transformPlaceholder: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  transformPlaceholderInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  transformPlaceholderText: { ...FONT.body, color: COLORS.text.secondary, fontWeight: '500' },
  transformSubText: { ...FONT.small, color: COLORS.text.tertiary },
  transformLoadingRow: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  transformLoadingText: { ...FONT.small, color: COLORS.text.secondary },

  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  disclaimerText: { ...FONT.xs, color: COLORS.text.tertiary, flex: 1, lineHeight: 17 },

  paywallOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  paywallScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  paywallCard: { backgroundColor: '#0C1619', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(45,212,168,0.15)', overflow: 'hidden' },
  paywallClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20 },
  paywallTopGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  trialBadge: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, marginTop: 10 },
  trialBadgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(45,212,168,0.25)' },
  trialBadgeText: { fontSize: 11, fontWeight: '800', color: '#2DD4A8', letterSpacing: 1.2 },
  paywallIconWrap: { width: 68, height: 68, borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  paywallIconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  paywallTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4, textAlign: 'center', letterSpacing: -0.5 },
  paywallSubtitle: { ...FONT.small, color: '#2DD4A8', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  paywallDesc: { ...FONT.small, color: COLORS.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 18, paddingHorizontal: 8 },
  socialProof: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  socialItem: { flex: 1, alignItems: 'center' },
  socialNum: { fontSize: 17, fontWeight: '800', color: '#2DD4A8' },
  socialLabel: { ...FONT.xs, color: COLORS.text.tertiary, marginTop: 2 },
  socialDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.06)' },
  featureGrid: { width: '100%', gap: 10, marginBottom: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  featureIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(45,212,168,0.12)' },
  featureTextWrap: { flex: 1 },
  featureTitle: { ...FONT.small, color: COLORS.text.primary, fontWeight: '600' },
  featureDesc: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 1, lineHeight: 15 },
  pricingBox: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(45,212,168,0.15)' },
  pricingGrad: { paddingVertical: 14, paddingHorizontal: 18 },
  pricingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pricingFree: { ...FONT.small, color: '#2DD4A8', fontWeight: '700' },
  pricingAfter: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 2 },
  pricingNow: { fontSize: 22, fontWeight: '800', color: '#2DD4A8' },
  paywallBtnWrap: { width: '100%', borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 12 },
  paywallBtn: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  paywallBtnText: { fontSize: 17, color: '#050D0F', fontWeight: '800', letterSpacing: -0.2 },
  paywallNote: { ...FONT.xs, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: COLORS.text.tertiary },
  devBypass: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, backgroundColor: 'rgba(255,100,100,0.08)', borderWidth: 1, borderColor: 'rgba(255,100,100,0.2)' },
  devBypassText: { fontSize: 12, color: '#FF6464', fontWeight: '700' },
});

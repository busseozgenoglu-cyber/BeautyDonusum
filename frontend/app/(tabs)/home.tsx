import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

const DAILY_TIPS = [
  { icon: 'water-outline', tip: 'Günde en az 2 litre su içmek cilt elastikiyetini artırır ve kırışıklıkları geciktirir.', category: 'Cilt Bakımı' },
  { icon: 'sunny-outline', tip: 'SPF 50 güneş kremi kullanımı, erken yaşlanmanın %80\'ini önleyebilir.', category: 'Koruma' },
  { icon: 'moon-outline', tip: 'Gece serumu uygulayarak cildinizin yenilenme sürecini destekleyin.', category: 'Gece Bakımı' },
  { icon: 'nutrition-outline', tip: 'C vitamini içeren gıdalar kolajen üretimini artırarak cildi sıkılaştırır.', category: 'Beslenme' },
  { icon: 'fitness-outline', tip: 'Düzenli egzersiz kan dolaşımını artırarak cilde doğal bir parlaklık verir.', category: 'Yaşam Tarzı' },
];

function PulsingDot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new RNAnimated.Value(0.3)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 1200, delay, useNativeDriver: true }),
        RNAnimated.timing(anim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <RNAnimated.View style={[s.pulsingDot, { backgroundColor: color, opacity: anim }]} />;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);
  const [tipIndex] = useState(() => Math.floor(Math.random() * DAILY_TIPS.length));
  const tip = DAILY_TIPS[tipIndex];

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
            <View>
              <Text style={s.greeting}>{getGreeting()}</Text>
              <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <Animated.View entering={ZoomIn.delay(300)}>
              <TouchableOpacity
                style={[s.badge, user?.subscription === 'premium' && s.badgePremium]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'sparkles-outline'} size={14} color={user?.subscription === 'premium' ? '#F59E0B' : COLORS.brand.primary} />
                <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                  {user?.subscription === 'premium' ? 'Premium' : t('free')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Daily Tip Card */}
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <View style={s.tipCard}>
              <LinearGradient colors={['#EEF2FF', '#F0FDFA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={s.tipHeader}>
                <View style={s.tipIconBox}>
                  <Ionicons name={tip.icon as any} size={20} color={COLORS.brand.primary} />
                </View>
                <View style={s.tipMeta}>
                  <Text style={s.tipLabel}>{t('dailyTip')}</Text>
                  <Text style={s.tipCategory}>{tip.category}</Text>
                </View>
                <PulsingDot delay={0} color={COLORS.brand.accent} />
              </View>
              <Text style={s.tipText}>{tip.tip}</Text>
            </View>
          </Animated.View>

          {/* Hero Scanner */}
          <Animated.View entering={FadeInDown.delay(160).duration(600)} style={s.heroCard}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={s.heroContent}>
              <View style={s.heroLeft}>
                <Text style={s.heroTitle}>AI Yüz Analizi</Text>
                <Text style={s.heroSub}>Yüz hatlarınızı analiz edin, kişisel estetik yol haritanızı keşfedin</Text>
                <View style={s.heroBadgeRow}>
                  {['10+ Metrik', 'Yüz Şekli', 'Fiyat Aralığı'].map((b, i) => (
                    <View key={i} style={s.heroBadge}>
                      <Text style={s.heroBadgeTxt}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={s.heroIconWrap}>
                <Ionicons name="scan-outline" size={48} color="rgba(255,255,255,0.25)" />
              </View>
            </View>
          </Animated.View>

          {/* Analysis Type Section */}
          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={s.sectionRow}>
            <Text style={s.sectionLabel}>{t('selectCategory')}</Text>
          </Animated.View>

          {/* Surgical Card */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
              <View style={[s.card, selected === 'cerrahi' && s.cardSelBlue]}>
                <View style={s.cardIconBox}>
                  <LinearGradient colors={selected === 'cerrahi' ? ['#3B82F6', '#2563EB'] : ['#EEF2FF', '#E0E7FF']} style={s.cardIconGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="cut-outline" size={24} color={selected === 'cerrahi' ? '#FFF' : COLORS.brand.primary} />
                  </LinearGradient>
                </View>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{t('surgical')}</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkBlue}><Ionicons name="checkmark" size={14} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Rinoplasti, mentoplasti, blefaroplasti ve daha fazlası</Text>
                  <View style={s.tags}>
                    {['Rinoplasti', 'Mentoplasti', 'Blefaroplasti'].map(tag => (
                      <View key={tag} style={s.tag}><Text style={s.tagTxt}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Medical Card */}
          <Animated.View entering={FadeInDown.delay(360).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('medikal')}>
              <View style={[s.card, selected === 'medikal' && s.cardSelPurple]}>
                <View style={s.cardIconBox}>
                  <LinearGradient colors={selected === 'medikal' ? ['#8B5CF6', '#7C3AED'] : ['#F5F3FF', '#EDE9FE']} style={s.cardIconGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="sparkles-outline" size={24} color={selected === 'medikal' ? '#FFF' : COLORS.brand.secondary} />
                  </LinearGradient>
                </View>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{t('medicalAesthetic')}</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkPurple}><Ionicons name="checkmark" size={14} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Botoks, dolgu, lazer tedaviler ve ameliyatsız işlemler</Text>
                  <View style={s.tags}>
                    {['Botoks', 'Dolgu', 'Lazer'].map(tag => (
                      <View key={tag} style={[s.tag, s.tagPurple]}><Text style={[s.tagTxt, s.tagTxtPurple]}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Start Button */}
          {selected ? (
            <Animated.View entering={FadeIn.duration(350)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                  colors={selected === 'cerrahi' ? ['#3B82F6', '#2563EB'] : ['#8B5CF6', '#7C3AED']}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="scan-outline" size={22} color="#fff" />
                  <Text style={s.startTxt}>{t('startAnalysis')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(440)} style={s.hint}>
              <Ionicons name="hand-left-outline" size={16} color={COLORS.text.tertiary} />
              <Text style={s.hintTxt}>Yukarıdan analiz türü seçin</Text>
            </Animated.View>
          )}

          {/* Quick Stats */}
          {(user?.analyses_count ?? 0) > 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={s.quickStats}>
              <View style={s.quickStatItem}>
                <Text style={s.quickStatNum}>{user?.analyses_count || 0}</Text>
                <Text style={s.quickStatLabel}>{t('totalAnalyses')}</Text>
              </View>
              <View style={s.quickStatDivider} />
              <View style={s.quickStatItem}>
                <Text style={s.quickStatNum}>{user?.subscription === 'premium' ? 'Aktif' : 'Standart'}</Text>
                <Text style={s.quickStatLabel}>{t('subscription')}</Text>
              </View>
            </Animated.View>
          )}

          {/* Disclaimer */}
          <Animated.View entering={FadeInDown.delay(560)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.text.tertiary} />
            <Text style={s.discTxt}>{t('disclaimer')}</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 13, color: COLORS.text.tertiary, marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#DBEAFE' },
  badgePremium: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.brand.primary },
  badgeTxtPremium: { color: '#D97706' },

  tipCard: { borderRadius: 20, padding: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E0E7FF' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 12, ...SHADOWS.soft },
  tipMeta: { flex: 1 },
  tipLabel: { fontSize: 13, fontWeight: '700', color: COLORS.brand.primary },
  tipCategory: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 1 },
  tipText: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 21 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4 },

  heroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, ...SHADOWS.glow },
  heroContent: { flexDirection: 'row', padding: 24 },
  heroLeft: { flex: 1, marginRight: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 8 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19, marginBottom: 14 },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  heroBadgeTxt: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  heroIconWrap: { justifyContent: 'center', alignItems: 'center', width: 80 },

  sectionRow: { marginBottom: 14 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },

  card: { borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', ...SHADOWS.soft },
  cardSelBlue: { borderColor: '#93C5FD', backgroundColor: '#F0F7FF' },
  cardSelPurple: { borderColor: '#C4B5FD', backgroundColor: '#F5F3FF' },
  cardIconBox: { marginRight: 14 },
  cardIconGrad: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  checkBlue: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.primary, alignItems: 'center', justifyContent: 'center' },
  checkPurple: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.secondary, alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 10, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: '#EEF2FF' },
  tagTxt: { fontSize: 10, fontWeight: '600', color: COLORS.brand.primary },
  tagPurple: { backgroundColor: '#F5F3FF' },
  tagTxtPurple: { color: COLORS.brand.secondary },

  startWrap: { marginTop: 4, marginBottom: 6 },
  startBtn: { borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  startTxt: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6, paddingVertical: 18, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  hintTxt: { fontSize: 14, color: COLORS.text.tertiary },

  quickStats: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatNum: { fontSize: 20, fontWeight: '800', color: COLORS.brand.primary, marginBottom: 2 },
  quickStatLabel: { fontSize: 11, color: COLORS.text.tertiary },
  quickStatDivider: { width: 1, backgroundColor: '#E2E8F0' },

  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  discTxt: { fontSize: 11, color: COLORS.text.tertiary, flex: 1, lineHeight: 17 },
});

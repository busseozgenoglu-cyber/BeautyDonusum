import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn, SlideInRight } from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  return (
    <View style={s.root}>
      {/* Rich layered background */}
      <LinearGradient
        colors={['#0D0A06', '#0A0A0C', '#080810']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      {/* Gold bloom — top right */}
      <View style={s.bloomGold} />
      {/* Rose bloom — bottom left */}
      <View style={s.bloomRose} />
      {/* Center subtle glow */}
      <View style={s.bloomCenter} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
            <View>
              <Text style={s.hi}>Hoş Geldiniz 👋</Text>
              <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <Animated.View entering={ZoomIn.delay(300)}>
              <LinearGradient
                colors={user?.subscription === 'premium' ? ['rgba(229,192,123,0.25)', 'rgba(229,192,123,0.1)'] : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
                style={s.badge}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'person-circle-outline'} size={14} color={user?.subscription === 'premium' ? '#E5C07B' : COLORS.text.tertiary} />
                <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                  {user?.subscription === 'premium' ? 'Premium' : 'Ücretsiz'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* ── Hero Card ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)}>
            <LinearGradient
              colors={['#1C1200', '#130D00', '#0A0800']}
              style={s.hero}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {/* Top gold glow inside card */}
              <View style={s.heroInnerGlow} />

              <View style={s.heroPill}>
                <View style={s.heroPillDot} />
                <Text style={s.heroPillTxt}>AI Destekli Analiz</Text>
              </View>

              <Text style={s.heroTitle}>{'Güzelliğini\nKeşfet'}</Text>
              <Text style={s.heroSub}>Yüzünü tara, kişiselleştirilmiş{'\n'}öneriler al</Text>

              <View style={s.heroDivider} />

              <View style={s.stats}>
                <View style={s.stat}>
                  <Text style={s.statVal}>10+</Text>
                  <Text style={s.statLbl}>Metrik</Text>
                </View>
                <View style={s.statSep} />
                <View style={s.stat}>
                  <Text style={s.statVal}>AI</Text>
                  <Text style={s.statLbl}>Destekli</Text>
                </View>
                <View style={s.statSep} />
                <View style={s.stat}>
                  <Text style={s.statVal}>{user?.analyses_count ?? 0}</Text>
                  <Text style={s.statLbl}>Analizin</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Section label ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={s.secRow}>
            <Text style={s.secLabel}>KATEGORİ SEÇ</Text>
            <View style={s.secLine} />
          </Animated.View>

          {/* ── Surgical Card ── */}
          <Animated.View entering={SlideInRight.delay(260).duration(500)}>
            <TouchableOpacity testID="category-cerrahi" activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
              <LinearGradient
                colors={selected === 'cerrahi' ? ['#1E1500', '#150F00', '#0D0900'] : ['#111111', '#0D0D0D']}
                style={[s.card, selected === 'cerrahi' && s.cardSelGold]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <LinearGradient colors={['rgba(229,192,123,0.25)', 'rgba(229,192,123,0.08)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="cut-outline" size={28} color="#E5C07B" />
                </LinearGradient>

                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Cerrahi</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkGold}>
                        <Ionicons name="checkmark" size={13} color="#000" />
                      </View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Ameliyat gerektiren estetik işlemler</Text>
                  <View style={s.tags}>
                    {['Rinoplasti', 'Çene', 'Göz Kapağı'].map(t => (
                      <View key={t} style={s.tagGold}><Text style={s.tagTxtGold}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Medical Card ── */}
          <Animated.View entering={SlideInRight.delay(340).duration(500)}>
            <TouchableOpacity testID="category-medikal" activeOpacity={0.88} onPress={() => setSelected('medikal')}>
              <LinearGradient
                colors={selected === 'medikal' ? ['#1A0010', '#120009', '#0A0006'] : ['#111111', '#0D0D0D']}
                style={[s.card, selected === 'medikal' && s.cardSelRose]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <LinearGradient colors={['rgba(183,110,121,0.3)', 'rgba(183,110,121,0.1)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="sparkles-outline" size={28} color="#B76E79" />
                </LinearGradient>

                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Medikal Estetik</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkRose}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Ameliyatsız güzellik işlemleri</Text>
                  <View style={s.tags}>
                    {['Botoks', 'Dolgu', 'Lazer'].map(t => (
                      <View key={t} style={s.tagRose}><Text style={s.tagTxtRose}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Start button ── */}
          {selected ? (
            <Animated.View entering={FadeIn.duration(350)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F5E0A0', '#E5C07B', '#C9963A']}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="scan-outline" size={22} color="#0A0700" />
                  <Text style={s.startTxt}>Analizi Başlat</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0A0700" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(420)} style={s.hint}>
              <Ionicons name="finger-print-outline" size={20} color={COLORS.text.tertiary} />
              <Text style={s.hintTxt}>Devam etmek için bir kategori seçin</Text>
            </Animated.View>
          )}

          {/* ── Disclaimer ── */}
          <Animated.View entering={FadeInDown.delay(520)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.text.tertiary} />
            <Text style={s.discTxt}>{t('disclaimer')}</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },

  /* Blooms */
  bloomGold: {
    position: 'absolute', top: -80, right: -80,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: '#E5C07B', opacity: 0.18,
  },
  bloomRose: {
    position: 'absolute', bottom: 60, left: -100,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#B76E79', opacity: 0.14,
  },
  bloomCenter: {
    position: 'absolute', top: '40%', alignSelf: 'center',
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#E5C07B', opacity: 0.04,
  },

  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  hi: { fontSize: 13, color: COLORS.text.tertiary, marginBottom: 2 },
  name: { fontSize: 26, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(229,192,123,0.2)',
  },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.text.tertiary },
  badgeTxtPremium: { color: '#E5C07B' },

  /* Hero */
  hero: {
    borderRadius: 24, padding: 26, marginBottom: 32,
    borderWidth: 1, borderColor: 'rgba(229,192,123,0.3)',
    overflow: 'hidden',
  },
  heroInnerGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#E5C07B', opacity: 0.12,
  },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 18 },
  heroPillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5C07B' },
  heroPillTxt: { fontSize: 12, fontWeight: '700', color: '#E5C07B', letterSpacing: 0.4 },
  heroTitle: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', lineHeight: 46, letterSpacing: -1, marginBottom: 10 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 23, marginBottom: 24 },
  heroDivider: { height: 1, backgroundColor: 'rgba(229,192,123,0.15)', marginBottom: 20 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#E5C07B' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  /* Section */
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  secLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
  secLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },

  /* Cards */
  card: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSelGold: { borderColor: 'rgba(229,192,123,0.5)' },
  cardSelRose: { borderColor: 'rgba(183,110,121,0.5)' },
  iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  checkGold: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5C07B', alignItems: 'center', justifyContent: 'center' },
  checkRose: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#B76E79', alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagGold: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(229,192,123,0.15)', borderWidth: 1, borderColor: 'rgba(229,192,123,0.3)' },
  tagTxtGold: { fontSize: 11, fontWeight: '600', color: '#E5C07B' },
  tagRose: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(183,110,121,0.15)', borderWidth: 1, borderColor: 'rgba(183,110,121,0.3)' },
  tagTxtRose: { fontSize: 11, fontWeight: '600', color: '#B76E79' },

  /* Start */
  startWrap: { marginTop: 8, marginBottom: 6 },
  startBtn: { borderRadius: 18, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startTxt: { fontSize: 17, fontWeight: '800', color: '#0A0700', letterSpacing: 0.2 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, paddingVertical: 20, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', borderStyle: 'dashed' },
  hintTxt: { fontSize: 15, color: COLORS.text.tertiary },

  /* Disclaimer */
  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 28, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  discTxt: { fontSize: 11, color: COLORS.text.tertiary, flex: 1, lineHeight: 18 },
});

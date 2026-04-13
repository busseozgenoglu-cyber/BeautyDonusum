import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';

function ClinicalSeal() {
  return (
    <View style={seal.wrap}>
      <LinearGradient colors={[...COLORS.gradient.teal]} style={seal.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={seal.inner}>
          <Ionicons name="medical-outline" size={34} color={COLORS.brand.primary} />
        </View>
      </LinearGradient>
      <View style={[seal.corner, seal.cTL]} />
      <View style={[seal.corner, seal.cTR]} />
      <View style={[seal.corner, seal.cBL]} />
      <View style={[seal.corner, seal.cBR]} />
    </View>
  );
}

const seal = StyleSheet.create({
  wrap: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 112, height: 112, borderRadius: 56, padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  inner: {
    flex: 1, width: '100%', height: '100%', borderRadius: 53,
    backgroundColor: COLORS.surface.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border.subtle,
  },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: COLORS.brand.secondary },
  cTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 },
  cTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  cBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  cBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  const heroBadges =
    lang === 'en'
      ? ['10+ metrics', 'Face shape', 'TL price bands']
      : ['10+ Metrik', 'Yüz şekli', 'TL fiyat bantları'];

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#F8FAFB', '#EEF3F4', '#F4F6F8']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={s.blobTeal} />
      <View style={s.blobNavy} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(480)} style={s.header}>
            <View>
              <Text style={s.hi}>{lang === 'en' ? 'Hello' : 'Merhaba'}</Text>
              <Text style={s.name}>{user?.name || (lang === 'en' ? 'Guest' : 'Kullanıcı')}</Text>
            </View>
            <Animated.View entering={ZoomIn.delay(280)}>
              <View
                style={[
                  s.badge,
                  user?.subscription === 'premium' && s.badgePremium,
                ]}
              >
                <Ionicons
                  name={user?.subscription === 'premium' ? 'ribbon' : 'leaf-outline'}
                  size={14}
                  color={user?.subscription === 'premium' ? COLORS.brand.secondary : COLORS.brand.primary}
                />
                <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                  {user?.subscription === 'premium' ? t('premium') : t('free')}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(520)} style={s.heroWrap}>
            <Image source={require('../../assets/images/hero-bg.png')} style={s.heroBg} />
            <LinearGradient
              colors={['rgba(248,250,251,0.2)', 'rgba(244,246,248,0.92)', '#F4F6F8']}
              style={s.heroGrad}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <ClinicalSeal />
            <View style={s.heroText}>
              <Text style={s.heroKicker}>VISAGE Clinic Anteprima</Text>
              <Text style={s.heroTitle}>{lang === 'en' ? 'Pre-clinic face analysis' : 'Klinik öncesi yüz analizi'}</Text>
              <Text style={s.heroSub}>{t('tagline')}</Text>
            </View>
            <View style={s.heroBadges}>
              {heroBadges.map((b, i) => (
                <View key={i} style={s.pill}>
                  <View style={s.pillDot} />
                  <Text style={s.pillTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={s.secRow}>
            <View style={s.secLine} />
            <Text style={s.secLabel}>{lang === 'en' ? 'ANALYSIS PATH' : 'ANALİZ YOLU'}</Text>
            <View style={s.secLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(480)}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setSelected('cerrahi')} testID="home-card-surgical">
              <View style={[s.card, selected === 'cerrahi' && s.cardSelTeal]}>
                <LinearGradient
                  colors={['rgba(13,92,94,0.14)', 'rgba(13,92,94,0.04)']}
                  style={s.iconBox}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="cut-outline" size={26} color={COLORS.brand.primary} />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{t('surgical')}</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkTeal}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>{t('surgicalDesc')}</Text>
                  <View style={s.tags}>
                    {['Rinoplasti', 'Mentoplasti', 'Blefaroplasti'].map((tag) => (
                      <View key={tag} style={s.tagTeal}><Text style={s.tagTealTxt}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(480)}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setSelected('medikal')} testID="home-card-medical">
              <View style={[s.card, selected === 'medikal' && s.cardSelNavy]}>
                <LinearGradient
                  colors={['rgba(30,58,95,0.14)', 'rgba(30,58,95,0.04)']}
                  style={s.iconBox}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="sparkles-outline" size={26} color={COLORS.brand.accent} />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{t('medicalAesthetic')}</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkNavy}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>{t('medicalDesc')}</Text>
                  <View style={s.tags}>
                    {['Botoks', 'Dolgu', 'Lazer'].map((tag) => (
                      <View key={tag} style={s.tagNavy}><Text style={s.tagNavyTxt}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {selected ? (
            <Animated.View entering={FadeIn.duration(320)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.88}>
                <LinearGradient
                  colors={selected === 'cerrahi' ? [...COLORS.gradient.teal] : [...COLORS.gradient.navy]}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera-outline" size={22} color="#fff" />
                  <Text style={s.startTxt}>{t('startAnalysis')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(380)} style={s.hint}>
              <Ionicons name="hand-left-outline" size={18} color={COLORS.text.tertiary} />
              <Text style={s.hintTxt}>{t('selectCategory')}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(440)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.brand.primary} />
            <Text style={s.discTxt}>{t('disclaimer')}</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  blobTeal: { position: 'absolute', top: -60, left: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(13,92,94,0.07)' },
  blobNavy: { position: 'absolute', bottom: 120, right: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(30,58,95,0.06)' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 8, paddingBottom: 64 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  hi: { fontSize: 13, color: COLORS.text.tertiary, marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card,
  },
  badgePremium: { borderColor: COLORS.brand.secondary, backgroundColor: 'rgba(201,162,39,0.08)' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.brand.primary },
  badgeTxtPremium: { color: COLORS.brand.secondary },

  heroWrap: {
    alignItems: 'center', paddingVertical: 22, marginBottom: 22,
    borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border.subtle, backgroundColor: COLORS.surface.card, ...SHADOWS.card,
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.35 },
  heroGrad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { alignItems: 'center', marginTop: 12, marginBottom: 14 },
  heroKicker: { fontSize: 10, fontWeight: '800', color: COLORS.brand.primary, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.4, textAlign: 'center' },
  heroSub: { fontSize: 13, color: COLORS.text.secondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 12 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bg.primary, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border.subtle,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.brand.primary },
  pillTxt: { fontSize: 11, color: COLORS.text.secondary, fontWeight: '600' },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  secLabel: { fontSize: 10, fontWeight: '800', color: COLORS.text.tertiary, letterSpacing: 2 },
  secLine: { flex: 1, height: 1, backgroundColor: COLORS.border.subtle },

  card: {
    borderRadius: RADIUS.lg, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border.subtle, backgroundColor: COLORS.surface.card, ...SHADOWS.card,
  },
  cardSelTeal: { borderColor: COLORS.brand.primary, borderWidth: 1.5 },
  cardSelNavy: { borderColor: COLORS.brand.accent, borderWidth: 1.5 },
  iconBox: { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  checkTeal: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.primary, alignItems: 'center', justifyContent: 'center' },
  checkNavy: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.accent, alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 10, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagTeal: { borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(13,92,94,0.08)', borderWidth: 1, borderColor: 'rgba(13,92,94,0.2)' },
  tagTealTxt: { fontSize: 10, fontWeight: '600', color: COLORS.brand.primary },
  tagNavy: { borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(30,58,95,0.08)', borderWidth: 1, borderColor: 'rgba(30,58,95,0.2)' },
  tagNavyTxt: { fontSize: 10, fontWeight: '600', color: COLORS.brand.accent },

  startWrap: { marginTop: 6, marginBottom: 4 },
  startBtn: { borderRadius: RADIUS.lg, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...SHADOWS.soft },
  startTxt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  hint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
    paddingVertical: 18, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border.subtle, borderStyle: 'dashed',
    backgroundColor: COLORS.surface.card,
  },
  hintTxt: { fontSize: 14, color: COLORS.text.tertiary },

  disc: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 22,
    backgroundColor: 'rgba(13,92,94,0.06)', borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border.strong,
  },
  discTxt: { fontSize: 11, color: COLORS.text.secondary, flex: 1, lineHeight: 17 },
});

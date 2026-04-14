import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated as RNAnimated, Image, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { AetherScreen } from '../../src/components/AetherScreen';
import { getHomeCompact, setHomeCompact } from '../../src/utils/preferences';

const TIPS = [
  'Net, önden ışık alan bir selfie en doğru metrikleri verir.',
  'Gözlük ve şapka analizi zorlaştırır; mümkünse çıkarın.',
  'Premium ile AI önce/sonra simülasyonunu otomatik oluşturabilirsiniz.',
];

function FaceMesh({ compact }: { compact: boolean }) {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  const rotate = useRef(new RNAnimated.Value(0)).current;
  const scale = compact ? 0.78 : 1;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1.05, duration: 1600, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
    RNAnimated.loop(RNAnimated.timing(rotate, { toValue: 1, duration: 14000, useNativeDriver: true })).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const wrapSize = 180 * scale;
  const ring1 = 160 * scale;
  const ring2 = 120 * scale;
  const core = 80 * scale;
  const r1 = 78 * scale;
  const r2 = 55 * scale;
  const center = 75 * scale;
  const c2 = 55 * scale;

  return (
    <View style={[fmS.wrap, { width: wrapSize, height: wrapSize }]}>
      <RNAnimated.View style={[fmS.ring, { width: ring1, height: ring1, borderRadius: ring1 / 2, transform: [{ rotate: spin }] }]}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <View
            key={a}
            style={[
              fmS.ringDot,
              {
                width: 8 * scale,
                height: 8 * scale,
                borderRadius: 4 * scale,
                top: center - r1 * Math.sin((a * Math.PI) / 180) - 4 * scale,
                left: center - r1 * Math.cos((a * Math.PI) / 180) - 4 * scale,
              },
            ]}
          />
        ))}
      </RNAnimated.View>
      <RNAnimated.View style={[fmS.ring, { width: ring2, height: ring2, borderRadius: ring2 / 2, transform: [{ rotate: spin }, { scaleX: -1 }] }]}>
        {[30, 90, 150, 210, 270, 330].map((a) => (
          <View
            key={a}
            style={[
              fmS.ringDot2,
              {
                width: 6 * scale,
                height: 6 * scale,
                borderRadius: 3 * scale,
                top: c2 - r2 * Math.sin((a * Math.PI) / 180) - 3 * scale,
                left: c2 - r2 * Math.cos((a * Math.PI) / 180) - 3 * scale,
              },
            ]}
          />
        ))}
      </RNAnimated.View>
      <RNAnimated.View style={[{ width: core, height: core, borderRadius: core / 2, overflow: 'hidden', ...SHADOWS.glow }, { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={[...COLORS.gradient.beam]} style={fmS.coreGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="scan-outline" size={36 * scale} color="rgba(2,6,10,0.92)" />
        </LinearGradient>
      </RNAnimated.View>
      <View style={[fmS.bracket, fmS.bTL, { width: 20 * scale, height: 20 * scale }]} />
      <View style={[fmS.bracket, fmS.bTR, { width: 20 * scale, height: 20 * scale }]} />
      <View style={[fmS.bracket, fmS.bBL, { width: 20 * scale, height: 20 * scale }]} />
      <View style={[fmS.bracket, fmS.bBR, { width: 20 * scale, height: 20 * scale }]} />
    </View>
  );
}

const fmS = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)', borderStyle: 'dashed' },
  ringDot: { position: 'absolute', backgroundColor: COLORS.brand.primary },
  ringDot2: { position: 'absolute', backgroundColor: COLORS.brand.secondary },
  coreGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bracket: { position: 'absolute', borderColor: COLORS.brand.primary },
  bTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  bTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  bBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  bBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);
  const [compact, setCompact] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getHomeCompact().then(setCompact);
    }, []),
  );

  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 6500);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  const toggleCompact = async (v: boolean) => {
    setCompact(v);
    await setHomeCompact(v);
  };

  return (
    <AetherScreen>
      <View style={s.root}>
        <SafeAreaView style={s.safe}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(480)} style={s.header}>
              <View style={{ flex: 1 }}>
                <View style={s.velumPill}>
                  <Text style={s.velumPillTxt}>VELUM</Text>
                </View>
                <Text style={s.hi}>Merhaba</Text>
                <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
              </View>
              <Animated.View entering={ZoomIn.delay(280)}>
                <LinearGradient
                  colors={
                    user?.subscription === 'premium'
                      ? ['rgba(45,212,191,0.35)', 'rgba(20,184,166,0.12)']
                      : ['rgba(148,163,184,0.2)', 'rgba(51,65,85,0.12)']
                  }
                  style={s.badge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={user?.subscription === 'premium' ? 'diamond' : 'sparkles-outline'}
                    size={14}
                    color={user?.subscription === 'premium' ? COLORS.text.inverse : COLORS.text.secondary}
                  />
                  <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                    {user?.subscription === 'premium' ? 'Premium' : 'Ücretsiz'}
                  </Text>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).duration(420)} style={s.quickRow}>
              <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.85}>
                <Ionicons name="compass" size={20} color={COLORS.brand.primary} />
                <Text style={s.quickTxt}>Rehber</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/history')} activeOpacity={0.85}>
                <Ionicons name="time" size={20} color={COLORS.brand.primary} />
                <Text style={s.quickTxt}>Geçmiş</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
                <Ionicons name="person" size={20} color={COLORS.brand.primary} />
                <Text style={s.quickTxt}>Profil</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.tipCard}>
              <Ionicons name="bulb-outline" size={18} color={COLORS.brand.secondary} />
              <Text style={s.tipText}>{TIPS[tipIndex]}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(520)} style={[s.heroWrap, compact && s.heroWrapCompact]}>
              <Image source={require('../../assets/images/hero-bg.png')} style={s.heroBgImage} blurRadius={3} />
              <LinearGradient
                colors={['rgba(6,16,24,0.25)', 'rgba(4,11,18,0.82)', 'rgba(2,6,10,0.96)']}
                style={s.heroGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
              <FaceMesh compact={compact} />
              <View style={s.heroText}>
                <Text style={s.heroTitle}>AI yüz analizi</Text>
                <Text style={s.heroSub}>Metrikler · yüz şekli · TL fiyat bandı</Text>
              </View>
              <View style={s.heroBadgeRow}>
                {['10+ metrik', 'Simülasyon', 'Keşfet'].map((b, i) => (
                  <View key={i} style={s.heroBadge}>
                    <View style={s.heroBadgeDot} />
                    <Text style={s.heroBadgeTxt}>{b}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.compactRow}>
              <Text style={s.compactLabel}>Kompakt ana sayfa</Text>
              <Switch value={compact} onValueChange={toggleCompact} trackColor={{ false: '#334155', true: 'rgba(45,212,191,0.45)' }} thumbColor={compact ? COLORS.brand.primary : '#94a3b8'} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(400)} style={s.secRow}>
              <View style={s.secLine} />
              <Text style={s.secLabel}>ANALİZ</Text>
              <View style={s.secLine} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(280).duration(480)}>
              <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
                <View style={[s.card, selected === 'cerrahi' && s.cardSelA]}>
                  {selected === 'cerrahi' && (
                    <LinearGradient colors={['rgba(45,212,191,0.12)', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.lg }]} />
                  )}
                  <LinearGradient colors={['rgba(45,212,191,0.25)', 'rgba(20,184,166,0.08)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="cut-outline" size={26} color={COLORS.text.inverse} />
                  </LinearGradient>
                  <View style={s.cardBody}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.cardTitle}>Cerrahi</Text>
                      {selected === 'cerrahi' && (
                        <View style={s.check}>
                          <Ionicons name="checkmark" size={12} color={COLORS.text.inverse} />
                        </View>
                      )}
                    </View>
                    <Text style={s.cardDesc}>Rinoplasti, çene, göz kapağı…</Text>
                    <View style={s.tags}>
                      {['Rino', 'Çene', 'Göz'].map((t) => (
                        <View key={t} style={s.tagA}>
                          <Text style={s.tagTxtA}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(340).duration(480)}>
              <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('medikal')}>
                <View style={[s.card, selected === 'medikal' && s.cardSelB]}>
                  {selected === 'medikal' && (
                    <LinearGradient colors={['rgba(52,211,153,0.12)', 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.lg }]} />
                  )}
                  <LinearGradient colors={['rgba(52,211,153,0.3)', 'rgba(5,150,105,0.12)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="sparkles-outline" size={26} color={COLORS.text.inverse} />
                  </LinearGradient>
                  <View style={s.cardBody}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.cardTitle}>Medikal</Text>
                      {selected === 'medikal' && (
                        <View style={[s.check, s.checkB]}>
                          <Ionicons name="checkmark" size={12} color={COLORS.text.inverse} />
                        </View>
                      )}
                    </View>
                    <Text style={s.cardDesc}>Botoks, dolgu, lazer…</Text>
                    <View style={s.tags}>
                      {['Botoks', 'Dolgu', 'Lazer'].map((t) => (
                        <View key={t} style={s.tagB}>
                          <Text style={s.tagTxtB}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {selected ? (
              <Animated.View entering={FadeIn.duration(320)} style={s.startWrap}>
                <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.88}>
                  <LinearGradient colors={[...COLORS.gradient.beam]} style={s.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="scan-outline" size={22} color={COLORS.text.inverse} />
                    <Text style={s.startTxt}>Analizi başlat</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.text.inverse} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.delay(400)} style={s.hint}>
                <Ionicons name="finger-print-outline" size={18} color={COLORS.text.tertiary} />
                <Text style={s.hintTxt}>Önce bir kategori seçin</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(460)} style={s.disc}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.brand.secondary} />
              <Text style={s.discTxt}>Tıbbi tavsiye değildir. Sonuçlar simülasyondur; uzmana danışın.</Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </AetherScreen>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 6, paddingBottom: 72 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  velumPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.surface.glassBorder, marginBottom: 8, backgroundColor: COLORS.surface.glass },
  velumPillTxt: { fontSize: 9, fontFamily: 'Outfit_700Bold', color: COLORS.brand.secondary, letterSpacing: 1.8 },
  hi: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: COLORS.text.secondary, marginBottom: 2 },
  name: { fontSize: 28, fontFamily: 'CormorantGaramond_700Bold', color: COLORS.text.primary, letterSpacing: -0.2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  badgeTxt: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: COLORS.text.secondary },
  badgeTxtPremium: { color: COLORS.text.inverse },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    backgroundColor: 'rgba(15,23,42,0.45)',
    gap: 4,
  },
  quickTxt: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: COLORS.text.secondary },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.15)',
    backgroundColor: 'rgba(45,212,191,0.06)',
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Outfit_400Regular', color: COLORS.text.secondary, lineHeight: 19 },

  heroWrap: { alignItems: 'center', paddingVertical: 22, marginBottom: 12, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  heroWrapCompact: { paddingVertical: 12 },
  heroBgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontFamily: 'CormorantGaramond_700Bold', color: COLORS.text.primary },
  heroSub: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: COLORS.text.secondary, marginTop: 4 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface.glass, paddingHorizontal: 11, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  heroBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.brand.primary },
  heroBadgeTxt: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: COLORS.brand.secondary },

  compactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4 },
  compactLabel: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: COLORS.text.secondary },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  secLabel: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: COLORS.text.tertiary, letterSpacing: 2 },
  secLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLORS.surface.glassBorder },

  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    backgroundColor: COLORS.surface.card,
    overflow: 'hidden',
  },
  cardSelA: { borderColor: 'rgba(45,212,191,0.55)' },
  cardSelB: { borderColor: 'rgba(52,211,153,0.5)' },
  iconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', color: COLORS.text.primary },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.primary, alignItems: 'center', justifyContent: 'center' },
  checkB: { backgroundColor: '#059669' },
  cardDesc: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: COLORS.text.secondary, marginBottom: 8, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagA: { borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(45,212,191,0.12)', borderWidth: 1, borderColor: 'rgba(45,212,191,0.25)' },
  tagTxtA: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: COLORS.brand.secondary },
  tagB: { borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.28)' },
  tagTxtB: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: '#6EE7B7' },

  startWrap: { marginTop: 6, marginBottom: 6 },
  startBtn: { borderRadius: RADIUS.lg, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startTxt: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: COLORS.text.inverse },

  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, paddingVertical: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.surface.glassBorder, borderStyle: 'dashed' },
  hintTxt: { fontSize: 14, fontFamily: 'Outfit_500Medium', color: COLORS.text.tertiary },

  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 20, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surface.glassBorder, backgroundColor: 'rgba(15,23,42,0.5)' },
  discTxt: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: COLORS.text.tertiary, flex: 1, lineHeight: 17 },
});

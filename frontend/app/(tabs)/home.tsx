import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated as RNAnimated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { AetherScreen } from '../../src/components/AetherScreen';

function FaceMesh() {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  const rotate = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.timing(rotate, { toValue: 1, duration: 12000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={fmS.wrap}>
      {/* Outer ring */}
      <RNAnimated.View style={[fmS.ring, fmS.ring1, { transform: [{ rotate: spin }] }]}>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <View key={a} style={[fmS.ringDot, {
            top: 75 - 78 * Math.sin((a * Math.PI) / 180) - 4,
            left: 75 - 78 * Math.cos((a * Math.PI) / 180) - 4,
          }]} />
        ))}
      </RNAnimated.View>
      {/* Middle ring */}
      <RNAnimated.View style={[fmS.ring, fmS.ring2, { transform: [{ rotate: spin }, { scaleX: -1 }] }]}>
        {[30, 90, 150, 210, 270, 330].map(a => (
          <View key={a} style={[fmS.ringDot2, {
            top: 55 - 55 * Math.sin((a * Math.PI) / 180) - 3,
            left: 55 - 55 * Math.cos((a * Math.PI) / 180) - 3,
          }]} />
        ))}
      </RNAnimated.View>
      {/* Core */}
      <RNAnimated.View style={[fmS.core, { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={[...COLORS.gradient.rose]} style={fmS.coreGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="scan-outline" size={36} color="rgba(255,255,255,0.95)" />
        </LinearGradient>
      </RNAnimated.View>
      {/* Corner brackets */}
      <View style={[fmS.bracket, fmS.bTL]} />
      <View style={[fmS.bracket, fmS.bTR]} />
      <View style={[fmS.bracket, fmS.bBL]} />
      <View style={[fmS.bracket, fmS.bBR]} />
    </View>
  );
}

const fmS = StyleSheet.create({
  wrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 150 },
  ring1: { width: 160, height: 160, borderWidth: 1, borderColor: 'rgba(229,192,123,0.35)', borderStyle: 'dashed' },
  ring2: { width: 120, height: 120, borderWidth: 1, borderColor: 'rgba(183,110,121,0.45)', borderStyle: 'dashed' },
  ringDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brand.primary },
  ringDot2: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent.roseLight },
  core: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', ...SHADOWS.glowRose },
  coreGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bracket: { position: 'absolute', width: 20, height: 20, borderColor: '#E5C07B' },
  bTL: { top: 10, left: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 },
  bTR: { top: 10, right: 10, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 },
  bBL: { bottom: 10, left: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 },
  bBR: { bottom: 10, right: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  return (
    <AetherScreen>
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
            <View>
              <Text style={s.hi}>Merhaba 👋</Text>
              <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <Animated.View entering={ZoomIn.delay(300)}>
              <LinearGradient
                colors={user?.subscription === 'premium'
                  ? ['rgba(229,192,123,0.22)', 'rgba(229,192,123,0.08)']
                  : ['rgba(183,110,121,0.18)', 'rgba(183,110,121,0.06)']}
                style={s.badge}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'sparkles-outline'} size={13} color={user?.subscription === 'premium' ? COLORS.brand.primary : COLORS.accent.roseLight} />
                <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                  {user?.subscription === 'premium' ? 'Premium' : 'Ücretsiz'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          {/* Hero — Face mesh scanner */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={s.heroWrap}>
            <Image source={require('../../assets/images/hero-bg.png')} style={s.heroBgImage} blurRadius={2} />
            <LinearGradient
              colors={['rgba(12,10,8,0.35)', 'rgba(8,6,10,0.72)', 'rgba(5,5,8,0.96)']}
              style={s.heroGradient}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <FaceMesh />
            <View style={s.heroText}>
              <Text style={s.heroTitle}>AI Yüz Analizi</Text>
              <Text style={s.heroSub}>Estetik potansiyelini keşfet</Text>
            </View>
            <View style={s.heroBadgeRow}>
              {['10+ Metrik', 'Yüz Şekli', 'TL Fiyatlar'].map((b, i) => (
                <View key={i} style={s.heroBadge}>
                  <View style={s.heroBadgeDot} />
                  <Text style={s.heroBadgeTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Section label */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.secRow}>
            <View style={s.secLine} />
            <Text style={s.secLabel}>ANALİZ TÜRÜ</Text>
            <View style={s.secLine} />
          </Animated.View>

          {/* Surgical card */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
              <View style={[s.card, selected === 'cerrahi' && s.cardSelGold]}>
                {selected === 'cerrahi' && (
                  <LinearGradient colors={['rgba(229,192,123,0.12)', 'rgba(229,192,123,0.04)']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                )}
                <LinearGradient colors={['rgba(229,192,123,0.2)', 'rgba(229,192,123,0.06)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="cut-outline" size={26} color="#E5C07B" />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Cerrahi Analiz</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkGold}><Ionicons name="checkmark" size={12} color="#000" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Rinoplasti, çene, göz kapağı ve daha fazlası</Text>
                  <View style={s.tags}>
                    {['Rinoplasti', 'Mentoplasti', 'Blefaroplasti'].map(t => (
                      <View key={t} style={s.tagGold}><Text style={s.tagTxtGold}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Medical card */}
          <Animated.View entering={FadeInDown.delay(320).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('medikal')}>
              <View style={[s.card, selected === 'medikal' && s.cardSelPurple]}>
                {selected === 'medikal' && (
                  <LinearGradient colors={['rgba(183,110,121,0.14)', 'rgba(183,110,121,0.04)']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                )}
                <LinearGradient colors={['rgba(183,110,121,0.28)', 'rgba(201,168,108,0.1)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="sparkles-outline" size={26} color={COLORS.accent.roseLight} />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Medikal Estetik</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkPurple}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Ameliyatsız botoks, dolgu ve lazer tedavileri</Text>
                  <View style={s.tags}>
                    {['Botoks', 'Dolgu', 'Lazer'].map(t => (
                      <View key={t} style={s.tagPurple}><Text style={s.tagTxtPurple}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Start button */}
          {selected ? (
            <Animated.View entering={FadeIn.duration(350)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                  colors={selected === 'cerrahi' ? [...COLORS.gradient.gold] : [...COLORS.gradient.rose]}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="scan-outline" size={22} color={selected === 'cerrahi' ? COLORS.text.inverse : '#fff'} />
                  <Text style={[s.startTxt, selected === 'medikal' && s.startTxtOnRose]}>Analizi Başlat</Text>
                  <Ionicons name="arrow-forward" size={20} color={selected === 'cerrahi' ? COLORS.text.inverse : '#fff'} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(400)} style={s.hint}>
              <Ionicons name="finger-print-outline" size={18} color="rgba(229,192,123,0.45)" />
              <Text style={s.hintTxt}>Analiz türü seçin</Text>
            </Animated.View>
          )}

          {/* Disclaimer */}
          <Animated.View entering={FadeInDown.delay(480)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(183,110,121,0.55)" />
            <Text style={s.discTxt}>Bu uygulama tıbbi tavsiye niteliği taşımaz. Bir estetik uzmanına danışmanız önerilir.</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  hi: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: 'rgba(229,192,123,0.65)', marginBottom: 2 },
  name: { fontSize: 26, fontFamily: 'CormorantGaramond_700Bold', color: '#FFFFFF', letterSpacing: -0.2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(183,110,121,0.28)' },
  badgeTxt: { fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: COLORS.accent.roseLight },
  badgeTxtPremium: { color: '#E5C07B' },

  heroWrap: { alignItems: 'center', paddingVertical: 24, marginBottom: 24, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(229,192,123,0.22)' },
  heroBgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  heroTitle: { fontSize: 26, fontFamily: 'CormorantGaramond_700Bold', color: '#FFFFFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: 'rgba(229,192,123,0.75)', marginTop: 4 },
  heroBadgeRow: { flexDirection: 'row', gap: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,192,123,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(229,192,123,0.22)' },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.brand.primary },
  heroBadgeTxt: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: COLORS.brand.primary },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  secLabel: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: 'rgba(229,192,123,0.45)', letterSpacing: 2.2 },
  secLine: { flex: 1, height: 1, backgroundColor: 'rgba(229,192,123,0.12)' },

  card: { borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
  cardSelGold: { borderColor: 'rgba(229,192,123,0.45)' },
  cardSelPurple: { borderColor: 'rgba(183,110,121,0.5)' },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontFamily: 'Outfit_600SemiBold', color: '#FFFFFF' },
  checkGold: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E5C07B', alignItems: 'center', justifyContent: 'center' },
  checkPurple: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.brand.secondary, alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.42)', marginBottom: 10, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagGold: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(229,192,123,0.12)', borderWidth: 1, borderColor: 'rgba(229,192,123,0.25)' },
  tagTxtGold: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: '#E5C07B' },
  tagPurple: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(183,110,121,0.14)', borderWidth: 1, borderColor: 'rgba(183,110,121,0.32)' },
  tagTxtPurple: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', color: COLORS.accent.roseLight },

  startWrap: { marginTop: 8, marginBottom: 6 },
  startBtn: { borderRadius: 18, paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startTxt: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: COLORS.text.inverse, letterSpacing: 0.2 },
  startTxtOnRose: { color: '#FFFFFF' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, paddingVertical: 18, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(229,192,123,0.18)', borderStyle: 'dashed' },
  hintTxt: { fontSize: 14, fontFamily: 'Outfit_500Medium', color: 'rgba(229,192,123,0.5)' },

  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24, backgroundColor: 'rgba(183,110,121,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(183,110,121,0.14)' },
  discTxt: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: 'rgba(201,168,108,0.55)', flex: 1, lineHeight: 17 },
});

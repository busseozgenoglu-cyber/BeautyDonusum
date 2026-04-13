import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

const DAILY_TIPS = [
  { icon: 'water-outline', tip: 'Günde en az 2 litre su içerek cildinizi içeriden nemlendirin.', color: '#3AAFFF' },
  { icon: 'sunny-outline', tip: 'SPF 50 güneş kremi kullanmayı unutmayın, bulutlu havalarda bile.', color: '#F5B731' },
  { icon: 'moon-outline', tip: 'Gece bakım rutininiz cilt yenilenmesi için kritik öneme sahiptir.', color: '#A78BFA' },
  { icon: 'nutrition-outline', tip: 'Antioksidan zengin besinler cilt sağlığını destekler.', color: '#2DD4A8' },
  { icon: 'fitness-outline', tip: 'Düzenli egzersiz kan dolaşımını artırarak cilde canlılık katar.', color: '#F7856E' },
];

function ScannerVisual() {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  const rotate = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    RNAnimated.loop(
      RNAnimated.timing(rotate, { toValue: 1, duration: 15000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={vizS.wrap}>
      <RNAnimated.View style={[vizS.outerRing, { transform: [{ rotate: spin }] }]}>
        {[0, 72, 144, 216, 288].map(a => (
          <View key={a} style={[vizS.nodeDot, {
            top: 65 - 68 * Math.sin((a * Math.PI) / 180) - 5,
            left: 65 - 68 * Math.cos((a * Math.PI) / 180) - 5,
          }]} />
        ))}
      </RNAnimated.View>

      <RNAnimated.View style={[vizS.core, { transform: [{ scale: pulse }] }]}>
        <LinearGradient colors={['#2DD4A8', '#1A9B7A', '#0F7A5C']} style={vizS.coreGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="scan-outline" size={32} color="rgba(240,246,244,0.9)" />
        </LinearGradient>
      </RNAnimated.View>

      <View style={[vizS.corner, vizS.cTL]} />
      <View style={[vizS.corner, vizS.cTR]} />
      <View style={[vizS.corner, vizS.cBL]} />
      <View style={[vizS.corner, vizS.cBR]} />
    </View>
  );
}

const vizS = StyleSheet.create({
  wrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(45,212,168,0.25)', borderStyle: 'dashed' },
  nodeDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#2DD4A8' },
  core: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', shadowColor: '#2DD4A8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  coreGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: '#F7856E' },
  cTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 5 },
  cTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 5 },
  cBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 5 },
  cBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 5 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);
  const [tipIndex] = useState(Math.floor(Math.random() * DAILY_TIPS.length));
  const tip = DAILY_TIPS[tipIndex];

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  const isPremium = user?.subscription === 'premium';

  return (
    <View style={s.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={s.orbTeal} />
      <View style={s.orbCoral} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
            <View>
              <Text style={s.greeting}>Merhaba</Text>
              <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <Animated.View entering={ZoomIn.delay(300)}>
              <LinearGradient
                colors={isPremium ? ['rgba(45,212,168,0.2)', 'rgba(45,212,168,0.06)'] : ['rgba(247,133,110,0.12)', 'rgba(247,133,110,0.04)']}
                style={s.badge}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name={isPremium ? 'diamond' : 'leaf-outline'} size={13} color={isPremium ? '#2DD4A8' : '#F7856E'} />
                <Text style={[s.badgeTxt, isPremium && s.badgePremium]}>
                  {isPremium ? 'Premium' : 'Ücretsiz'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.tipCard}>
            <LinearGradient colors={['rgba(45,212,168,0.06)', 'rgba(45,212,168,0.02)']} style={StyleSheet.absoluteFill} borderRadius={20} />
            <View style={[s.tipIconBox, { backgroundColor: tip.color + '18' }]}>
              <Ionicons name={tip.icon as any} size={20} color={tip.color} />
            </View>
            <View style={s.tipContent}>
              <Text style={s.tipLabel}>{t('dailyTip')}</Text>
              <Text style={s.tipText}>{tip.tip}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(600)} style={s.heroWrap}>
            <LinearGradient
              colors={['rgba(45,212,168,0.08)', 'rgba(5,13,15,0.95)']}
              style={s.heroGradient}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <ScannerVisual />
            <View style={s.heroText}>
              <Text style={s.heroTitle}>AI Yüz Analizi</Text>
              <Text style={s.heroSub}>Estetik potansiyelinizi keşfedin</Text>
            </View>
            <View style={s.heroBadgeRow}>
              {['10+ Metrik', 'Yüz Şekli', 'Fiyat Rehberi'].map((b, i) => (
                <View key={i} style={s.heroBadge}>
                  <View style={[s.heroBadgeDot, { backgroundColor: i === 1 ? '#F7856E' : '#2DD4A8' }]} />
                  <Text style={s.heroBadgeTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).duration(400)} style={s.secRow}>
            <View style={s.secLine} />
            <Text style={s.secLabel}>ANALİZ TÜRÜ</Text>
            <View style={s.secLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(340).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
              <View style={[s.card, selected === 'cerrahi' && s.cardSelTeal]}>
                {selected === 'cerrahi' && (
                  <LinearGradient colors={['rgba(45,212,168,0.08)', 'rgba(45,212,168,0.02)']} style={StyleSheet.absoluteFill} borderRadius={22} />
                )}
                <LinearGradient colors={['rgba(45,212,168,0.18)', 'rgba(45,212,168,0.05)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="cut-outline" size={26} color="#2DD4A8" />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Cerrahi Analiz</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkTeal}><Ionicons name="checkmark" size={12} color="#050D0F" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Rinoplasti, çene, göz kapağı ve daha fazlası</Text>
                  <View style={s.tags}>
                    {['Rinoplasti', 'Mentoplasti', 'Blefaroplasti'].map(tag => (
                      <View key={tag} style={s.tagTeal}><Text style={s.tagTxtTeal}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('medikal')}>
              <View style={[s.card, selected === 'medikal' && s.cardSelCoral]}>
                {selected === 'medikal' && (
                  <LinearGradient colors={['rgba(247,133,110,0.08)', 'rgba(247,133,110,0.02)']} style={StyleSheet.absoluteFill} borderRadius={22} />
                )}
                <LinearGradient colors={['rgba(247,133,110,0.2)', 'rgba(247,133,110,0.06)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="sparkles-outline" size={26} color="#F7856E" />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Medikal Estetik</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkCoral}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Ameliyatsız botoks, dolgu ve lazer tedavileri</Text>
                  <View style={s.tags}>
                    {['Botoks', 'Dolgu', 'Lazer'].map(tag => (
                      <View key={tag} style={s.tagCoral}><Text style={s.tagTxtCoral}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {selected ? (
            <Animated.View entering={FadeIn.duration(350)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                  colors={selected === 'cerrahi' ? ['#2DD4A8', '#1A9B7A'] : ['#F7856E', '#E05A42']}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="scan-outline" size={22} color="#050D0F" />
                  <Text style={s.startTxt}>Analizi Başlat</Text>
                  <Ionicons name="arrow-forward" size={20} color="#050D0F" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(480)} style={s.hint}>
              <Ionicons name="finger-print-outline" size={18} color="rgba(45,212,168,0.4)" />
              <Text style={s.hintTxt}>Analiz türü seçin</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(540)} style={s.quickActions}>
            <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/journal')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(247,133,110,0.1)', 'rgba(247,133,110,0.03)']} style={s.quickBtnGrad}>
                <Ionicons name="journal-outline" size={22} color="#F7856E" />
                <Text style={s.quickBtnTxt}>Cilt Günlüğü</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/discover')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(45,212,168,0.1)', 'rgba(45,212,168,0.03)']} style={s.quickBtnGrad}>
                <Ionicons name="compass-outline" size={22} color="#2DD4A8" />
                <Text style={s.quickBtnTxt}>Prosedür Rehberi</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(45,212,168,0.4)" />
            <Text style={s.discTxt}>{t('disclaimer')}</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  orbTeal: { position: 'absolute', top: -100, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#2DD4A8', opacity: 0.05 },
  orbCoral: { position: 'absolute', bottom: 60, right: -100, width: 260, height: 260, borderRadius: 130, backgroundColor: '#F7856E', opacity: 0.04 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: '#8BA5A0', marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '800', color: '#F0F6F4', letterSpacing: -0.3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(45,212,168,0.15)' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#F7856E' },
  badgePremium: { color: '#2DD4A8' },

  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(45,212,168,0.1)', overflow: 'hidden' },
  tipIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipLabel: { fontSize: 11, fontWeight: '700', color: '#2DD4A8', letterSpacing: 0.5, marginBottom: 4 },
  tipText: { fontSize: 13, color: '#8BA5A0', lineHeight: 19 },

  heroWrap: { alignItems: 'center', paddingVertical: 28, marginBottom: 24, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(45,212,168,0.15)', backgroundColor: 'rgba(45,212,168,0.02)' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#F0F6F4', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: '#8BA5A0', marginTop: 4 },
  heroBadgeRow: { flexDirection: 'row', gap: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(45,212,168,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(45,212,168,0.15)' },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeTxt: { fontSize: 11, color: '#8BA5A0', fontWeight: '600' },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  secLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(45,212,168,0.5)', letterSpacing: 2 },
  secLine: { flex: 1, height: 1, backgroundColor: 'rgba(45,212,168,0.1)' },

  card: { borderRadius: 22, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden' },
  cardSelTeal: { borderColor: 'rgba(45,212,168,0.35)' },
  cardSelCoral: { borderColor: 'rgba(247,133,110,0.35)' },
  iconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0F6F4' },
  checkTeal: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2DD4A8', alignItems: 'center', justifyContent: 'center' },
  checkCoral: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F7856E', alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 12, color: '#5A7A74', marginBottom: 10, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagTeal: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(45,212,168,0.08)', borderWidth: 1, borderColor: 'rgba(45,212,168,0.2)' },
  tagTxtTeal: { fontSize: 10, fontWeight: '600', color: '#2DD4A8' },
  tagCoral: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(247,133,110,0.08)', borderWidth: 1, borderColor: 'rgba(247,133,110,0.2)' },
  tagTxtCoral: { fontSize: 10, fontWeight: '600', color: '#F7856E' },

  startWrap: { marginTop: 8, marginBottom: 6 },
  startBtn: { borderRadius: 20, paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startTxt: { fontSize: 17, fontWeight: '800', color: '#050D0F', letterSpacing: 0.2 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, paddingVertical: 18, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(45,212,168,0.1)', borderStyle: 'dashed' },
  hintTxt: { fontSize: 14, color: 'rgba(45,212,168,0.4)' },

  quickActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  quickBtn: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickBtnGrad: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  quickBtnTxt: { fontSize: 12, fontWeight: '600', color: '#8BA5A0' },

  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24, backgroundColor: 'rgba(45,212,168,0.03)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(45,212,168,0.08)' },
  discTxt: { fontSize: 11, color: 'rgba(139,165,160,0.6)', flex: 1, lineHeight: 17 },
});

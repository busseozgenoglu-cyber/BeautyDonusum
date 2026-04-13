import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal' | null>(null);

  const plans = useMemo(() => {
    return [
      {
        id: 'natural-plan',
        title: 'Journey Plan',
        desc: 'Yapay zeka + günlük check-in ile kişisel bakım yol haritası',
        icon: 'map-outline' as const,
        onPress: () => router.push('/(tabs)/journey'),
      },
      {
        id: 'analysis-plan',
        title: 'AI Face Scan',
        desc: 'Cerrahi ve medikal seçenekler için ayrıntılı analiz',
        icon: 'scan-outline' as const,
        onPress: () => router.push('/(tabs)/discover'),
      },
    ];
  }, [router]);

  const handleStart = () => {
    if (!selected) return;
    router.push({ pathname: '/analysis/camera', params: { category: selected } });
  };

  return (
    <View style={s.root}>
      {/* Unique purple-to-black gradient background */}
      <LinearGradient
        colors={['#071019', '#0A0E12', '#09090C']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={s.bloomBlue} />
      <View style={s.bloomMint} />
      <View style={s.bloomAmber} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
            <View>
              <Text style={s.hi}>Merhaba</Text>
              <Text style={s.name}>{user?.name || 'Kullanıcı'}</Text>
            </View>
            <Animated.View entering={FadeInDown.delay(120)}>
              <LinearGradient
                colors={user?.subscription === 'premium'
                  ? ['rgba(251,191,36,0.22)', 'rgba(251,191,36,0.08)']
                  : ['rgba(125,211,252,0.18)', 'rgba(125,211,252,0.06)']}
                style={s.badge}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name={user?.subscription === 'premium' ? 'diamond' : 'sparkles-outline'} size={13} color={user?.subscription === 'premium' ? '#FBBF24' : '#7DD3FC'} />
                <Text style={[s.badgeTxt, user?.subscription === 'premium' && s.badgeTxtPremium]}>
                  {user?.subscription === 'premium' ? 'Premium' : 'Ücretsiz'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={s.heroWrap}>
            <LinearGradient
              colors={['rgba(4,18,28,0.2)', 'rgba(6,16,24,0.65)', 'rgba(4,8,12,0.95)']}
              style={s.heroGradient}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            />
            <View style={s.heroIcon}>
              <Ionicons name="compass-outline" size={42} color="#7DD3FC" />
            </View>
            <View style={s.heroText}>
              <Text style={s.heroTitle}>Kişisel Estetik Yol Haritası</Text>
              <Text style={s.heroSub}>Sadece analiz değil, günlük takip + konsültasyon hazırlığı</Text>
            </View>
            <View style={s.heroBadgeRow}>
              {['Journey Lab', 'AI Face Scan', 'Soru Üretici'].map((b, i) => (
                <View key={i} style={s.heroBadge}>
                  <View style={s.heroBadgeDot} />
                  <Text style={s.heroBadgeTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.sectionBlock}>
            <Text style={s.sectionTitle}>Bugün ne yapmak istersin?</Text>
            {plans.map((plan) => (
              <TouchableOpacity key={plan.id} style={s.planCard} activeOpacity={0.85} onPress={plan.onPress}>
                <LinearGradient colors={['rgba(125,211,252,0.16)', 'rgba(125,211,252,0.05)']} style={s.planIcon}>
                  <Ionicons name={plan.icon} size={20} color="#7DD3FC" />
                </LinearGradient>
                <View style={s.planBody}>
                  <Text style={s.planTitle}>{plan.title}</Text>
                  <Text style={s.planDesc}>{plan.desc}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.secRow}>
            <View style={s.secLine} />
            <Text style={s.secLabel}>HIZLI AI ANALİZ</Text>
            <View style={s.secLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('cerrahi')}>
              <View style={[s.card, selected === 'cerrahi' && s.cardSelGold]}>
                {selected === 'cerrahi' && (
                  <LinearGradient colors={['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.05)']} style={StyleSheet.absoluteFill} borderRadius={20} />
                )}
                <LinearGradient colors={['rgba(251,191,36,0.25)', 'rgba(251,191,36,0.08)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="flask-outline" size={24} color="#FBBF24" />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Cerrahi Opsiyon Simülasyonu</Text>
                    {selected === 'cerrahi' && (
                      <View style={s.checkGold}><Ionicons name="checkmark" size={12} color="#000" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Aday prosedürler, potansiyel fayda ve risk düzeyi karşılaştırması</Text>
                  <View style={s.tags}>
                    {['Risk Profili', 'Süre Tahmini', 'Maliyet Aralığı'].map(t => (
                      <View key={t} style={s.tagGold}><Text style={s.tagTxtGold}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(500)}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setSelected('medikal')}>
              <View style={[s.card, selected === 'medikal' && s.cardSelPurple]}>
                {selected === 'medikal' && (
                  <LinearGradient colors={['rgba(125,211,252,0.14)', 'rgba(125,211,252,0.05)']} style={StyleSheet.absoluteFill} borderRadius={20} />
                )}
                <LinearGradient colors={['rgba(125,211,252,0.22)', 'rgba(125,211,252,0.08)']} style={s.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="sparkles-outline" size={24} color="#7DD3FC" />
                </LinearGradient>
                <View style={s.cardBody}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>Medikal Bakım Simülasyonu</Text>
                    {selected === 'medikal' && (
                      <View style={s.checkPurple}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                    )}
                  </View>
                  <Text style={s.cardDesc}>Daha doğal görünüm için kademeli medikal yaklaşım önerileri</Text>
                  <View style={s.tags}>
                    {['Minimal Müdahale', 'İyileşme Notu', 'Kişisel Plan'].map(t => (
                      <View key={t} style={s.tagPurple}><Text style={s.tagTxtPurple}>{t}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {selected ? (
            <Animated.View entering={FadeInDown.duration(350)} style={s.startWrap}>
              <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.85}>
                <LinearGradient
                  colors={selected === 'cerrahi' ? ['#FCD34D', '#F59E0B', '#D97706'] : ['#7DD3FC', '#38BDF8', '#0284C7']}
                  style={s.startBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="scan-outline" size={22} color="#fff" />
                  <Text style={s.startTxt}>Analizi Başlat</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(400)} style={s.hint}>
              <Ionicons name="finger-print-outline" size={18} color="rgba(125,211,252,0.5)" />
              <Text style={s.hintTxt}>Analiz türü seçin</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(480)} style={s.disc}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(125,211,252,0.6)" />
            <Text style={s.discTxt}>Bu uygulama tanı/tedavi amacı taşımaz. Konsültasyon öncesi hazırlık ve kişisel takip için tasarlanmıştır.</Text>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05080B' },
  bloomBlue: { position: 'absolute', top: -100, left: -80, width: 340, height: 340, borderRadius: 170, backgroundColor: '#0EA5E9', opacity: 0.12 },
  bloomMint: { position: 'absolute', bottom: 40, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#10B981', opacity: 0.1 },
  bloomAmber: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#F59E0B', opacity: 0.07 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  hi: { fontSize: 13, color: 'rgba(125,211,252,0.7)', marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(125,211,252,0.25)' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#7DD3FC' },
  badgeTxtPremium: { color: '#FBBF24' },

  heroWrap: { alignItems: 'center', paddingVertical: 24, marginBottom: 24, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(125,211,252,0.32)' },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.5)',
    backgroundColor: 'rgba(125,211,252,0.1)',
  },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroText: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, textAlign: 'center' },
  heroSub: { fontSize: 13, color: 'rgba(125,211,252,0.8)', marginTop: 4, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 14 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(125,211,252,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(125,211,252,0.25)' },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7DD3FC' },
  heroBadgeTxt: { fontSize: 11, color: '#7DD3FC', fontWeight: '600' },

  sectionBlock: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.23)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 10,
  },
  planIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  planBody: { flex: 1 },
  planTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  planDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2, lineHeight: 17 },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  secLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(125,211,252,0.5)', letterSpacing: 2 },
  secLine: { flex: 1, height: 1, backgroundColor: 'rgba(125,211,252,0.15)' },

  card: { borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
  cardSelGold: { borderColor: 'rgba(251,191,36,0.45)' },
  cardSelPurple: { borderColor: 'rgba(125,211,252,0.55)' },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  checkGold: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center' },
  checkPurple: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagGold: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(251,191,36,0.14)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.32)' },
  tagTxtGold: { fontSize: 10, fontWeight: '600', color: '#FBBF24' },
  tagPurple: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(125,211,252,0.17)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.34)' },
  tagTxtPurple: { fontSize: 10, fontWeight: '600', color: '#7DD3FC' },

  startWrap: { marginTop: 8, marginBottom: 6 },
  startBtn: { borderRadius: 18, paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  startTxt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, paddingVertical: 18, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(125,211,252,0.17)', borderStyle: 'dashed' },
  hintTxt: { fontSize: 14, color: 'rgba(125,211,252,0.5)' },

  disc: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24, backgroundColor: 'rgba(125,211,252,0.05)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(125,211,252,0.14)' },
  discTxt: { fontSize: 11, color: 'rgba(125,211,252,0.55)', flex: 1, lineHeight: 17 },
});

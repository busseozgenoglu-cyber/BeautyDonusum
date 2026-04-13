import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { useLang } from '../../src/context/LanguageContext';
import api from '../../src/utils/api';

type Procedure = {
  id: string;
  title: string;
  category: 'cerrahi' | 'medikal';
  icon: string;
  description: string;
  duration_min: number;
  duration_max: number;
  recovery_days: number;
  cost_min_tl: number;
  cost_max_tl: number;
  popularity_pct: number;
  risk_level: string;
  benefits: string[];
};

const RISK_COLORS: Record<string, string> = {
  'düşük': '#2DD4A8',
  'orta': '#F5B731',
  'yüksek': '#F7564A',
};

function ProcedureCard({ item, index }: { item: Procedure; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isSurgical = item.category === 'cerrahi';
  const accentColor = isSurgical ? '#2DD4A8' : '#F7856E';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(!expanded)}
        style={[s.card, { borderColor: expanded ? accentColor + '40' : 'rgba(255,255,255,0.05)' }]}
      >
        <View style={s.cardHeader}>
          <LinearGradient
            colors={isSurgical ? ['rgba(45,212,168,0.18)', 'rgba(45,212,168,0.05)'] : ['rgba(247,133,110,0.18)', 'rgba(247,133,110,0.05)']}
            style={s.iconBox}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon as any} size={24} color={accentColor} />
          </LinearGradient>

          <View style={s.cardMeta}>
            <Text style={s.cardTitle}>{item.title}</Text>
            <View style={s.cardTagRow}>
              <View style={[s.catTag, { backgroundColor: accentColor + '15' }]}>
                <Text style={[s.catTagTxt, { color: accentColor }]}>
                  {isSurgical ? 'Cerrahi' : 'Medikal'}
                </Text>
              </View>
              <View style={[s.riskTag, { backgroundColor: (RISK_COLORS[item.risk_level] || '#F5B731') + '15' }]}>
                <Text style={[s.riskTxt, { color: RISK_COLORS[item.risk_level] || '#F5B731' }]}>
                  {item.risk_level} risk
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.text.tertiary} />
        </View>

        <View style={s.popularityRow}>
          <Text style={s.popularityLabel}>Popülerlik</Text>
          <View style={s.popularityTrack}>
            <View style={[s.popularityFill, { width: `${item.popularity_pct}%` as any, backgroundColor: accentColor }]} />
          </View>
          <Text style={[s.popularityPct, { color: accentColor }]}>{item.popularity_pct}%</Text>
        </View>

        {expanded && (
          <Animated.View entering={FadeIn.duration(250)} style={s.expandedSection}>
            <View style={s.divider} />
            <Text style={s.descText}>{item.description}</Text>
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Ionicons name="time-outline" size={16} color={accentColor} />
                <Text style={s.statVal}>{item.duration_min}–{item.duration_max} dk</Text>
                <Text style={s.statLabel}>Süre</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Ionicons name="bed-outline" size={16} color={accentColor} />
                <Text style={s.statVal}>{item.recovery_days === 0 ? 'Yok' : `${item.recovery_days} gün`}</Text>
                <Text style={s.statLabel}>İyileşme</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Ionicons name="cash-outline" size={16} color={accentColor} />
                <Text style={s.statVal}>{(item.cost_min_tl / 1000).toFixed(0)}K–{(item.cost_max_tl / 1000).toFixed(0)}K ₺</Text>
                <Text style={s.statLabel}>Fiyat</Text>
              </View>
            </View>
            <Text style={s.sectionLabel}>Faydaları</Text>
            {item.benefits.map((b, i) => (
              <View key={i} style={s.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={accentColor} />
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const { t } = useLang();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cerrahi' | 'medikal'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProcedures = async () => {
    try {
      const { data } = await api.get('/procedures');
      setProcedures(data.procedures || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProcedures(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchProcedures(); setRefreshing(false); };

  const filtered = filter === 'all' ? procedures : procedures.filter(p => p.category === filter);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={s.orbTeal} />
      <View style={s.orbCoral} />

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2DD4A8" />}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
            <Text style={s.title}>{t('discover')}</Text>
            <Text style={s.subtitle}>Estetik prosedür rehberi & fiyatları</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.filterRow}>
            {(['all', 'cerrahi', 'medikal'] as const).map((f) => (
              <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
                <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
                  {f === 'all' ? 'Tümü' : f === 'cerrahi' ? 'Cerrahi' : 'Medikal'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={s.banner}>
            <Ionicons name="information-circle-outline" size={16} color="#2DD4A8" />
            <Text style={s.bannerText}>Fiyatlar Türkiye ortalamasına göredir. Kesin fiyat için klinikle görüşünüz.</Text>
          </Animated.View>

          {loading ? (
            <ActivityIndicator color="#2DD4A8" style={{ marginTop: 60 }} />
          ) : (
            <View style={s.list}>
              {filtered.map((item, i) => (
                <ProcedureCard key={item.id} item={item} index={i} />
              ))}
              {filtered.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="search-outline" size={40} color={COLORS.text.tertiary} />
                  <Text style={s.emptyText}>Bu kategoride prosedür bulunamadı</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  orbTeal: { position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#2DD4A8', opacity: 0.05 },
  orbCoral: { position: 'absolute', bottom: 80, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#F7856E', opacity: 0.04 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { marginBottom: 24 },
  title: { ...FONT.h2, color: '#F0F6F4', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.text.tertiary, marginTop: 4 },

  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  filterBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  filterBtnActive: { backgroundColor: 'rgba(45,212,168,0.1)', borderColor: 'rgba(45,212,168,0.3)' },
  filterTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text.tertiary },
  filterTxtActive: { color: '#2DD4A8' },

  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(45,212,168,0.04)', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(45,212,168,0.1)' },
  bannerText: { fontSize: 12, color: 'rgba(45,212,168,0.7)', flex: 1, lineHeight: 18 },

  list: { gap: 0 },

  card: { backgroundColor: '#0C1619', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0F6F4', marginBottom: 6 },
  cardTagRow: { flexDirection: 'row', gap: 6 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  catTagTxt: { fontSize: 11, fontWeight: '600' },
  riskTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  riskTxt: { fontSize: 11, fontWeight: '600' },

  popularityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  popularityLabel: { fontSize: 11, color: COLORS.text.tertiary, width: 60 },
  popularityTrack: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' },
  popularityFill: { height: '100%', borderRadius: 3 },
  popularityPct: { fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' },

  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 14 },
  descText: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 16 },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  statVal: { fontSize: 13, fontWeight: '700', color: '#F0F6F4' },
  statLabel: { fontSize: 10, color: COLORS.text.tertiary },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, letterSpacing: 1.5, marginBottom: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  benefitText: { fontSize: 13, color: COLORS.text.secondary, flex: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.text.tertiary },
});

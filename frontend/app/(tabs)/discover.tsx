import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
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
  'düşük': '#10B981',
  orta: '#F59E0B',
  'yüksek': '#EF4444',
};

const EXPERT_TIPS = [
  { title: 'Doğru Klinik Seçimi', desc: 'Akreditasyonu olan, uzman kadrosunu görebileceğiniz klinikleri tercih edin.', icon: 'medical-outline' },
  { title: 'İlk Konsültasyon', desc: 'İşlem öncesi mutlaka yüz yüze konsültasyon yapın, fotoğraflarınızı değerlendirin.', icon: 'chatbubbles-outline' },
  { title: 'İyileşme Süreci', desc: 'İyileşme sürecini planlarken iş ve sosyal hayat düzeninizi göz önünde bulundurun.', icon: 'calendar-outline' },
];

function ProcedureCard({ item, index }: { item: Procedure; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isSurgical = item.category === 'cerrahi';
  const accentColor = isSurgical ? COLORS.brand.primary : COLORS.brand.secondary;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(!expanded)}
        style={[s.card, expanded && { borderColor: accentColor + '60' }]}
      >
        <View style={s.cardHeader}>
          <View style={[s.iconBox, { backgroundColor: isSurgical ? '#EEF2FF' : '#F5F3FF' }]}>
            <Ionicons name={item.icon as any} size={22} color={accentColor} />
          </View>

          <View style={s.cardMeta}>
            <Text style={s.cardTitle}>{item.title}</Text>
            <View style={s.cardTagRow}>
              <View style={[s.catTag, { backgroundColor: isSurgical ? '#EEF2FF' : '#F5F3FF' }]}>
                <Text style={[s.catTagTxt, { color: accentColor }]}>
                  {isSurgical ? 'Cerrahi' : 'Medikal'}
                </Text>
              </View>
              <View style={[s.riskTag, { backgroundColor: RISK_COLORS[item.risk_level] + '15' }]}>
                <Text style={[s.riskTxt, { color: RISK_COLORS[item.risk_level] }]}>
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
  const [showTips, setShowTips] = useState(true);

  const fetchProcedures = async () => {
    try {
      const { data } = await api.get('/procedures');
      setProcedures(data.procedures || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProcedures(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProcedures();
    setRefreshing(false);
  };

  const filtered = filter === 'all' ? procedures : procedures.filter(p => p.category === filter);

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
            <Text style={s.title}>{t('discover')}</Text>
            <Text style={s.subtitle}>Prosedür rehberi ve uzman tavsiyeleri</Text>
          </Animated.View>

          {/* Expert Tips */}
          {showTips && (
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <View style={s.tipsHeader}>
                <Text style={s.tipsTitle}>{t('expertAdvice')}</Text>
                <TouchableOpacity onPress={() => setShowTips(false)}>
                  <Text style={s.tipsHide}>Gizle</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tipsScroll}>
                {EXPERT_TIPS.map((tip, i) => (
                  <View key={i} style={s.expertCard}>
                    <View style={s.expertIconBox}>
                      <Ionicons name={tip.icon as any} size={20} color={COLORS.brand.primary} />
                    </View>
                    <Text style={s.expertTitle}>{tip.title}</Text>
                    <Text style={s.expertDesc}>{tip.desc}</Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Filter */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.filterRow}>
            {(['all', 'cerrahi', 'medikal'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterBtn, filter === f && s.filterBtnActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
                  {f === 'all' ? 'Tümü' : f === 'cerrahi' ? 'Cerrahi' : 'Medikal'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={s.banner}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.brand.primary} />
            <Text style={s.bannerText}>
              Fiyatlar Türkiye ortalamasına göredir. Kesin fiyat için klinikle görüşün.
            </Text>
          </Animated.View>

          {loading ? (
            <ActivityIndicator color={COLORS.brand.primary} style={{ marginTop: 60 }} />
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
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { marginBottom: 20 },
  title: { ...FONT.h1, color: COLORS.text.primary },
  subtitle: { fontSize: 14, color: COLORS.text.tertiary, marginTop: 4 },

  tipsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tipsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  tipsHide: { fontSize: 13, color: COLORS.brand.primary, fontWeight: '600' },
  tipsScroll: { paddingBottom: 16, gap: 12 },
  expertCard: { width: 200, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  expertIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  expertTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 },
  expertDesc: { fontSize: 12, color: COLORS.text.secondary, lineHeight: 17 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99,
    backgroundColor: COLORS.bg.secondary, borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#93C5FD' },
  filterTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text.tertiary },
  filterTxtActive: { color: COLORS.brand.primary },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EEF2FF', borderRadius: 12,
    padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#DBEAFE',
  },
  bannerText: { fontSize: 12, color: COLORS.brand.primary, flex: 1, lineHeight: 18 },

  list: { gap: 0 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', ...SHADOWS.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary, marginBottom: 6 },
  cardTagRow: { flexDirection: 'row', gap: 6 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  catTagTxt: { fontSize: 11, fontWeight: '600' },
  riskTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  riskTxt: { fontSize: 11, fontWeight: '600' },

  popularityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  popularityLabel: { fontSize: 11, color: COLORS.text.tertiary, width: 60 },
  popularityTrack: { flex: 1, height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  popularityFill: { height: '100%', borderRadius: 3 },
  popularityPct: { fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' },

  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  descText: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 16 },

  statsRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statSep: { width: 1, backgroundColor: '#E2E8F0' },
  statVal: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },
  statLabel: { fontSize: 10, color: COLORS.text.tertiary },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, letterSpacing: 1.5, marginBottom: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  benefitText: { fontSize: 13, color: COLORS.text.secondary, flex: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.text.tertiary },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT, RADIUS } from '../../src/utils/theme';
import api from '../../src/utils/api';
import { getProcedureEditorial } from '../../src/data/editorial';

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
  düşük: COLORS.status.success,
  orta: COLORS.status.warning,
  yüksek: COLORS.status.error,
};

function ProcedureCard({ item, index }: { item: Procedure; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const editorial = getProcedureEditorial(item.id, item.category, item.title);
  const accent = item.category === 'cerrahi' ? COLORS.brand.primary : COLORS.brand.secondary;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(400)}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setExpanded((value) => !value)}
        style={[styles.card, expanded && styles.cardExpanded]}
      >
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={item.category === 'cerrahi' ? COLORS.gradient.lagoon : COLORS.gradient.sunrise}
            style={styles.iconBox}
          >
            <Ionicons name={item.icon as any} size={24} color={COLORS.text.inverse} />
          </LinearGradient>

          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: `${accent}20` }]}>
                <Text style={[styles.tagText, { color: accent }]}>
                  {item.category === 'cerrahi' ? 'Cerrahi rota' : 'Medikal rota'}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: `${RISK_COLORS[item.risk_level] || COLORS.status.info}20` }]}>
                <Text style={[styles.tagText, { color: RISK_COLORS[item.risk_level] || COLORS.status.info }]}>
                  {item.risk_level} risk
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name={expanded ? 'remove-outline' : 'add-outline'} size={20} color={COLORS.text.tertiary} />
        </View>

        <Text style={styles.moodText}>{editorial.mood}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {item.duration_min}-{item.duration_max} dk
            </Text>
            <Text style={styles.statLabel}>seans / ameliyat</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {item.recovery_days === 0 ? 'Ayni gun' : `${item.recovery_days} gun`}
            </Text>
            <Text style={styles.statLabel}>gorunur toparlanma</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(item.cost_min_tl / 1000)}-{Math.round(item.cost_max_tl / 1000)}K
            </Text>
            <Text style={styles.statLabel}>TL araligi</Text>
          </View>
        </View>

        <View style={styles.popularityRow}>
          <Text style={styles.popularityLabel}>Topluluk ilgisi</Text>
          <View style={styles.popularityTrack}>
            <View
              style={[
                styles.popularityFill,
                { width: `${item.popularity_pct}%` as any, backgroundColor: accent },
              ]}
            />
          </View>
          <Text style={[styles.popularityText, { color: accent }]}>{item.popularity_pct}%</Text>
        </View>

        {expanded && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.expanded}>
            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Kimler icin daha anlamli?</Text>
            {editorial.bestFor.map((point) => (
              <View key={point} style={styles.listRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={accent} />
                <Text style={styles.listText}>{point}</Text>
              </View>
            ))}

            <Text style={styles.sectionLabel}>Danismada sor</Text>
            {editorial.consultQuestions.map((question) => (
              <View key={question} style={styles.questionRow}>
                <View style={[styles.questionIndex, { backgroundColor: `${accent}20` }]}>
                  <Text style={[styles.questionIndexText, { color: accent }]}>?</Text>
                </View>
                <Text style={styles.listText}>{question}</Text>
              </View>
            ))}

            <Text style={styles.sectionLabel}>Hazirlik listesi</Text>
            <View style={styles.chipWrap}>
              {editorial.prepChecklist.map((itemText) => (
                <View key={itemText} style={styles.infoChip}>
                  <Text style={styles.infoChipText}>{itemText}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Klinikte iyi sinyaller</Text>
            {editorial.clinicSignals.map((signal) => (
              <View key={signal} style={styles.listRow}>
                <Ionicons name="sparkles-outline" size={16} color={COLORS.brand.primary} />
                <Text style={styles.listText}>{signal}</Text>
              </View>
            ))}

            <View style={styles.aftercareBox}>
              <Text style={styles.aftercareTitle}>Takip notu</Text>
              <Text style={styles.aftercareText}>{editorial.aftercare}</Text>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cerrahi' | 'medikal'>('all');

  const fetchProcedures = async () => {
    try {
      const { data } = await api.get('/procedures');
      setProcedures(data.procedures || []);
    } catch {
      setProcedures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? procedures : procedures.filter((item) => item.category === filter)),
    [filter, procedures]
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#08111F', '#0D1A30', '#15253F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchProcedures();
                setRefreshing(false);
              }}
              tintColor={COLORS.brand.primary}
            />
          }
        >
          <Animated.View entering={FadeInDown.duration(420)} style={styles.header}>
            <Text style={styles.eyebrow}>Procedure Atlas</Text>
            <Text style={styles.screenTitle}>Karsilastir, soru topla, sonra karar ver.</Text>
            <Text style={styles.screenSubtitle}>
              Buradaki kartlar yalnizca fiyat listesi degil; dogru uzmanla gorusmeye giderken
              kullanabilecegin editoriyel ozetlerdir.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(420)} style={styles.banner}>
            <Ionicons name="map-outline" size={18} color={COLORS.text.inverse} />
            <Text style={styles.bannerText}>
              Fiyatlar Turkiye pazar ortalamalari uzerinden yaklasik bir pencere sunar. Kesin plan
              icin muayene gerekir.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(110).duration(420)} style={styles.filterRow}>
            {(['all', 'cerrahi', 'medikal'] as const).map((value) => {
              const active = filter === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setFilter(value)}
                  activeOpacity={0.85}
                  style={[styles.filterButton, active && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {value === 'all' ? 'Tum rotalar' : value === 'cerrahi' ? 'Cerrahi rota' : 'Medikal rota'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {loading ? (
            <ActivityIndicator color={COLORS.brand.primary} style={{ marginTop: 64 }} />
          ) : (
            <View style={styles.list}>
              {filtered.map((item, index) => (
                <ProcedureCard key={item.id} item={item} index={index} />
              ))}

              {filtered.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={34} color={COLORS.text.tertiary} />
                  <Text style={styles.emptyTitle}>Bu rota icin kayit bulunamadi</Text>
                  <Text style={styles.emptyText}>Farkli bir filtre secip atlasi yeniden inceleyebilirsin.</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  glowOne: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(70,198,255,0.14)',
  },
  glowTwo: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,176,120,0.12)',
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 42 },
  header: { marginBottom: 18 },
  eyebrow: { ...FONT.xs, color: COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  screenTitle: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 8 },
  screenSubtitle: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 21 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.brand.primary,
    marginBottom: 18,
  },
  bannerText: { ...FONT.small, color: COLORS.text.inverse, flex: 1, lineHeight: 20, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    backgroundColor: 'rgba(16,27,50,0.86)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(107,227,192,0.14)',
    borderColor: 'rgba(107,227,192,0.32)',
  },
  filterText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '700' },
  filterTextActive: { color: COLORS.brand.primary },
  list: { gap: 12 },
  card: {
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardExpanded: { borderColor: 'rgba(107,227,192,0.28)' },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconBox: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  tagText: { ...FONT.xs, fontWeight: '700' },
  moodText: { ...FONT.small, color: COLORS.brand.secondary, marginTop: 14, marginBottom: 6, fontWeight: '700' },
  cardDescription: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
  },
  statValue: { ...FONT.small, color: COLORS.text.primary, fontWeight: '700', marginBottom: 4 },
  statLabel: { ...FONT.xs, color: COLORS.text.tertiary, lineHeight: 16 },
  popularityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  popularityLabel: { ...FONT.xs, color: COLORS.text.tertiary, width: 82 },
  popularityTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  popularityFill: { height: '100%', borderRadius: 3 },
  popularityText: { ...FONT.xs, width: 36, textAlign: 'right', fontWeight: '800' },
  expanded: { marginTop: 14 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
  sectionLabel: { ...FONT.xs, color: COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 },
  listRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  listText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  questionRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  questionIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  questionIndexText: { ...FONT.xs, fontWeight: '800' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  infoChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  infoChipText: { ...FONT.xs, color: COLORS.text.secondary, lineHeight: 17 },
  aftercareBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(70,198,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(70,198,255,0.18)',
  },
  aftercareTitle: { ...FONT.small, color: COLORS.brand.primary, fontWeight: '700', marginBottom: 6 },
  aftercareText: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { ...FONT.h4, color: COLORS.text.primary },
  emptyText: { ...FONT.small, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 20 },
});

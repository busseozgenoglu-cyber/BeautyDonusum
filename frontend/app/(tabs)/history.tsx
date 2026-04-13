import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/utils/theme';
import api from '../../src/utils/api';
import { buildHistoryInsight } from '../../src/utils/journeyPlanner';

export default function HistoryScreen() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/analysis/user/history');
      setAnalyses(data.analyses || []);
    } catch {
      setAnalyses([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const summary = useMemo(() => {
    const count = analyses.length;
    const avg =
      count === 0
        ? 0
        : analyses.reduce((acc, item) => acc + buildHistoryInsight(item).score, 0) / count;
    const lastCategory = analyses[0]?.category === 'cerrahi' ? 'Cerrahi rota aktif' : analyses[0]?.category === 'medikal' ? 'Medikal rota aktif' : 'Yeni dosya yok';

    return {
      count,
      avg: avg.toFixed(1),
      lastCategory,
    };
  }, [analyses]);

  const renderItem = ({ item }: { item: any }) => {
    const insight = buildHistoryInsight(item);
    const accent = item.category === 'cerrahi' ? COLORS.brand.primary : COLORS.brand.secondary;

    return (
      <TouchableOpacity
        testID={`history-item-${item.analysis_id}`}
        style={styles.card}
        onPress={() => router.push({ pathname: '/analysis/results', params: { analysisId: item.analysis_id } })}
        activeOpacity={0.88}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryPill, { backgroundColor: `${accent}20` }]}>
            <Ionicons
              name={item.category === 'cerrahi' ? 'layers-outline' : 'color-wand-outline'}
              size={14}
              color={accent}
            />
            <Text style={[styles.categoryPillText, { color: accent }]}>
              {item.category === 'cerrahi' ? 'Cerrahi dosya' : 'Medikal dosya'}
            </Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreLabel}>Uyum ozetin</Text>
            <Text style={styles.scoreValue}>{insight.score.toFixed(1)}/10</Text>
          </View>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>{insight.tone}</Text>
          </View>
        </View>

        <Text style={styles.nextMoveLabel}>Sonraki adim</Text>
        <Text style={styles.nextMoveText}>{insight.nextMove}</Text>

        <View style={styles.footerRow}>
          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.status === 'completed' ? COLORS.status.success : COLORS.status.warning },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'Dosya hazir' : 'Isleniyor'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={COLORS.text.tertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#08111F', '#0D1A30', '#15253F']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={analyses}
          keyExtractor={(item) => item.analysis_id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchHistory();
                setRefreshing(false);
              }}
              tintColor={COLORS.brand.primary}
            />
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.eyebrow}>Dosya panosu</Text>
              <Text style={styles.title}>Tum analizlerin tek arsivde.</Text>
              <Text style={styles.subtitle}>
                Eski sonuclari yalnizca puan olarak degil, sonraki adim ve rota baglamiyla gorsun.
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{summary.count}</Text>
                  <Text style={styles.summaryLabel}>toplam dosya</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{summary.avg}</Text>
                  <Text style={styles.summaryLabel}>ortalama skor</Text>
                </View>
              </View>

              <View style={styles.activeRouteCard}>
                <Ionicons name="sparkles-outline" size={16} color={COLORS.brand.primary} />
                <Text style={styles.activeRouteText}>{summary.lastCategory}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={42} color={COLORS.text.tertiary} />
              <Text style={styles.emptyTitle}>Henuz bir dosya olusturulmamıs</Text>
              <Text style={styles.emptyText}>
                Ilk analizinden sonra burada skorlar, notlar ve rota ozeti gorunecek.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  container: { flex: 1 },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 28 },
  headerBlock: { paddingTop: 10, paddingBottom: 20 },
  eyebrow: { ...FONT.xs, color: COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 8 },
  subtitle: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 21, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  summaryValue: { ...FONT.h2, color: COLORS.text.primary },
  summaryLabel: { ...FONT.xs, color: COLORS.text.tertiary, marginTop: 4 },
  activeRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(107,227,192,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(107,227,192,0.22)',
  },
  activeRouteText: { ...FONT.small, color: COLORS.text.primary, fontWeight: '700' },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  categoryPillText: { ...FONT.xs, fontWeight: '700' },
  dateText: { ...FONT.xs, color: COLORS.text.tertiary },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scoreLabel: { ...FONT.xs, color: COLORS.text.tertiary, marginBottom: 4 },
  scoreValue: { ...FONT.h2, color: COLORS.text.primary },
  scoreChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreChipText: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '700' },
  nextMoveLabel: { ...FONT.xs, color: COLORS.brand.secondary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  nextMoveText: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...FONT.xs, color: COLORS.text.secondary },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { ...FONT.h4, color: COLORS.text.primary },
  emptyText: { ...FONT.small, color: COLORS.text.tertiary, textAlign: 'center', lineHeight: 20 },
});

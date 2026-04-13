import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';

export default function HistoryScreen() {
  const { t } = useLang();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/analysis/user/history');
      setAnalyses(data.analyses || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

  const onRefresh = async () => { setRefreshing(true); await fetchHistory(); setRefreshing(false); };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const score = item.recommendations?.overall_score ?? ((item.metrics?.overall_harmony ?? 0) * 10).toFixed(1);
    const scoreColor = parseFloat(String(score)) >= 7 ? COLORS.status.success : parseFloat(String(score)) >= 5 ? COLORS.status.warning : COLORS.status.error;
    const isSurgical = item.category === 'cerrahi';

    return (
      <TouchableOpacity
        testID={`history-item-${item.analysis_id}`}
        style={styles.card}
        onPress={() => router.push({ pathname: '/analysis/results', params: { analysisId: item.analysis_id } })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor + '40' }]}>
            <Text style={[styles.scoreCircleText, { color: scoreColor }]}>{parseFloat(String(score)).toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: isSurgical ? '#EEF2FF' : '#F5F3FF' }]}>
              <Ionicons name={isSurgical ? 'cut-outline' : 'sparkles-outline'} size={12} color={isSurgical ? COLORS.brand.primary : COLORS.brand.secondary} />
              <Text style={[styles.categoryText, { color: isSurgical ? COLORS.brand.primary : COLORS.brand.secondary }]}>
                {isSurgical ? t('surgical') : t('medicalAesthetic')}
              </Text>
            </View>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? COLORS.status.success : COLORS.status.warning }]} />
            <Text style={styles.statusText}>{item.status === 'completed' ? t('analysisComplete') : t('analyzing')}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('history')}</Text>
        {analyses.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{analyses.length}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.analysis_id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="layers-outline" size={48} color={COLORS.text.tertiary} />
            </View>
            <Text style={styles.emptyTitle}>{t('noAnalysis')}</Text>
            <Text style={styles.emptyDesc}>{t('startFirst')}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/home')}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emptyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.emptyBtnText}>Analiz Başlat</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { ...FONT.h1, color: COLORS.text.primary },
  countBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  countText: { fontSize: 13, fontWeight: '700', color: COLORS.brand.primary },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', ...SHADOWS.soft },
  cardLeft: { marginRight: 14 },
  scoreCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBFE' },
  scoreCircleText: { fontSize: 16, fontWeight: '800' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  categoryText: { ...FONT.xs, fontWeight: '600' },
  date: { ...FONT.xs, color: COLORS.text.tertiary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { ...FONT.xs, color: COLORS.text.secondary, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { ...FONT.h3, color: COLORS.text.secondary },
  emptyDesc: { ...FONT.small, color: COLORS.text.tertiary },
  emptyBtn: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  emptyBtnGrad: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity testID={`history-item-${item.analysis_id}`} style={styles.card}
      onPress={() => router.push({ pathname: '/analysis/results', params: { analysisId: item.analysis_id } })} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, item.category === 'cerrahi' ? styles.badgeSurgical : styles.badgeMedical]}>
          <Ionicons name={item.category === 'cerrahi' ? 'cut-outline' : 'sparkles-outline'} size={14} color={item.category === 'cerrahi' ? COLORS.brand.primary : COLORS.brand.secondary} />
          <Text style={[styles.categoryText, { color: item.category === 'cerrahi' ? COLORS.brand.primary : COLORS.brand.secondary }]}>
            {item.category === 'cerrahi' ? t('surgical') : t('medicalAesthetic')}
          </Text>
        </View>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
      </View>
      <View style={styles.metricsRow}>
        <Text style={styles.scoreLabel}>{t('yourScore')}:</Text>
        <Text style={styles.scoreValue}>{item.recommendations?.overall_score ?? ((item.metrics?.overall_harmony ?? 0) * 10).toFixed(1)}/10</Text>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? COLORS.status.success : COLORS.status.warning }]} />
        <Text style={styles.statusText}>{item.status === 'completed' ? t('analysisComplete') : t('analyzing')}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.text.tertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('history')}</Text>
      <FlatList data={analyses} keyExtractor={(item) => item.analysis_id} renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="scan-outline" size={48} color={COLORS.text.tertiary} />
            <Text style={styles.emptyTitle}>{t('noAnalysis')}</Text>
            <Text style={styles.emptyDesc}>{t('startFirst')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  title: { ...FONT.h2, color: COLORS.text.primary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 20 },
  card: { backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeSurgical: { backgroundColor: 'rgba(13,92,94,0.1)' },
  badgeMedical: { backgroundColor: 'rgba(30,58,95,0.1)' },
  categoryText: { ...FONT.xs, fontWeight: '600' },
  date: { ...FONT.xs, color: COLORS.text.tertiary },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  scoreLabel: { ...FONT.small, color: COLORS.text.secondary },
  scoreValue: { ...FONT.h4, color: COLORS.brand.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...FONT.xs, color: COLORS.text.secondary, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { ...FONT.h4, color: COLORS.text.secondary },
  emptyDesc: { ...FONT.small, color: COLORS.text.tertiary },
});

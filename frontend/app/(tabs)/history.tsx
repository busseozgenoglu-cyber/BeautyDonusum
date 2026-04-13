import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    const isSurgical = item.category === 'cerrahi';
    const accentColor = isSurgical ? '#2DD4A8' : '#F7856E';
    const score = item.recommendations?.overall_score ?? ((item.metrics?.overall_harmony ?? 0) * 10).toFixed(1);

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
        <TouchableOpacity
          testID={`history-item-${item.analysis_id}`}
          style={styles.card}
          onPress={() => router.push({ pathname: '/analysis/results', params: { analysisId: item.analysis_id } })}
          activeOpacity={0.8}
        >
          <View style={styles.cardLeft}>
            <LinearGradient
              colors={isSurgical ? ['rgba(45,212,168,0.15)', 'rgba(45,212,168,0.05)'] : ['rgba(247,133,110,0.15)', 'rgba(247,133,110,0.05)']}
              style={styles.cardIcon}
            >
              <Ionicons name={isSurgical ? 'cut-outline' : 'sparkles-outline'} size={20} color={accentColor} />
            </LinearGradient>
          </View>
          <View style={styles.cardCenter}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory}>{isSurgical ? t('surgical') : t('medicalAesthetic')}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? COLORS.status.success : COLORS.status.warning }]} />
            </View>
            <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.scoreVal, { color: accentColor }]}>{score}</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('history')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countTxt}>{analyses.length}</Text>
          </View>
        </View>

        <FlatList
          data={analyses}
          keyExtractor={(item) => item.analysis_id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2DD4A8" />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <LinearGradient colors={['rgba(45,212,168,0.1)', 'rgba(45,212,168,0.03)']} style={styles.emptyIconGrad}>
                  <Ionicons name="scan-outline" size={40} color="#2DD4A8" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>{t('noAnalysis')}</Text>
              <Text style={styles.emptyDesc}>{t('startFirst')}</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  container: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { ...FONT.h2, color: COLORS.text.primary },
  countBadge: { backgroundColor: 'rgba(45,212,168,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(45,212,168,0.2)' },
  countTxt: { fontSize: 12, fontWeight: '700', color: '#2DD4A8' },

  list: { paddingHorizontal: SPACING.lg, paddingBottom: 20 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0C1619', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardLeft: { marginRight: 14 },
  cardIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardCenter: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardCategory: { ...FONT.small, color: COLORS.text.primary, fontWeight: '600' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardDate: { ...FONT.xs, color: COLORS.text.tertiary },
  cardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreVal: { fontSize: 22, fontWeight: '800' },
  scoreMax: { fontSize: 13, color: COLORS.text.tertiary, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 8 },
  emptyIconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONT.h4, color: COLORS.text.secondary },
  emptyDesc: { ...FONT.small, color: COLORS.text.tertiary },
});

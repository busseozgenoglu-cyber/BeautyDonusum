import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedCategory) return;
    router.push({ pathname: '/analysis/camera', params: { category: selectedCategory } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{t('welcome')},</Text>
            <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.subscription === 'premium' ? t('premium') : t('free')}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>{t('selectCategory')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <TouchableOpacity testID="category-cerrahi" activeOpacity={0.85}
            style={[styles.categoryCard, selectedCategory === 'cerrahi' && styles.categorySelected]}
            onPress={() => setSelectedCategory('cerrahi')}>
            <LinearGradient colors={['rgba(229,192,123,0.15)', 'rgba(229,192,123,0.05)']} style={styles.categoryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.categoryIcon}>
                <Ionicons name="cut-outline" size={28} color={COLORS.brand.primary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{t('surgical')}</Text>
                <Text style={styles.categoryDesc}>{t('surgicalDesc')}</Text>
              </View>
              <View style={styles.categoryArrow}>
                {selectedCategory === 'cerrahi' ? <Ionicons name="checkmark-circle" size={24} color={COLORS.brand.primary} /> : <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity testID="category-medikal" activeOpacity={0.85}
            style={[styles.categoryCard, selectedCategory === 'medikal' && styles.categorySelected]}
            onPress={() => setSelectedCategory('medikal')}>
            <LinearGradient colors={['rgba(183,110,121,0.15)', 'rgba(183,110,121,0.05)']} style={styles.categoryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={[styles.categoryIcon, { backgroundColor: 'rgba(183,110,121,0.15)' }]}>
                <Ionicons name="sparkles-outline" size={28} color={COLORS.brand.secondary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{t('medicalAesthetic')}</Text>
                <Text style={styles.categoryDesc}>{t('medicalDesc')}</Text>
              </View>
              <View style={styles.categoryArrow}>
                {selectedCategory === 'medikal' ? <Ionicons name="checkmark-circle" size={24} color={COLORS.brand.secondary} /> : <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {selectedCategory && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <TouchableOpacity testID="start-analysis-btn" onPress={handleStart} activeOpacity={0.8}>
              <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="scan-outline" size={22} color="#000" />
                <Text style={styles.startText}>{t('startAnalysis')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.text.tertiary} />
          <Text style={styles.disclaimerText}>{t('disclaimer')}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { ...FONT.body, color: COLORS.text.secondary },
  userName: { ...FONT.h2, color: COLORS.text.primary, marginTop: 2 },
  badge: { backgroundColor: COLORS.surface.glass, borderWidth: 1, borderColor: COLORS.surface.glassBorder, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '600' },
  sectionTitle: { ...FONT.h3, color: COLORS.text.primary, marginBottom: 20 },
  categoryCard: { marginBottom: 16, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  categorySelected: { borderColor: COLORS.brand.primary },
  categoryGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  categoryIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(229,192,123,0.15)', alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, marginLeft: 16 },
  categoryTitle: { ...FONT.h4, color: COLORS.text.primary },
  categoryDesc: { ...FONT.small, color: COLORS.text.secondary, marginTop: 4 },
  categoryArrow: { marginLeft: 8 },
  startBtn: { borderRadius: RADIUS.md, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, ...SHADOWS.glow },
  startText: { ...FONT.body, fontWeight: '700', color: COLORS.text.inverse },
  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 32, backgroundColor: COLORS.surface.glass, borderRadius: RADIUS.md, padding: 14, gap: 8 },
  disclaimerText: { ...FONT.xs, color: COLORS.text.tertiary, flex: 1, lineHeight: 18 },
});

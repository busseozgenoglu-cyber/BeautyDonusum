import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, FONT, RADIUS } from '../../src/utils/theme';
import { JOURNEY_MODES, STUDIO_PILLARS } from '../../src/data/editorial';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<'cerrahi' | 'medikal'>('cerrahi');

  const currentMode = useMemo(
    () => JOURNEY_MODES.find((mode) => mode.key === selected) || JOURNEY_MODES[0],
    [selected]
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#08111F', '#0A1830', '#122038']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.eyebrow}>Ayna Atlas</Text>
              <Text style={styles.title}>Merhaba, {user?.name || 'katilimci'}.</Text>
              <Text style={styles.subtitle}>
                Bugun tek bir skordan fazlasini hazirliyoruz: danisma sorulari, toparlanma zamani
                ve karar notlari tek ekranda.
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons
                name={user?.subscription === 'premium' ? 'sparkles' : 'grid-outline'}
                size={14}
                color={user?.subscription === 'premium' ? COLORS.brand.secondary : COLORS.brand.primary}
              />
              <Text style={styles.badgeText}>
                {user?.subscription === 'premium' ? 'Studio+' : 'Explorer'}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroSignal}>
                <LinearGradient colors={COLORS.gradient.lagoon} style={styles.heroSignalDot} />
                <Text style={styles.heroSignalText}>Canli planlama panosu</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{user?.analyses_count || 0}</Text>
                <Text style={styles.heroStatLabel}>olusturulan dosya</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroIconWrap}>
                <LinearGradient colors={COLORS.gradient.aurora} style={styles.heroIcon}>
                  <Ionicons name="scan-outline" size={32} color={COLORS.text.inverse} />
                </LinearGradient>
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Sablon analiz degil, karar destek dosyasi</Text>
                <Text style={styles.heroDescription}>
                  Her tarama; oncelikli bolgeler, klinikte sorulacak sorular ve surec planlamasina
                  donusen ozetler uretir.
                </Text>
              </View>
            </View>

            <View style={styles.heroChips}>
              {['Danisma sorulari', 'Butce bandi', 'Toparlanma penceresi'].map((chip) => (
                <View key={chip} style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{chip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Rota secimi</Text>
            <Text style={styles.sectionTitle}>Hangi akisla ilerlemek istiyorsun?</Text>
          </Animated.View>

          {JOURNEY_MODES.map((mode, index) => {
            const active = selected === mode.key;
            return (
              <Animated.View key={mode.key} entering={FadeInDown.delay(220 + index * 60).duration(450)}>
                <TouchableOpacity onPress={() => setSelected(mode.key)} activeOpacity={0.9}>
                  <View style={[styles.modeCard, active && styles.modeCardActive]}>
                    {active && (
                      <LinearGradient
                        colors={['rgba(70,198,255,0.16)', 'rgba(107,227,192,0.05)']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <LinearGradient colors={mode.accent} style={styles.modeIconWrap}>
                      <Ionicons name={mode.icon as any} size={24} color={COLORS.text.inverse} />
                    </LinearGradient>

                    <View style={styles.modeBody}>
                      <Text style={styles.modeEyebrow}>{mode.eyebrow}</Text>
                      <View style={styles.modeTitleRow}>
                        <Text style={styles.modeTitle}>{mode.title}</Text>
                        {active && (
                          <View style={styles.modeCheck}>
                            <Ionicons name="checkmark" size={12} color={COLORS.text.inverse} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.modeDescription}>{mode.description}</Text>

                      <View style={styles.modeOutcomeRow}>
                        {mode.outcomes.map((item) => (
                          <View key={item} style={styles.modeOutcome}>
                            <Text style={styles.modeOutcomeText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          <Animated.View entering={FadeInDown.delay(360).duration(500)} style={styles.planCard}>
            <Text style={styles.planEyebrow}>Secilen rota</Text>
            <Text style={styles.planTitle}>{currentMode.title}</Text>
            <Text style={styles.planDescription}>{currentMode.description}</Text>

            <View style={styles.planList}>
              {currentMode.outcomes.map((item, index) => (
                <View key={item} style={styles.planListRow}>
                  <Text style={styles.planStep}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.planListText}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(440).duration(500)} style={styles.ctaWrap}>
            <TouchableOpacity
              testID="start-analysis-btn"
              onPress={() => router.push({ pathname: '/analysis/camera', params: { category: selected } })}
              activeOpacity={0.88}
            >
              <LinearGradient colors={currentMode.accent} style={styles.ctaButton}>
                <Ionicons name="arrow-forward-circle-outline" size={20} color={COLORS.text.inverse} />
                <Text style={styles.ctaText}>Bu rota ile analiz dosyasi olustur</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(520)} style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Fark yaratan kisim</Text>
            <Text style={styles.sectionTitle}>Tarama sonrasinda neler eklenir?</Text>
          </Animated.View>

          <View style={styles.pillarsGrid}>
            {STUDIO_PILLARS.map((pillar, index) => (
              <Animated.View
                key={pillar.title}
                entering={FadeInDown.delay(560 + index * 70).duration(400)}
                style={styles.pillarCard}
              >
                <View style={styles.pillarIcon}>
                  <Ionicons name={pillar.icon as any} size={18} color={COLORS.brand.primary} />
                </View>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarDescription}>{pillar.description}</Text>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeIn.delay(760)} style={styles.disclaimer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.brand.primary} />
            <Text style={styles.disclaimerText}>
              Ayna Atlas tibbi tani koymaz; uzman gorusmesine hazirlik icin yapilandirilmis bir
              karar destek alanidir.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(70,198,255,0.16)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 20,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,176,120,0.14)',
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 44 },
  header: { marginBottom: 24 },
  headerTextWrap: { marginBottom: 16 },
  eyebrow: { ...FONT.small, color: COLORS.brand.primary, marginBottom: 6, fontWeight: '700' },
  title: { ...FONT.h1, color: COLORS.text.primary, lineHeight: 42 },
  subtitle: { ...FONT.small, color: COLORS.text.secondary, marginTop: 10, lineHeight: 22 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  badgeText: { ...FONT.xs, color: COLORS.text.primary, fontWeight: '700' },
  heroCard: {
    backgroundColor: 'rgba(16,27,50,0.9)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    marginBottom: 24,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroSignal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroSignalDot: { width: 10, height: 10, borderRadius: 5 },
  heroSignalText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '700' },
  heroStat: { alignItems: 'flex-end' },
  heroStatValue: { ...FONT.h3, color: COLORS.brand.secondary },
  heroStatLabel: { ...FONT.xs, color: COLORS.text.tertiary },
  heroBody: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 18 },
  heroIconWrap: { padding: 2, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { ...FONT.h3, color: COLORS.text.primary, marginBottom: 8 },
  heroDescription: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 21 },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroChipText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '600' },
  sectionHeader: { marginBottom: 14 },
  sectionEyebrow: { ...FONT.xs, color: COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  sectionTitle: { ...FONT.h3, color: COLORS.text.primary },
  modeCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(16,27,50,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  modeCardActive: { borderColor: 'rgba(70,198,255,0.38)' },
  modeIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modeBody: { flex: 1 },
  modeEyebrow: { ...FONT.xs, color: COLORS.brand.secondary, marginBottom: 6, fontWeight: '700' },
  modeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  modeTitle: { ...FONT.h4, color: COLORS.text.primary, flex: 1 },
  modeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeDescription: { ...FONT.small, color: COLORS.text.secondary, marginTop: 8, lineHeight: 20 },
  modeOutcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  modeOutcome: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  modeOutcomeText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '600' },
  planCard: {
    marginTop: 6,
    marginBottom: 18,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(11,20,36,0.95)',
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  planEyebrow: { ...FONT.xs, color: COLORS.brand.secondary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  planTitle: { ...FONT.h3, color: COLORS.text.primary, marginBottom: 8 },
  planDescription: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 21, marginBottom: 14 },
  planList: { gap: 12 },
  planListRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  planStep: { width: 28, ...FONT.small, color: COLORS.brand.primary, fontWeight: '800' },
  planListText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  ctaWrap: { marginBottom: 24 },
  ctaButton: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  ctaText: { ...FONT.body, color: COLORS.text.inverse, fontWeight: '800' },
  pillarsGrid: { gap: 12, marginBottom: 26 },
  pillarCard: {
    backgroundColor: 'rgba(16,27,50,0.88)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pillarIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(107,227,192,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pillarTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 6 },
  pillarDescription: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  disclaimerText: { ...FONT.xs, color: COLORS.text.tertiary, flex: 1, lineHeight: 18 },
});

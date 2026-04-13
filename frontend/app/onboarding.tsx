import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLang } from '../src/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

const PAGES = [
  {
    icon: 'scan-outline' as const,
    gradient: ['#2DD4A8', '#1A9B7A'] as const,
    illustrationParts: ['eye-outline', 'finger-print-outline', 'analytics-outline'],
    titleKey: 'onboardingTitle1',
    descKey: 'onboardingDesc1',
  },
  {
    icon: 'journal-outline' as const,
    gradient: ['#F7856E', '#E05A42'] as const,
    illustrationParts: ['water-outline', 'sunny-outline', 'moon-outline'],
    titleKey: 'onboardingTitle2',
    descKey: 'onboardingDesc2',
  },
  {
    icon: 'bulb-outline' as const,
    gradient: ['#58E0C0', '#2DD4A8'] as const,
    illustrationParts: ['sparkles-outline', 'heart-outline', 'star-outline'],
    titleKey: 'onboardingTitle3',
    descKey: 'onboardingDesc3',
  },
];

export default function OnboardingScreen() {
  const { t } = useLang();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const renderPage = ({ item, index }: { item: typeof PAGES[0]; index: number }) => (
    <View style={styles.page}>
      <View style={styles.illustrationWrap}>
        <LinearGradient
          colors={[...item.gradient, 'transparent'] as any}
          style={styles.illustrationGlow}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.iconCircle}>
          <LinearGradient colors={[...item.gradient] as any} style={styles.iconCircleGrad}>
            <Ionicons name={item.icon} size={48} color="#F0F6F4" />
          </LinearGradient>
        </View>
        <View style={styles.orbitingIcons}>
          {item.illustrationParts.map((part, i) => (
            <View key={i} style={[styles.orbitIcon, {
              transform: [
                { rotate: `${i * 120}deg` },
                { translateX: 80 },
                { rotate: `${-i * 120}deg` },
              ],
            }]}>
              <View style={styles.orbitIconInner}>
                <Ionicons name={part as any} size={20} color={item.gradient[0]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.pageTitle}>{t(item.titleKey)}</Text>
      <Text style={styles.pageDesc}>{t(item.descKey)}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <View style={{ width: 60 }} />
          <View style={styles.dots}>
            {PAGES.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipTxt}>{t('skip')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={PAGES}
          renderItem={renderPage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / W));
          }}
          keyExtractor={(_, i) => String(i)}
        />

        <Animated.View entering={FadeInDown.delay(200)} style={styles.bottomArea}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={PAGES[activeIndex].gradient as any}
              style={styles.nextBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextTxt}>
                {activeIndex === PAGES.length - 1 ? t('getStarted') : t('next')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#050D0F" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(45,212,168,0.2)' },
  dotActive: { backgroundColor: '#2DD4A8', width: 24 },
  skipBtn: { width: 60, alignItems: 'flex-end' },
  skipTxt: { fontSize: 14, color: 'rgba(240,246,244,0.4)', fontWeight: '500' },

  page: { width: W, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 40 },
  illustrationWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  illustrationGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.15 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  iconCircleGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbitingIcons: { position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  orbitIcon: { position: 'absolute' },
  orbitIconInner: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(45,212,168,0.1)', borderWidth: 1, borderColor: 'rgba(45,212,168,0.2)', alignItems: 'center', justifyContent: 'center' },

  pageTitle: { fontSize: 28, fontWeight: '800', color: '#F0F6F4', textAlign: 'center', marginBottom: 14, letterSpacing: -0.5 },
  pageDesc: { fontSize: 16, color: '#8BA5A0', textAlign: 'center', lineHeight: 24 },

  bottomArea: { paddingHorizontal: 24, paddingBottom: 20 },
  nextBtn: { borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextTxt: { fontSize: 17, fontWeight: '800', color: '#050D0F' },
});

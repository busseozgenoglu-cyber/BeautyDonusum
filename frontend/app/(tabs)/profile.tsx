import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// App Store URL'ini kendi uygulamanın ID'si ile değiştir
const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: t('logout'), style: 'destructive',
        onPress: async () => { await logout(); router.replace('/auth'); },
      },
    ]);
  };

  const handleUpgrade = () => {
    // Kullanıcıyı App Store'a yönlendir — gerçek ödeme orada yapılır
    Alert.alert(
      'Premium\'a Yükselt',
      'App Store\'da premium aboneliği satın almak için yönlendirileceksiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'App Store\'a Git',
          onPress: () => Linking.openURL(APP_STORE_URL),
        },
      ]
    );
  };

  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('profile')}</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.subBadge, user?.subscription === 'premium' && styles.subBadgePremium]}>
            <Ionicons
              name={user?.subscription === 'premium' ? 'diamond' : 'person'}
              size={14}
              color={user?.subscription === 'premium' ? COLORS.brand.primary : COLORS.text.secondary}
            />
            <Text style={[styles.subText, user?.subscription === 'premium' && styles.subTextPremium]}>
              {user?.subscription === 'premium' ? t('premium') : t('free')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.analyses_count || 0}</Text>
            <Text style={styles.statLabel}>{t('totalAnalyses')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.subscription === 'premium' ? '∞' : '1'}</Text>
            <Text style={styles.statLabel}>{t('subscription')}</Text>
          </View>
        </View>

        {user?.subscription !== 'premium' && (
          <TouchableOpacity testID="upgrade-btn" onPress={handleUpgrade} activeOpacity={0.8}>
            <LinearGradient
              colors={['#F3D088', '#D1A354']}
              style={styles.upgradeBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="diamond" size={20} color="#000" />
              <Text style={styles.upgradeText}>{t('upgradePremium')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.settingsSection}>
          <Text style={styles.sectionLabel}>{t('settings')}</Text>

          <TouchableOpacity testID="language-toggle" style={styles.settingRow} onPress={toggleLang}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <Text style={styles.settingValue}>{lang === 'tr' ? 'Türkçe' : 'English'}</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="logout-btn" style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.status.error} />
              <Text style={[styles.settingText, { color: COLORS.status.error }]}>{t('logout')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalNote}>
          Uygulama içi satın alma işlemleri Apple App Store üzerinden gerçekleştirilmektedir.
          Abonelik iptali için iOS Ayarlar → Apple ID → Abonelikler menüsünü kullanın.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 24 },
  profileCard: {
    alignItems: 'center', backgroundColor: COLORS.surface.card,
    borderRadius: RADIUS.lg, padding: 28,
    borderWidth: 1, borderColor: COLORS.surface.glassBorder, marginBottom: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { ...FONT.h2, color: COLORS.brand.primary },
  profileName: { ...FONT.h3, color: COLORS.text.primary },
  profileEmail: { ...FONT.small, color: COLORS.text.secondary, marginTop: 4 },
  subBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface.glass, borderWidth: 1, borderColor: COLORS.surface.glassBorder,
  },
  subBadgePremium: { borderColor: COLORS.brand.primary, backgroundColor: 'rgba(229,192,123,0.1)' },
  subText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '600' },
  subTextPremium: { color: COLORS.brand.primary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface.card, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.surface.glassBorder,
  },
  statValue: { ...FONT.h2, color: COLORS.brand.primary },
  statLabel: { ...FONT.xs, color: COLORS.text.secondary, marginTop: 4 },
  upgradeBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 24,
  },
  upgradeText: { ...FONT.body, fontWeight: '700', color: COLORS.text.inverse },
  settingsSection: { marginTop: 8 },
  sectionLabel: {
    ...FONT.small, color: COLORS.text.tertiary, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface.glassBorder,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { ...FONT.body, color: COLORS.text.primary },
  settingValue: { ...FONT.small, color: COLORS.text.secondary },
  legalNote: {
    ...FONT.xs, color: COLORS.text.tertiary,
    textAlign: 'center', marginTop: 32, lineHeight: 18,
  },
});

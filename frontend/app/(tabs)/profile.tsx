import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/utils/theme';
import { purchasePremium, restorePurchases } from '../../src/utils/purchases';
import api from '../../src/utils/api';

const STUDIO_PLUS_FEATURES = [
  'Sinirsiz planlama dosyasi',
  'Gorsel senaryo olusturma',
  'Daha kapsamli danisma sorulari',
];

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cikis Yap', 'Bu cihazdaki oturumu kapatmak istiyor musun?', [
      { text: 'Iptal', style: 'cancel' },
      {
        text: 'Cik',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const isPremium = await purchasePremium();
      if (isPremium) {
        await api.post('/subscription/activate', { plan: 'premium' });
        await refreshUser();
        Alert.alert('Studio+ aktif', 'Planlama araclarinin tamamini kullanmaya baslayabilirsin.');
      }
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Islem tamamlanamadi', error?.message || 'Lutfen daha sonra tekrar dene.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const isPremium = await restorePurchases();
      if (isPremium) {
        await api.post('/subscription/activate', { plan: 'premium' });
        await refreshUser();
        Alert.alert('Basarili', 'Studio+ satin alimlari geri yuklendi.');
      } else {
        Alert.alert('Bilgi', 'Bu Apple hesabi icin aktif Studio+ bulunamadi.');
      }
    } catch {
      Alert.alert('Geri yukleme basarisiz', 'Lutfen biraz sonra tekrar dene.');
    } finally {
      setRestoring(false);
    }
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Hesap merkezi</Text>
          <Text style={styles.screenTitle}>Ayna Atlas hesabini yonet.</Text>
          <Text style={styles.screenSubtitle}>
            Dil tercihin, abonelik durumun ve yasal sayfalar burada tek yerde.
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{user?.name || 'Ayna Atlas kullanicisi'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <View
              style={[
                styles.planPill,
                { backgroundColor: user?.subscription === 'premium' ? 'rgba(255,176,120,0.16)' : 'rgba(107,227,192,0.16)' },
              ]}
            >
              <Text style={[styles.planPillText, { color: user?.subscription === 'premium' ? COLORS.brand.secondary : COLORS.brand.primary }]}>
                {user?.subscription === 'premium' ? 'Studio+' : 'Explorer'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user?.analyses_count || 0}</Text>
              <Text style={styles.statLabel}>toplam dosya</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user?.subscription === 'premium' ? 'Acik' : 'Sinirli'}</Text>
              <Text style={styles.statLabel}>kullanim modu</Text>
            </View>
          </View>

          {user?.subscription !== 'premium' && (
            <View style={styles.plusCard}>
              <Text style={styles.plusEyebrow}>Studio+</Text>
              <Text style={styles.plusTitle}>Daha farkli bir deneyim icin acilan araclar</Text>
              <Text style={styles.plusDescription}>
                Ayna Atlas ucretli katmaninda sadece kilit acmak yerine daha zengin bir planlama
                dosyasi sunar.
              </Text>

              <View style={styles.plusFeatureList}>
                {STUDIO_PLUS_FEATURES.map((feature) => (
                  <View key={feature} style={styles.plusFeatureRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.brand.primary} />
                    <Text style={styles.plusFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                testID="upgrade-btn"
                onPress={handleUpgrade}
                activeOpacity={0.88}
                disabled={purchasing}
              >
                <LinearGradient colors={COLORS.gradient.sunrise} style={styles.upgradeButton}>
                  {purchasing ? (
                    <ActivityIndicator size="small" color={COLORS.text.inverse} />
                  ) : (
                    <>
                      <Ionicons name="sparkles-outline" size={18} color={COLORS.text.inverse} />
                      <Text style={styles.upgradeButtonText}>Studio+ baslat</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                testID="restore-btn"
                onPress={handleRestore}
                activeOpacity={0.8}
                disabled={restoring}
                style={styles.restoreButton}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={COLORS.text.secondary} />
                ) : (
                  <Text style={styles.restoreButtonText}>Satin alimlari geri yukle</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>

            <TouchableOpacity testID="language-toggle" style={styles.row} onPress={() => setLang(lang === 'tr' ? 'en' : 'tr')}>
              <View style={styles.rowLeft}>
                <Ionicons name="globe-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.rowText}>Dil</Text>
              </View>
              <Text style={styles.rowValue}>{lang === 'tr' ? 'Turkce' : 'English'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://faceglowpro.app/privacy')}>
              <View style={styles.rowLeft}>
                <Ionicons name="shield-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.rowText}>Gizlilik politikasi</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://faceglowpro.app/terms')}>
              <View style={styles.rowLeft}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.text.secondary} />
                <Text style={styles.rowText}>Kullanim kosullari</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity testID="logout-btn" style={styles.row} onPress={handleLogout}>
              <View style={styles.rowLeft}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.status.error} />
                <Text style={[styles.rowText, { color: COLORS.status.error }]}>Cikis yap</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            Abonelik ve satin alma islemleri App Store tarafinda yonetilir. Iptal veya degisiklik
            icin iOS Ayarlar &gt; Apple ID &gt; Abonelikler yolunu kullanabilirsin.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  container: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  eyebrow: { ...FONT.xs, color: COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  screenTitle: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 8 },
  screenSubtitle: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 21, marginBottom: 20 },
  profileCard: {
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(107,227,192,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...FONT.h3, color: COLORS.brand.primary, fontWeight: '800' },
  profileMeta: { flex: 1 },
  profileName: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 4 },
  profileEmail: { ...FONT.xs, color: COLORS.text.secondary },
  planPill: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 8 },
  planPillText: { ...FONT.xs, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  statValue: { ...FONT.h3, color: COLORS.text.primary, marginBottom: 4 },
  statLabel: { ...FONT.xs, color: COLORS.text.tertiary },
  plusCard: {
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,176,120,0.22)',
    marginBottom: 16,
  },
  plusEyebrow: { ...FONT.xs, color: COLORS.brand.secondary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  plusTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 8 },
  plusDescription: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 14 },
  plusFeatureList: { gap: 10, marginBottom: 16 },
  plusFeatureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  plusFeatureText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  upgradeButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  upgradeButtonText: { ...FONT.body, color: COLORS.text.inverse, fontWeight: '800' },
  restoreButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  restoreButtonText: { ...FONT.small, color: COLORS.text.tertiary, textDecorationLine: 'underline' },
  settingsCard: {
    backgroundColor: 'rgba(16,27,50,0.92)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { ...FONT.body, color: COLORS.text.primary },
  rowValue: { ...FONT.small, color: COLORS.text.secondary },
  footerNote: {
    ...FONT.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
  },
});

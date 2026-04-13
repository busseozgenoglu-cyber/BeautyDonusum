import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { purchasePremium, restorePurchases } from '../../src/utils/purchases';
import api from '../../src/utils/api';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: t('logout'), style: 'destructive',
        onPress: async () => { await logout(); router.replace('/auth'); },
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
        Alert.alert('Tebrikler!', 'Premium aboneliğiniz aktif edildi.');
      }
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert('Hata', e?.message || 'Satın alma tamamlanamadı.');
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
        Alert.alert('Başarılı', 'Satın alımlarınız geri yüklendi.');
      } else {
        Alert.alert('Bilgi', 'Aktif premium abonelik bulunamadı.');
      }
    } catch {
      Alert.alert('Hata', 'Geri yükleme başarısız.');
    } finally {
      setRestoring(false);
    }
  };

  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('profile')}</Text>

        <View style={styles.profileCard}>
          <LinearGradient colors={['#EEF2FF', '#F0FDFA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.avatar}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.avatarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.subBadge, user?.subscription === 'premium' && styles.subBadgePremium]}>
            <Ionicons
              name={user?.subscription === 'premium' ? 'diamond' : 'person'}
              size={14}
              color={user?.subscription === 'premium' ? '#D97706' : COLORS.brand.primary}
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
            <Text style={styles.statValue}>{user?.subscription === 'premium' ? 'Aktif' : 'Standart'}</Text>
            <Text style={styles.statLabel}>{t('subscription')}</Text>
          </View>
        </View>

        {user?.subscription !== 'premium' && (
          <>
            <TouchableOpacity testID="upgrade-btn" onPress={handleUpgrade} activeOpacity={0.8} disabled={purchasing}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.upgradeBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="diamond" size={20} color="#fff" />
                    <Text style={styles.upgradeText}>{t('upgradePremium')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity testID="restore-btn" onPress={handleRestore} activeOpacity={0.7} disabled={restoring} style={styles.restoreBtn}>
              {restoring ? (
                <ActivityIndicator size="small" color={COLORS.text.tertiary} />
              ) : (
                <Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.settingsSection}>
          <Text style={styles.sectionLabel}>{t('settings')}</Text>

          <TouchableOpacity testID="language-toggle" style={styles.settingRow} onPress={toggleLang}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}><Ionicons name="globe-outline" size={18} color={COLORS.brand.primary} /></View>
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{lang === 'tr' ? 'TR' : 'EN'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity testID="logout-btn" style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}><Ionicons name="log-out-outline" size={18} color={COLORS.status.error} /></View>
              <Text style={[styles.settingText, { color: COLORS.status.error }]}>{t('logout')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://estetikpusula.app/privacy')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}><Ionicons name="shield-outline" size={18} color={COLORS.brand.primary} /></View>
              <Text style={styles.settingText}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://estetikpusula.app/terms')}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}><Ionicons name="document-text-outline" size={18} color={COLORS.brand.primary} /></View>
              <Text style={styles.settingText}>Kullanım Koşulları</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
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
  title: { ...FONT.h1, color: COLORS.text.primary, marginBottom: 24 },
  profileCard: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl, padding: 28, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20,
  },
  avatar: { marginBottom: 14 },
  avatarGrad: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  profileName: { ...FONT.h3, color: COLORS.text.primary },
  profileEmail: { ...FONT.small, color: COLORS.text.secondary, marginTop: 4 },
  subBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#DBEAFE',
  },
  subBadgePremium: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  subText: { ...FONT.xs, color: COLORS.brand.primary, fontWeight: '600' },
  subTextPremium: { color: '#D97706' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft,
  },
  statValue: { ...FONT.h2, color: COLORS.brand.primary },
  statLabel: { ...FONT.xs, color: COLORS.text.tertiary, marginTop: 4 },
  upgradeBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 10,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  upgradeText: { ...FONT.body, fontWeight: '700', color: '#FFFFFF' },
  restoreBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, marginBottom: 14,
  },
  restoreText: { ...FONT.small, color: COLORS.text.tertiary, textDecorationLine: 'underline' },
  settingsSection: { marginTop: 8 },
  sectionLabel: {
    ...FONT.small, color: COLORS.text.tertiary, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  settingText: { ...FONT.body, color: COLORS.text.primary },
  langBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  langBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.brand.primary },
  legalNote: {
    ...FONT.xs, color: COLORS.text.tertiary,
    textAlign: 'center', marginTop: 32, lineHeight: 18,
  },
});

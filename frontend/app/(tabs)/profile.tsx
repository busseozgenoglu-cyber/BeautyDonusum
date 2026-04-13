import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { purchasePremium, restorePurchases } from '../../src/utils/purchases';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../src/utils/api';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const isPremium = user?.subscription === 'premium';

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: async () => { await logout(); router.replace('/auth'); } },
    ]);
  };

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePremium();
      if (result) {
        await api.post('/subscription/activate', { plan: 'premium' });
        await refreshUser();
        Alert.alert('Tebrikler!', 'Premium aboneliğiniz aktif edildi.');
      }
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert('Hata', e?.message || 'Satın alma tamamlanamadı.');
    } finally { setPurchasing(false); }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result) {
        await api.post('/subscription/activate', { plan: 'premium' });
        await refreshUser();
        Alert.alert('Başarılı', 'Satın alımlarınız geri yüklendi.');
      } else {
        Alert.alert('Bilgi', 'Aktif premium abonelik bulunamadı.');
      }
    } catch { Alert.alert('Hata', 'Geri yükleme başarısız.'); }
    finally { setRestoring(false); }
  };

  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.title}>{t('profile')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.profileCard}>
            <LinearGradient
              colors={isPremium ? ['rgba(45,212,168,0.08)', 'rgba(45,212,168,0.02)'] : ['rgba(247,133,110,0.06)', 'rgba(247,133,110,0.02)']}
              style={StyleSheet.absoluteFill}
              borderRadius={RADIUS.lg}
            />
            <View style={[styles.avatar, isPremium && styles.avatarPremium]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'K'}
              </Text>
            </View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={[styles.subBadge, isPremium && styles.subBadgePremium]}>
              <Ionicons name={isPremium ? 'diamond' : 'leaf-outline'} size={14} color={isPremium ? '#2DD4A8' : '#F7856E'} />
              <Text style={[styles.subText, isPremium && styles.subTextPremium]}>
                {isPremium ? t('premium') : t('free')}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user?.analyses_count || 0}</Text>
              <Text style={styles.statLabel}>{t('totalAnalyses')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{isPremium ? '∞' : '1'}</Text>
              <Text style={styles.statLabel}>{t('subscription')}</Text>
            </View>
          </Animated.View>

          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(240).duration(400)}>
              <TouchableOpacity testID="upgrade-btn" onPress={handleUpgrade} activeOpacity={0.8} disabled={purchasing}>
                <LinearGradient colors={['#2DD4A8', '#1A9B7A']} style={styles.upgradeBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {purchasing ? (
                    <ActivityIndicator size="small" color="#050D0F" />
                  ) : (
                    <>
                      <Ionicons name="diamond" size={20} color="#050D0F" />
                      <Text style={styles.upgradeText}>{t('upgradePremium')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity testID="restore-btn" onPress={handleRestore} activeOpacity={0.7} disabled={restoring} style={styles.restoreBtn}>
                {restoring ? <ActivityIndicator size="small" color={COLORS.text.tertiary} /> : <Text style={styles.restoreText}>Satın Alımları Geri Yükle</Text>}
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>{t('settings')}</Text>

            <TouchableOpacity testID="language-toggle" style={styles.settingRow} onPress={toggleLang}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}><Ionicons name="globe-outline" size={18} color="#2DD4A8" /></View>
                <Text style={styles.settingText}>{t('language')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{lang === 'tr' ? 'Türkçe' : 'English'}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity testID="logout-btn" style={styles.settingRow} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(247,86,74,0.1)' }]}><Ionicons name="log-out-outline" size={18} color={COLORS.status.error} /></View>
                <Text style={[styles.settingText, { color: COLORS.status.error }]}>{t('logout')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://yuzatolyem.app/privacy')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}><Ionicons name="shield-outline" size={18} color="#8BA5A0" /></View>
                <Text style={styles.settingText}>Gizlilik Politikası</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://yuzatolyem.app/terms')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}><Ionicons name="document-text-outline" size={18} color="#8BA5A0" /></View>
                <Text style={styles.settingText}>Kullanım Koşulları</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legalNote}>
            Uygulama içi satın alma işlemleri Apple App Store üzerinden gerçekleştirilmektedir.
            Abonelik iptali için iOS Ayarlar → Apple ID → Abonelikler menüsünü kullanın.
          </Text>

          <Text style={styles.version}>Yüz Atölyem v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  container: { flex: 1 },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 24 },

  profileCard: {
    alignItems: 'center', backgroundColor: '#0C1619',
    borderRadius: RADIUS.lg, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20, overflow: 'hidden',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(247,133,110,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: 'rgba(247,133,110,0.2)',
  },
  avatarPremium: { backgroundColor: 'rgba(45,212,168,0.1)', borderColor: 'rgba(45,212,168,0.3)' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#F7856E' },
  profileName: { ...FONT.h3, color: COLORS.text.primary },
  profileEmail: { ...FONT.small, color: COLORS.text.secondary, marginTop: 4 },
  subBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(247,133,110,0.06)', borderWidth: 1, borderColor: 'rgba(247,133,110,0.15)',
  },
  subBadgePremium: { borderColor: 'rgba(45,212,168,0.25)', backgroundColor: 'rgba(45,212,168,0.06)' },
  subText: { ...FONT.xs, color: '#F7856E', fontWeight: '600' },
  subTextPremium: { color: '#2DD4A8' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#0C1619', borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#2DD4A8' },
  statLabel: { ...FONT.xs, color: COLORS.text.secondary, marginTop: 4 },

  upgradeBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10,
  },
  upgradeText: { ...FONT.body, fontWeight: '700', color: '#050D0F' },
  restoreBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginBottom: 14 },
  restoreText: { ...FONT.small, color: COLORS.text.tertiary, textDecorationLine: 'underline' },

  settingsSection: { marginTop: 8 },
  sectionLabel: { ...FONT.small, color: COLORS.text.tertiary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(45,212,168,0.08)', alignItems: 'center', justifyContent: 'center' },
  settingText: { ...FONT.body, color: COLORS.text.primary },
  settingValue: { ...FONT.small, color: COLORS.text.secondary },

  legalNote: { ...FONT.xs, color: COLORS.text.tertiary, textAlign: 'center', marginTop: 32, lineHeight: 18 },
  version: { ...FONT.xs, color: 'rgba(90,122,116,0.4)', textAlign: 'center', marginTop: 12 },
});

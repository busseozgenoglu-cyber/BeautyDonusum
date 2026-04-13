import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { purchasePremium, restorePurchases } from '../../src/utils/purchases';
import api from '../../src/utils/api';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('logout'), lang === 'en' ? 'Sign out?' : 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: lang === 'en' ? 'Cancel' : 'İptal', style: 'cancel' },
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
        Alert.alert(lang === 'en' ? 'Success' : 'Tebrikler!', lang === 'en' ? 'Premium is active.' : 'Premium aboneliğiniz aktif edildi.');
      }
    } catch (e: any) {
      if (e?.userCancelled) return;
      Alert.alert(lang === 'en' ? 'Error' : 'Hata', e?.message || (lang === 'en' ? 'Purchase could not be completed.' : 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.'));
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
        Alert.alert(lang === 'en' ? 'Success' : 'Başarılı', lang === 'en' ? 'Purchases restored.' : 'Satın alımlarınız geri yüklendi.');
      } else {
        Alert.alert(lang === 'en' ? 'Info' : 'Bilgi', lang === 'en' ? 'No active premium subscription found.' : 'Aktif premium abonelik bulunamadı.');
      }
    } catch {
      Alert.alert(lang === 'en' ? 'Error' : 'Hata', lang === 'en' ? 'Restore failed.' : 'Geri yükleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setRestoring(false);
    }
  };

  const exportConsultPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const { data: hist } = await api.get('/analysis/user/history');
      const first = (hist.analyses || [])[0];
      if (!first?.analysis_id) {
        Alert.alert(lang === 'en' ? 'Info' : 'Bilgi', t('pdfNoAnalysis'));
        return;
      }
      const [{ data: full }, { data: clip }, { data: consult }] = await Promise.all([
        api.get(`/analysis/${first.analysis_id}/full`),
        api.get('/consent/clip-text', { params: { lang } }),
        api.get(`/analysis/${first.analysis_id}/consult-checklist`),
      ]);
      const recs = full.recommendations || {};
      const metrics = full.metrics || {};
      const recList: any[] = recs.recommendations || [];
      const metricRows = Object.entries(metrics)
        .filter(([k]) => k !== 'face_shape')
        .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${typeof v === 'number' ? v.toFixed(2) : escapeHtml(String(v))}</td></tr>`)
        .join('');
      const recRows = recList.map((r) => `
        <tr>
          <td>${escapeHtml(r.title || '')}</td>
          <td>${escapeHtml(r.area || '')}</td>
          <td>${escapeHtml(r.priority || '')}</td>
        </tr>
      `).join('');
      const ck = consult.checklist || {};
      const sectionsHtml = (ck.sections || []).map((sec: any) => `
        <h3 style="color:#0D5C5E;font-size:14px;margin:16px 0 8px;">${escapeHtml(sec.heading || '')}</h3>
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:12px;line-height:1.5;">
          ${(sec.items || []).map((it: string) => `<li>${escapeHtml(it)}</li>`).join('')}
        </ul>
      `).join('');
      const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(t('pdfReportTitle'))}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:28px;color:#0F172A;background:#fff;">
  <h1 style="font-size:20px;margin:0 0 8px;">VISAGE Clinic Anteprima</h1>
  <p style="margin:0 0 20px;color:#64748B;font-size:12px;">${escapeHtml(t('pdfReportTitle'))} · ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</p>
  <h2 style="font-size:14px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">${lang === 'en' ? 'Patient' : 'Hasta'}</h2>
  <p style="font-size:12px;color:#334155;">${escapeHtml(user?.name || '')}<br/>${escapeHtml(user?.email || '')}</p>
  <h2 style="font-size:14px;margin-top:20px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">${lang === 'en' ? 'Consent notice' : 'Onay metni'}</h2>
  <p style="font-size:11px;color:#475569;white-space:pre-wrap;line-height:1.5;">${escapeHtml(clip.text || '')}</p>
  <h2 style="font-size:14px;margin-top:20px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">${lang === 'en' ? 'Metrics' : 'Metrikler'}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:11px;">${metricRows || '<tr><td colspan="2">—</td></tr>'}</table>
  <h2 style="font-size:14px;margin-top:20px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">${lang === 'en' ? 'Recommendations' : 'Öneriler'}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:11px;">
    <tr style="background:#F1F5F9;"><th align="left">${lang === 'en' ? 'Title' : 'Başlık'}</th><th align="left">${lang === 'en' ? 'Area' : 'Bölge'}</th><th align="left">${lang === 'en' ? 'Priority' : 'Öncelik'}</th></tr>
    ${recRows || '<tr><td colspan="3">—</td></tr>'}
  </table>
  <h2 style="font-size:14px;margin-top:20px;border-bottom:1px solid #E2E8F0;padding-bottom:6px;">${escapeHtml(ck.title || t('consultChecklistTitle'))}</h2>
  ${ck.intro ? `<p style="font-size:12px;color:#334155;line-height:1.5;">${escapeHtml(ck.intro)}</p>` : ''}
  ${sectionsHtml}
  ${ck.disclaimer ? `<p style="font-size:10px;color:#94A3B8;margin-top:16px;font-style:italic;">${escapeHtml(ck.disclaimer)}</p>` : ''}
  <p style="font-size:10px;color:#94A3B8;margin-top:24px;">${escapeHtml(t('disclaimer'))}</p>
</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('exportPdf') });
        Alert.alert(lang === 'en' ? 'Done' : 'Tamam', t('pdfExported'));
      } else {
        Alert.alert(lang === 'en' ? 'Saved' : 'Kaydedildi', uri);
      }
    } catch {
      Alert.alert(lang === 'en' ? 'Error' : 'Hata', t('pdfError'));
    } finally {
      setPdfLoading(false);
    }
  }, [lang, t, user?.email, user?.name]);

  useFocusEffect(useCallback(() => { refreshUser(); }, [refreshUser]));

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
              name={user?.subscription === 'premium' ? 'ribbon' : 'person-outline'}
              size={14}
              color={user?.subscription === 'premium' ? COLORS.brand.secondary : COLORS.text.secondary}
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

        <TouchableOpacity
          testID="export-consult-pdf-btn"
          style={styles.pdfBtnWrap}
          onPress={exportConsultPdf}
          disabled={pdfLoading}
          activeOpacity={0.88}
        >
          <LinearGradient colors={[...COLORS.gradient.navy]} style={styles.pdfBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {pdfLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="document-attach-outline" size={20} color="#fff" />
                <Text style={styles.pdfBtnText}>{t('exportPdf')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.pdfHint}>{t('consultPrep')}</Text>

        {user?.subscription !== 'premium' && (
          <>
            <TouchableOpacity testID="upgrade-btn" onPress={handleUpgrade} activeOpacity={0.8} disabled={purchasing}>
              <LinearGradient
                colors={[...COLORS.gradient.teal]}
                style={styles.upgradeBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="star" size={20} color="#fff" />
                    <Text style={styles.upgradeText}>{t('upgradePremium')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity testID="restore-btn" onPress={handleRestore} activeOpacity={0.7} disabled={restoring} style={styles.restoreBtn}>
              {restoring ? (
                <ActivityIndicator size="small" color={COLORS.text.tertiary} />
              ) : (
                <Text style={styles.restoreText}>{t('restorePurchases')}</Text>
              )}
            </TouchableOpacity>
          </>
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

          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://visageclinic.app/privacy')}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.settingText}>{lang === 'en' ? 'Privacy policy' : 'Gizlilik Politikası'}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://visageclinic.app/terms')}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.text.secondary} />
              <Text style={styles.settingText}>{lang === 'en' ? 'Terms of use' : 'Kullanım Koşulları'}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.legalNote}>
          {lang === 'en'
            ? 'In-app purchases are processed by the Apple App Store. To cancel a subscription, use iOS Settings → Apple ID → Subscriptions.'
            : 'Uygulama içi satın alma işlemleri Apple App Store üzerinden gerçekleştirilmektedir. Abonelik iptali için iOS Ayarlar → Apple ID → Abonelikler menüsünü kullanın.'}
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
    borderWidth: 1, borderColor: COLORS.border.subtle, marginBottom: 20, ...SHADOWS.card,
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
    backgroundColor: COLORS.bg.primary, borderWidth: 1, borderColor: COLORS.border.subtle,
  },
  subBadgePremium: { borderColor: COLORS.brand.secondary, backgroundColor: 'rgba(201,162,39,0.1)' },
  subText: { ...FONT.xs, color: COLORS.text.secondary, fontWeight: '600' },
  subTextPremium: { color: COLORS.brand.secondary },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface.card, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card,
  },
  statValue: { ...FONT.h2, color: COLORS.brand.primary },
  statLabel: { ...FONT.xs, color: COLORS.text.secondary, marginTop: 4 },
  pdfBtnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 8 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 15,
  },
  pdfBtnText: { ...FONT.body, fontWeight: '700', color: '#fff' },
  pdfHint: { ...FONT.xs, color: COLORS.text.tertiary, marginBottom: 18, textAlign: 'center', lineHeight: 16 },
  upgradeBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 10, ...SHADOWS.soft,
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
    textTransform: 'uppercase', letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border.subtle,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { ...FONT.body, color: COLORS.text.primary },
  settingValue: { ...FONT.small, color: COLORS.text.secondary },
  legalNote: {
    ...FONT.xs, color: COLORS.text.tertiary,
    textAlign: 'center', marginTop: 32, lineHeight: 18,
  },
});

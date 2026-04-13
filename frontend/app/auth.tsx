import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, FONT, RADIUS, SPACING } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const VALUE_POINTS = [
  'Konsultasyon oncesi sorulacak sorulari toparlar',
  'Yuz sekline gore stil onerilerini dosyalar',
  'Klinik gorusmeler icin net bir hazirlik ciktisi verir',
];

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, register, googleLogin } = useAuth();
  const router = useRouter();

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Lutfen tum alanlari doldurun');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Lutfen adinizi girin');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin + '/#auth-callback'
        : Linking.createURL('auth-callback');
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const sessionId = new URLSearchParams(result.url.split('#')[1] || '').get('session_id');
        if (sessionId) {
          setLoading(true);
          await googleLogin(sessionId);
          router.replace('/(tabs)/home');
        }
      }
    } catch {
      setError('Google girisi basarisiz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={COLORS.gradient.midnight} style={StyleSheet.absoluteFill} />
      <View style={s.bloomTop} />
      <View style={s.bloomBottom} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(500)} style={s.heroCard}>
              <View style={s.brandMark}>
                <LinearGradient colors={COLORS.gradient.sunset} style={s.brandMarkGradient}>
                  <Ionicons name="map-outline" size={28} color={COLORS.text.inverse} />
                </LinearGradient>
              </View>
              <Text style={s.appName}>Ayna Atlas</Text>
              <Text style={s.appTag}>Yuz analizinizi karara donusen bir plan dosyasina cevirin.</Text>

              <View style={s.valueList}>
                {VALUE_POINTS.map((item) => (
                  <View key={item} style={s.valueRow}>
                    <View style={s.valueDot} />
                    <Text style={s.valueText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(450)} style={s.tabs}>
              {(['login', 'register'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  testID={`${tab}-tab`}
                  style={[s.tab, mode === tab && s.tabActive]}
                  onPress={() => {
                    setMode(tab);
                    setError('');
                  }}
                >
                  <Text style={[s.tabText, mode === tab && s.tabTextActive]}>
                    {tab === 'login' ? 'Giris yap' : 'Hesap olustur'}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {error ? (
              <Animated.View entering={FadeIn.duration(250)} style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.status.error} />
                <Text style={s.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(160).duration(450)} style={s.formCard}>
              {mode === 'register' && (
                <View style={s.field}>
                  <Ionicons name="person-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                  <TextInput
                    testID="name-input"
                    style={s.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor={COLORS.text.tertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={s.field}>
                <Ionicons name="mail-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput
                  testID="email-input"
                  style={s.input}
                  placeholder="E-posta"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={s.field}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput
                  testID="password-input"
                  style={[s.input, { flex: 1 }]}
                  placeholder="Sifre"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass((value) => !value)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity testID="auth-submit-btn" onPress={submit} disabled={loading} activeOpacity={0.86}>
                <LinearGradient colors={COLORS.gradient.sunset} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.text.inverse} />
                  ) : (
                    <>
                      <Ionicons name="arrow-forward-circle-outline" size={18} color={COLORS.text.inverse} />
                      <Text style={s.submitText}>{mode === 'login' ? 'Atlas a giris yap' : 'Ilk dosyami olustur'}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>veya</Text>
                <View style={s.dividerLine} />
              </View>

              <TouchableOpacity testID="google-login-btn" style={s.googleBtn} onPress={handleGoogle} activeOpacity={0.86}>
                <Ionicons name="logo-google" size={18} color={COLORS.text.primary} />
                <Text style={s.googleText}>Google ile devam et</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(450)} style={s.legalCard}>
              <Text style={s.legalText}>Devam ederek yasal belgeleri kabul edersiniz.</Text>
              <View style={s.legalLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://aynaatlas.app/terms')}>
                  <Text style={s.legalLink}>Kullanim Kosullari</Text>
                </TouchableOpacity>
                <Text style={s.legalDot}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://aynaatlas.app/privacy')}>
                  <Text style={s.legalLink}>Gizlilik Politikasi</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xxl },
  bloomTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.brand.primary,
    opacity: 0.18,
  },
  bloomBottom: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.brand.secondary,
    opacity: 0.14,
  },
  heroCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    padding: 24,
    marginBottom: 18,
  },
  brandMark: {
    width: 68,
    height: 68,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  brandMarkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  appTag: {
    ...FONT.small,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  valueList: { gap: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  valueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand.primary,
    marginTop: 6,
  },
  valueText: { ...FONT.small, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'rgba(246,140,63,0.14)' },
  tabText: { ...FONT.small, color: COLORS.text.tertiary, fontWeight: '600' },
  tabTextActive: { color: COLORS.brand.primary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  errorText: { ...FONT.small, color: COLORS.status.error, flex: 1 },
  formCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    padding: 20,
    gap: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    paddingHorizontal: 14,
  },
  fieldIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 15,
    paddingVertical: 15,
  },
  eye: { padding: 4 },
  submitBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  submitText: { ...FONT.body, color: COLORS.text.inverse, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surface.glassBorder },
  dividerText: { ...FONT.xs, color: COLORS.text.tertiary },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    backgroundColor: COLORS.surface.elevated,
  },
  googleText: { ...FONT.body, color: COLORS.text.primary, fontWeight: '600' },
  legalCard: {
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  legalText: { ...FONT.xs, color: COLORS.text.tertiary, textAlign: 'center' },
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legalLink: {
    ...FONT.xs,
    color: COLORS.brand.primary,
    textDecorationLine: 'underline',
  },
  legalDot: { color: COLORS.text.tertiary },
});

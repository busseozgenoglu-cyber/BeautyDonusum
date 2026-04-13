import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS, SHADOWS } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, register, googleLogin } = useAuth();
  const { t, lang } = useLang();
  const router = useRouter();

  const submit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Lütfen tüm alanları doldurun'); return; }
    if (mode === 'register' && !name.trim()) { setError('Lütfen adınızı girin'); return; }
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const d = e.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Bir hata oluştu');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = Platform.OS === 'web' ? window.location.origin + '/#auth-callback' : Linking.createURL('auth-callback');
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      if (Platform.OS === 'web') { window.location.href = authUrl; return; }
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === 'success' && result.url) {
        const sessionId = new URLSearchParams(result.url.split('#')[1] || '').get('session_id');
        if (sessionId) { setLoading(true); await googleLogin(sessionId); router.replace('/(tabs)/home'); }
      }
    } catch { setError('Google giriş hatası'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#F4F8F7', '#EEF2F4', '#F4F6F8']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={s.bloomTeal} />
      <View style={s.bloomNavy} />
      <View style={s.bloomGold} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(600)} style={s.logo}>
              <View style={s.logoGlow} />
              <View style={s.logoBox}>
                <LinearGradient colors={[...COLORS.gradient.teal]} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="medical-outline" size={34} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={s.appName}>{t('appName')}</Text>
              <Text style={s.appTag}>{t('tagline')}</Text>
            </Animated.View>

            {/* Tabs */}
            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={s.tabs}>
              {(['login', 'register'] as const).map(m => (
                <TouchableOpacity key={m} testID={`${m}-tab`} style={[s.tab, mode === m && s.tabOn]} onPress={() => { setMode(m); setError(''); }}>
                  {mode === m && <LinearGradient colors={['rgba(13,92,94,0.12)', 'rgba(13,92,94,0.04)']} style={StyleSheet.absoluteFill} borderRadius={12} />}
                  <Text style={[s.tabTxt, mode === m && s.tabTxtOn]}>{m === 'login' ? t('login') : t('register')}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Error */}
            {error ? (
              <Animated.View entering={FadeIn.duration(300)} style={s.errBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF453A" />
                <Text style={s.errTxt}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Inputs */}
            <Animated.View entering={FadeInDown.delay(220).duration(500)} style={s.fields}>
              {mode === 'register' && (
                <View style={s.field}>
                  <Ionicons name="person-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                  <TextInput testID="name-input" style={s.input} placeholder={t('name')} placeholderTextColor={COLORS.text.tertiary} value={name} onChangeText={setName} autoCapitalize="words" />
                </View>
              )}
              <View style={s.field}>
                <Ionicons name="mail-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput testID="email-input" style={s.input} placeholder={t('email')} placeholderTextColor={COLORS.text.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={s.field}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput testID="password-input" style={[s.input, { flex: 1 }]} placeholder={t('password')} placeholderTextColor={COLORS.text.tertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(320).duration(500)}>
              <TouchableOpacity testID="auth-submit-btn" onPress={submit} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[...COLORS.gradient.teal]} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>{mode === 'login' ? t('login') : t('register')}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.div}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>{t('or')}</Text>
              <View style={s.divLine} />
            </Animated.View>

            {/* Google */}
            <Animated.View entering={FadeInDown.delay(460)}>
              <TouchableOpacity testID="google-login-btn" style={s.google} onPress={handleGoogle} activeOpacity={0.85}>
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={s.googleTxt}>{t('googleLogin')}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(540)} style={s.legalRow}>
              <Text style={s.footnote}>Devam ederek </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://visageclinic.app/terms')}>
                <Text style={s.legalLink}>{lang === 'en' ? 'Terms' : 'Kullanım Koşulları'}</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>{lang === 'en' ? ' and ' : '\'nı ve '}</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://visageclinic.app/privacy')}>
                <Text style={s.legalLink}>{lang === 'en' ? 'Privacy' : 'Gizlilik Politikası'}</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>{lang === 'en' ? '.' : '\'nı kabul etmiş olursunuz.'}</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bloomTeal: { position: 'absolute', top: -70, left: -50, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.brand.primary, opacity: 0.09 },
  bloomNavy: { position: 'absolute', bottom: -30, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.brand.accent, opacity: 0.07 },
  bloomGold: { position: 'absolute', top: 90, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.brand.secondary, opacity: 0.12 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },

  logo: { alignItems: 'center', marginBottom: 36 },
  logoGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.brand.primary, opacity: 0.2, transform: [{ scale: 1.5 }] },
  logoBox: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 0.3, marginBottom: 6, textAlign: 'center' },
  appTag: { fontSize: 13, color: COLORS.brand.primary, opacity: 0.95, textAlign: 'center', paddingHorizontal: 16 },

  tabs: { flexDirection: 'row', marginBottom: 22, backgroundColor: COLORS.surface.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, overflow: 'hidden' },
  tabOn: { borderWidth: 1, borderColor: COLORS.brand.primary },
  tabTxt: { fontSize: 15, color: COLORS.text.tertiary, fontWeight: '600' },
  tabTxtOn: { color: COLORS.brand.primary },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)' },
  errTxt: { fontSize: 13, color: '#FF453A', flex: 1 },

  fields: { gap: 12, marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle, borderRadius: 14, paddingHorizontal: 16 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text.primary, paddingVertical: 16 },
  eye: { padding: 4 },

  submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitTxt: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  div: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border.subtle },
  divTxt: { fontSize: 13, color: COLORS.text.tertiary, marginHorizontal: 14 },

  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle, borderRadius: 16, paddingVertical: 16, ...SHADOWS.card },
  googleTxt: { fontSize: 15, color: COLORS.text.primary, fontWeight: '600' },

  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  footnote: { fontSize: 11, color: COLORS.text.tertiary, lineHeight: 18 },
  legalLink: { fontSize: 11, color: COLORS.brand.primary, lineHeight: 18, textDecorationLine: 'underline' },
});

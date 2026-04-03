import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../src/utils/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, googleLogin } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Lütfen tüm alanları doldurun'); return; }
    if (mode === 'register' && !name.trim()) { setError('Lütfen adınızı girin'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Bir hata oluştu');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin + '/#auth-callback'
        : Linking.createURL('auth-callback');
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          const hash = result.url.split('#')[1] || '';
          const params = new URLSearchParams(hash);
          const sessionId = params.get('session_id');
          if (sessionId) {
            setLoading(true);
            await googleLogin(sessionId);
            router.replace('/(tabs)/home');
          }
        }
      }
    } catch (e: any) {
      setError('Google giriş hatası');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      {/* Vibrant background gradient */}
      <LinearGradient
        colors={COLORS.gradient.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      {/* Decorative glow blobs */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <LinearGradient colors={COLORS.gradient.logoBorder} style={styles.logoBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.logoInner}>
                    <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.logoGradient}>
                      <Text style={styles.logoLetter}>F</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.title}>{t('appName')}</Text>
              <Text style={styles.subtitle}>{t('tagline')}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity testID="login-tab" style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => { setMode('login'); setError(''); }}>
                {mode === 'login' && <LinearGradient colors={COLORS.gradient.vibrant} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="register-tab" style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => { setMode('register'); setError(''); }}>
                {mode === 'register' && <LinearGradient colors={COLORS.gradient.vibrant} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>{t('register')}</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {mode === 'register' && (
              <TextInput testID="name-input" style={styles.input} placeholder={t('name')} placeholderTextColor="rgba(255,255,255,0.3)"
                value={name} onChangeText={setName} autoCapitalize="words" />
            )}
            <TextInput testID="email-input" style={styles.input} placeholder={t('email')} placeholderTextColor="rgba(255,255,255,0.3)"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput testID="password-input" style={styles.input} placeholder={t('password')} placeholderTextColor="rgba(255,255,255,0.3)"
              value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity testID="auth-submit-btn" onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={COLORS.gradient.vibrant} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{mode === 'login' ? t('login') : t('register')}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity testID="google-login-btn" style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={20} color={COLORS.text.primary} />
              <Text style={styles.googleText}>{t('googleLogin')}</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', paddingVertical: SPACING.xxl },

  // Decorative glows
  glowTopRight: {
    position: 'absolute', top: -80, right: -60,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(176,110,255,0.18)',
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -60, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(110,174,255,0.14)',
  },

  // Header
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrapper: { marginBottom: 18 },
  logoBorder: { width: 80, height: 80, borderRadius: 26, padding: 3, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden' },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 36, fontWeight: '700', color: '#000' },
  title: { ...FONT.h2, color: COLORS.text.primary, letterSpacing: 1.5 },
  subtitle: { ...FONT.small, color: 'rgba(255,255,255,0.5)', marginTop: 6 },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.sm, overflow: 'hidden' },
  tabActive: {},
  tabText: { ...FONT.body, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  // Form
  error: { ...FONT.small, color: '#FF6B6B', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(176,110,255,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...FONT.body,
    color: COLORS.text.primary,
    marginBottom: 14,
  },
  submitBtn: { borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  submitText: { ...FONT.body, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { ...FONT.small, color: 'rgba(255,255,255,0.35)', marginHorizontal: 16 },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md, paddingVertical: 14, gap: 10,
  },
  googleText: { ...FONT.body, color: COLORS.text.primary },
});

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.logoGradient}>
                <Text style={styles.logoLetter}>F</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>{t('appName')}</Text>
            <Text style={styles.subtitle}>{t('tagline')}</Text>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity testID="login-tab" style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => { setMode('login'); setError(''); }}>
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>{t('login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="register-tab" style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => { setMode('register'); setError(''); }}>
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>{t('register')}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {mode === 'register' && (
            <TextInput testID="name-input" style={styles.input} placeholder={t('name')} placeholderTextColor={COLORS.text.tertiary}
              value={name} onChangeText={setName} autoCapitalize="words" />
          )}
          <TextInput testID="email-input" style={styles.input} placeholder={t('email')} placeholderTextColor={COLORS.text.tertiary}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput testID="password-input" style={styles.input} placeholder={t('password')} placeholderTextColor={COLORS.text.tertiary}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity testID="auth-submit-btn" onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={['#F3D088', '#D1A354']} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{mode === 'login' ? t('login') : t('register')}</Text>}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  logoGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 32, fontWeight: '700', color: '#000' },
  title: { ...FONT.h2, color: COLORS.text.primary, letterSpacing: 1 },
  subtitle: { ...FONT.small, color: COLORS.text.secondary, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 24, backgroundColor: COLORS.bg.secondary, borderRadius: RADIUS.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.surface.elevated },
  tabText: { ...FONT.body, color: COLORS.text.tertiary },
  tabTextActive: { color: COLORS.brand.primary, fontWeight: '600' },
  error: { ...FONT.small, color: COLORS.status.error, textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: COLORS.bg.secondary, borderWidth: 1, borderColor: COLORS.surface.glassBorder, borderRadius: RADIUS.md, padding: SPACING.md, ...FONT.body, color: COLORS.text.primary, marginBottom: 12 },
  submitBtn: { borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { ...FONT.body, fontWeight: '700', color: COLORS.text.inverse },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.surface.glassBorder },
  dividerText: { ...FONT.small, color: COLORS.text.tertiary, marginHorizontal: 16 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg.secondary, borderWidth: 1, borderColor: COLORS.surface.glassBorder, borderRadius: RADIUS.md, paddingVertical: 14, gap: 10 },
  googleText: { ...FONT.body, color: COLORS.text.primary },
});

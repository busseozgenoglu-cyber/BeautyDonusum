import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useLang } from '../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../src/utils/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  withSpring,
} from 'react-native-reanimated';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, googleLogin, error: authError, clearError } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const tabAnim = useSharedValue(0); // 0 = login, 1 = register
  const formOpacity = useSharedValue(1);
  const headerScale = useSharedValue(0.85);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    headerOpacity.value = withTiming(1, { duration: 700 });
  }, []);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const switchMode = (newMode: 'login' | 'register') => {
    formOpacity.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 250 }));
    tabAnim.value = withTiming(newMode === 'register' ? 1 : 0, { duration: 250 });
    setMode(newMode);
    setError('');
    clearError?.();
  };

  const validateForm = (): boolean => {
    if (mode === 'register' && !name.trim()) {
      setError(t('errorNameRequired') || 'Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError(t('errorEmailRequired') || 'Email address is required');
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError(t('errorEmailInvalid') || 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError(t('errorPasswordRequired') || 'Password is required');
      return false;
    }
    if (password.length < 6) {
      setError(t('errorPasswordLength') || 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    clearError?.();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (t('errorGeneric') || 'An error occurred, please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setError('');
      clearError?.();
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin + '/#auth-callback'
        : Linking.createURL('auth-callback');
      const baseAuthUrl = process.env.EXPO_PUBLIC_AUTH_URL;
      if (!baseAuthUrl) {
        setError(t('errorAuthConfig') || 'Authentication service not configured');
        return;
      }
      const authUrl = `${baseAuthUrl}/?redirect=${encodeURIComponent(redirectUrl)}`;

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
      setError(t('errorGoogleLogin') || 'Google login error');
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#08080B', '#0D0518', '#08080B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Background glow blobs */}
      <View style={[styles.glowBlob, styles.glowBlobPink]} />
      <View style={[styles.glowBlob, styles.glowBlobBlue]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View style={[styles.header, headerStyle]}>
            <LinearGradient colors={COLORS.gradient.primary} style={styles.logoIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>{t('appName')}</Text>
            <Text style={styles.subtitle}>{t('tagline')}</Text>
          </Animated.View>

          {/* Glass Card */}
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Tab Switcher */}
            <View style={styles.tabRow}>
              <View style={styles.tabBackground}>
                <TouchableOpacity
                  testID="login-tab"
                  style={[styles.tab, mode === 'login' && styles.tabActiveContainer]}
                  onPress={() => switchMode('login')}
                >
                  {mode === 'login' && (
                    <LinearGradient colors={COLORS.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  )}
                  <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>{t('login')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="register-tab"
                  style={[styles.tab, mode === 'register' && styles.tabActiveContainer]}
                  onPress={() => switchMode('register')}
                >
                  {mode === 'register' && (
                    <LinearGradient colors={COLORS.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  )}
                  <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>{t('register')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.status.error} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <Animated.View style={formStyle}>
              {mode === 'register' && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    testID="name-input"
                    style={styles.input}
                    placeholder={t('name')}
                    placeholderTextColor={COLORS.text.tertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  testID="email-input"
                  style={styles.input}
                  placeholder={t('email')}
                  placeholderTextColor={COLORS.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  testID="password-input"
                  style={[styles.input, styles.inputPassword]}
                  placeholder={t('password')}
                  placeholderTextColor={COLORS.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity testID="auth-submit-btn" onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={[styles.submitBtnWrapper, SHADOWS.glow]}>
                <LinearGradient colors={COLORS.gradient.primary} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : (
                      <View style={styles.submitBtnInner}>
                        <Text style={styles.submitText}>{mode === 'login' ? t('login') : t('register')}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity testID="google-login-btn" style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="logo-google" size={20} color={COLORS.text.primary} />
              <Text style={styles.googleText}>{t('googleLogin')}</Text>
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, justifyContent: 'center', paddingVertical: SPACING.xl },
  glowBlob: { position: 'absolute', borderRadius: 999 },
  glowBlobPink: { width: 320, height: 320, top: -80, left: -80, backgroundColor: 'rgba(255,0,110,0.12)' },
  glowBlobBlue: { width: 280, height: 280, bottom: -60, right: -60, backgroundColor: 'rgba(58,134,255,0.1)' },
  header: { alignItems: 'center', marginBottom: 36 },
  logoIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 18, ...SHADOWS.glow },
  title: { ...FONT.h2, color: COLORS.text.primary, letterSpacing: 1.5 },
  subtitle: { ...FONT.small, color: COLORS.text.secondary, marginTop: 6, letterSpacing: 0.5 },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: SPACING.lg },
  tabRow: { marginBottom: SPACING.lg },
  tabBackground: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.sm - 2, overflow: 'hidden' },
  tabActiveContainer: { overflow: 'hidden' },
  tabText: { ...FONT.body, color: COLORS.text.tertiary, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,69,58,0.12)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.md },
  error: { ...FONT.small, color: COLORS.status.error, flex: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.md, marginBottom: 12, paddingHorizontal: SPACING.md },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: 14, ...FONT.body, color: COLORS.text.primary },
  inputPassword: { paddingRight: 8 },
  eyeIcon: { padding: 4 },
  submitBtnWrapper: { borderRadius: RADIUS.md, marginTop: 8, overflow: 'visible' },
  submitBtn: { borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { ...FONT.body, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { ...FONT.small, color: COLORS.text.tertiary, marginHorizontal: SPACING.md },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.md, paddingVertical: 14, gap: 10 },
  googleText: { ...FONT.body, color: COLORS.text.primary, fontWeight: '500' },
});

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, FONT, SPACING, RADIUS } from '../src/utils/theme';
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
      <LinearGradient colors={['#EEF2FF', '#FAFBFE', '#F0FDFA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View entering={FadeInDown.duration(600)} style={s.logo}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="compass" size={32} color="#fff" />
              </LinearGradient>
              <Text style={s.appName}>Estetik Pusula</Text>
              <Text style={s.appTag}>Kişisel Güzellik Yol Haritanız</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={s.tabs}>
              {(['login', 'register'] as const).map(m => (
                <TouchableOpacity key={m} testID={`${m}-tab`} style={[s.tab, mode === m && s.tabOn]} onPress={() => { setMode(m); setError(''); }}>
                  <Text style={[s.tabTxt, mode === m && s.tabTxtOn]}>{m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {error ? (
              <Animated.View entering={FadeIn.duration(300)} style={s.errBox}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.status.error} />
                <Text style={s.errTxt}>{error}</Text>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(220).duration(500)} style={s.fields}>
              {mode === 'register' && (
                <View style={s.field}>
                  <Ionicons name="person-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                  <TextInput testID="name-input" style={s.input} placeholder="Ad Soyad" placeholderTextColor={COLORS.text.tertiary} value={name} onChangeText={setName} autoCapitalize="words" />
                </View>
              )}
              <View style={s.field}>
                <Ionicons name="mail-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput testID="email-input" style={s.input} placeholder="E-posta" placeholderTextColor={COLORS.text.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={s.field}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                <TextInput testID="password-input" style={[s.input, { flex: 1 }]} placeholder="Şifre" placeholderTextColor={COLORS.text.tertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(320).duration(500)}>
              <TouchableOpacity testID="auth-submit-btn" onPress={submit} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={s.div}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>veya</Text>
              <View style={s.divLine} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(460)}>
              <TouchableOpacity testID="google-login-btn" style={s.google} onPress={handleGoogle} activeOpacity={0.85}>
                <Ionicons name="logo-google" size={20} color={COLORS.text.primary} />
                <Text style={s.googleTxt}>Google ile Devam Et</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(540)} style={s.legalRow}>
              <Text style={s.footnote}>Devam ederek </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://estetikpusula.app/terms')}>
                <Text style={s.legalLink}>Kullanım Koşulları</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>'nı ve </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://estetikpusula.app/privacy')}>
                <Text style={s.legalLink}>Gizlilik Politikası</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>'nı kabul etmiş olursunuz.</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFBFE' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },

  logo: { alignItems: 'center', marginBottom: 36 },
  logoGrad: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3, marginBottom: 4 },
  appTag: { fontSize: 13, color: COLORS.brand.primary, fontWeight: '500' },

  tabs: { flexDirection: 'row', marginBottom: 22, backgroundColor: COLORS.bg.secondary, borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, overflow: 'hidden' },
  tabOn: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabTxt: { fontSize: 15, color: COLORS.text.tertiary, fontWeight: '600' },
  tabTxtOn: { color: COLORS.brand.primary },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#FECACA' },
  errTxt: { fontSize: 13, color: COLORS.status.error, flex: 1 },

  fields: { gap: 12, marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 16 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text.primary, paddingVertical: 16 },
  eye: { padding: 4 },

  submitBtn: { borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  div: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  divTxt: { fontSize: 13, color: COLORS.text.tertiary, marginHorizontal: 14 },

  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 15 },
  googleTxt: { fontSize: 15, color: COLORS.text.primary, fontWeight: '600' },

  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  footnote: { fontSize: 11, color: COLORS.text.tertiary, lineHeight: 18 },
  legalLink: { fontSize: 11, color: COLORS.brand.primary, lineHeight: 18, textDecorationLine: 'underline' },
});

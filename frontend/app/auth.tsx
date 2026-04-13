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
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <View style={s.orbTeal} />
      <View style={s.orbCoral} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View entering={FadeInDown.duration(600)} style={s.logo}>
              <View style={s.logoBox}>
                <LinearGradient colors={['#2DD4A8', '#1A9B7A']} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={s.logoInner}>
                    <Text style={s.logoLetters}>YA</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={s.appName}>Yüz Atölyem</Text>
              <Text style={s.appTag}>Kişisel Güzellik Asistanınız</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={s.tabs}>
              {(['login', 'register'] as const).map(m => (
                <TouchableOpacity key={m} testID={`${m}-tab`} style={[s.tab, mode === m && s.tabOn]} onPress={() => { setMode(m); setError(''); }}>
                  {mode === m && <LinearGradient colors={['rgba(45,212,168,0.15)', 'rgba(45,212,168,0.04)']} style={StyleSheet.absoluteFill} borderRadius={14} />}
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
                <LinearGradient colors={['#2DD4A8', '#1A9B7A']} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#050D0F" /> : <Text style={s.submitTxt}>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>}
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
                <Ionicons name="logo-google" size={20} color="#F0F6F4" />
                <Text style={s.googleTxt}>Google ile Devam Et</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(540)} style={s.legalRow}>
              <Text style={s.footnote}>Devam ederek </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://yuzatolyem.app/terms')}>
                <Text style={s.legalLink}>Kullanım Koşulları</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>'nı ve </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://yuzatolyem.app/privacy')}>
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
  root: { flex: 1 },
  orbTeal: { position: 'absolute', top: -80, left: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#2DD4A8', opacity: 0.06 },
  orbCoral: { position: 'absolute', bottom: -40, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#F7856E', opacity: 0.05 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },

  logo: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 3 },
  logoInner: { flex: 1, width: '100%', borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoLetters: { fontSize: 26, fontWeight: '900', color: '#F0F6F4', letterSpacing: 2 },
  appName: { fontSize: 26, fontWeight: '800', color: '#F0F6F4', letterSpacing: 0.5, marginBottom: 6 },
  appTag: { fontSize: 13, color: '#2DD4A8', opacity: 0.9, fontWeight: '500' },

  tabs: { flexDirection: 'row', marginBottom: 22, backgroundColor: 'rgba(45,212,168,0.05)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(45,212,168,0.12)' },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 14, overflow: 'hidden' },
  tabOn: { borderWidth: 1, borderColor: 'rgba(45,212,168,0.3)' },
  tabTxt: { fontSize: 15, color: 'rgba(240,246,244,0.3)', fontWeight: '600' },
  tabTxtOn: { color: '#2DD4A8' },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(247,86,74,0.08)', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(247,86,74,0.2)' },
  errTxt: { fontSize: 13, color: COLORS.status.error, flex: 1 },

  fields: { gap: 12, marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#F0F6F4', paddingVertical: 16 },
  eye: { padding: 4 },

  submitBtn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitTxt: { fontSize: 17, fontWeight: '800', color: '#050D0F' },

  div: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  divTxt: { fontSize: 13, color: 'rgba(240,246,244,0.25)', marginHorizontal: 14 },

  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(45,212,168,0.06)', borderWidth: 1, borderColor: 'rgba(45,212,168,0.15)', borderRadius: 18, paddingVertical: 16 },
  googleTxt: { fontSize: 15, color: '#F0F6F4', fontWeight: '600' },

  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 24 },
  footnote: { fontSize: 11, color: 'rgba(240,246,244,0.15)', lineHeight: 18 },
  legalLink: { fontSize: 11, color: 'rgba(45,212,168,0.5)', lineHeight: 18, textDecorationLine: 'underline' },
});

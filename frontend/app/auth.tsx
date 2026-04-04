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
      <LinearGradient colors={['#0D0900', '#0A0A0C', '#08080F']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={s.bloomGold} />
      <View style={s.bloomRose} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo */}
            <Animated.View entering={FadeInDown.duration(600)} style={s.logo}>
              <View style={s.logoGlow} />
              <View style={s.logoBox}>
                <LinearGradient colors={['#F8ECC0', '#E5C07B', '#B8882E']} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.logoLetter}>F</Text>
                </LinearGradient>
              </View>
              <Text style={s.appName}>FaceGlow Pro</Text>
              <Text style={s.appTag}>AI Destekli Güzellik Analizi</Text>
            </Animated.View>

            {/* Tabs */}
            <Animated.View entering={FadeInDown.delay(120).duration(500)} style={s.tabs}>
              {(['login', 'register'] as const).map(m => (
                <TouchableOpacity key={m} testID={`${m}-tab`} style={[s.tab, mode === m && s.tabOn]} onPress={() => { setMode(m); setError(''); }}>
                  {mode === m && <LinearGradient colors={['rgba(229,192,123,0.2)', 'rgba(229,192,123,0.06)']} style={StyleSheet.absoluteFill} borderRadius={12} />}
                  <Text style={[s.tabTxt, mode === m && s.tabTxtOn]}>{m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
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
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.3)" style={s.fieldIcon} />
                  <TextInput testID="name-input" style={s.input} placeholder="Ad Soyad" placeholderTextColor="rgba(255,255,255,0.25)" value={name} onChangeText={setName} autoCapitalize="words" />
                </View>
              )}
              <View style={s.field}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.3)" style={s.fieldIcon} />
                <TextInput testID="email-input" style={s.input} placeholder="E-posta" placeholderTextColor="rgba(255,255,255,0.25)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={s.field}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.3)" style={s.fieldIcon} />
                <TextInput testID="password-input" style={[s.input, { flex: 1 }]} placeholder="Şifre" placeholderTextColor="rgba(255,255,255,0.25)" value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(320).duration(500)}>
              <TouchableOpacity testID="auth-submit-btn" onPress={submit} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={['#F8ECC0', '#E5C07B', '#C9963A']} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#0A0700" /> : <Text style={s.submitTxt}>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(400)} style={s.div}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>veya</Text>
              <View style={s.divLine} />
            </Animated.View>

            {/* Google */}
            <Animated.View entering={FadeInDown.delay(460)}>
              <TouchableOpacity testID="google-login-btn" style={s.google} onPress={handleGoogle} activeOpacity={0.85}>
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={s.googleTxt}>Google ile Devam Et</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(540)}>
              <Text style={s.footnote}>Devam ederek Kullanım Koşullarını kabul etmiş olursunuz.</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bloomGold: { position: 'absolute', top: -80, left: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E5C07B', opacity: 0.16 },
  bloomRose: { position: 'absolute', bottom: -40, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#B76E79', opacity: 0.12 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },

  logo: { alignItems: 'center', marginBottom: 36 },
  logoGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5C07B', opacity: 0.22, transform: [{ scale: 1.5 }] },
  logoBox: { width: 80, height: 80, borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  logoGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { fontSize: 40, fontWeight: '900', color: '#1A0E00' },
  appName: { fontSize: 26, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginBottom: 6 },
  appTag: { fontSize: 13, color: '#E5C07B', opacity: 0.8 },

  tabs: { flexDirection: 'row', marginBottom: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, overflow: 'hidden' },
  tabOn: { borderWidth: 1, borderColor: 'rgba(229,192,123,0.3)' },
  tabTxt: { fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  tabTxtOn: { color: '#E5C07B' },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)' },
  errTxt: { fontSize: 13, color: '#FF453A', flex: 1 },

  fields: { gap: 12, marginBottom: 16 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 16 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#FFF', paddingVertical: 16 },
  eye: { padding: 4 },

  submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitTxt: { fontSize: 17, fontWeight: '800', color: '#0A0700' },

  div: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt: { fontSize: 13, color: 'rgba(255,255,255,0.3)', marginHorizontal: 14 },

  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 16 },
  googleTxt: { fontSize: 15, color: '#FFF', fontWeight: '600' },

  footnote: { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 24, lineHeight: 18 },
});

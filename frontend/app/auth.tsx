import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { AetherScreen } from '../src/components/AetherScreen';

const CHIPS = ['10+ metrik', 'AI simülasyon', 'TR fiyatları'];

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

  const Card = Platform.OS === 'ios' ? BlurView : View;
  const cardProps = Platform.OS === 'ios'
    ? { intensity: 28, tint: 'dark' as const }
    : {};

  return (
    <AetherScreen>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <Animated.View entering={FadeInDown.duration(550)} style={s.heroTop}>
              <LinearGradient colors={[...COLORS.gradient.beam]} style={s.monogram} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={s.monogramTxt}>F</Text>
              </LinearGradient>
              <Text style={s.brand}>FaceGlow Pro</Text>
              <Text style={s.tag}>Velum · AI yüz analizi ve estetik rehberi</Text>
              <View style={s.chipRow}>
                {CHIPS.map((c) => (
                  <View key={c} style={s.chip}><Text style={s.chipTxt}>{c}</Text></View>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.cardOuter}>
              <Card {...cardProps} style={[s.cardBlur, Platform.OS === 'android' && s.cardSolid]}>
                <View style={s.cardInner}>
                  <View style={s.tabs}>
                    {(['login', 'register'] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        testID={`${m}-tab`}
                        style={s.tabHit}
                        onPress={() => { setMode(m); setError(''); }}
                      >
                        <Text style={[s.tabTxt, mode === m && s.tabTxtOn]}>
                          {m === 'login' ? 'Giriş' : 'Kayıt'}
                        </Text>
                        {mode === m ? <View style={s.tabUnderline} /> : <View style={s.tabUnderlineHidden} />}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {error ? (
                    <Animated.View entering={FadeIn.duration(280)} style={s.errBox}>
                      <Ionicons name="alert-circle-outline" size={16} color={COLORS.status.error} />
                      <Text style={s.errTxt}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  <View style={s.fields}>
                    {mode === 'register' && (
                      <View style={s.field}>
                        <View style={s.fieldAccent} />
                        <Ionicons name="person-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                        <TextInput testID="name-input" style={s.input} placeholder="Ad Soyad" placeholderTextColor={COLORS.text.tertiary} value={name} onChangeText={setName} autoCapitalize="words" />
                      </View>
                    )}
                    <View style={s.field}>
                      <View style={s.fieldAccent} />
                      <Ionicons name="mail-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                      <TextInput testID="email-input" style={s.input} placeholder="E-posta" placeholderTextColor={COLORS.text.tertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                    <View style={s.field}>
                      <View style={s.fieldAccent} />
                      <Ionicons name="lock-closed-outline" size={18} color={COLORS.text.tertiary} style={s.fieldIcon} />
                      <TextInput testID="password-input" style={[s.input, { flex: 1 }]} placeholder="Şifre" placeholderTextColor={COLORS.text.tertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                      <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.eye}>
                        <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.text.tertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity testID="auth-submit-btn" onPress={submit} disabled={loading} activeOpacity={0.88}>
                    <LinearGradient colors={[...COLORS.gradient.beam]} style={s.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {loading ? <ActivityIndicator color={COLORS.text.inverse} /> : <Text style={s.submitTxt}>{mode === 'login' ? 'Devam et' : 'Hesap oluştur'}</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={s.hintRow}>
                    <Ionicons name="finger-print-outline" size={16} color={COLORS.text.tertiary} />
                    <Text style={s.hintTxt}>Face ID / Touch ID ile hızlı giriş yakında</Text>
                  </View>

                  <View style={s.div}>
                    <View style={s.divLine} />
                    <Text style={s.divTxt}>veya</Text>
                    <View style={s.divLine} />
                  </View>

                  <TouchableOpacity testID="google-login-btn" style={s.google} onPress={handleGoogle} activeOpacity={0.85}>
                    <Ionicons name="logo-google" size={20} color={COLORS.text.primary} />
                    <Text style={s.googleTxt}>Google</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(420)} style={s.legalRow}>
              <Text style={s.footnote}>Devam ederek </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://faceglowpro.app/terms')}>
                <Text style={s.legalLink}>Koşullar</Text>
              </TouchableOpacity>
              <Text style={s.footnote}> ve </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://faceglowpro.app/privacy')}>
                <Text style={s.legalLink}>Gizlilik</Text>
              </TouchableOpacity>
              <Text style={s.footnote}>{"'i kabul edersiniz."}</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AetherScreen>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 32 },

  heroTop: { alignItems: 'center', marginBottom: 22 },
  monogram: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...SHADOWS.glow },
  monogramTxt: { fontSize: 32, fontFamily: 'Outfit_900Black', color: COLORS.text.inverse },
  brand: { fontSize: 32, fontFamily: 'CormorantGaramond_700Bold', color: COLORS.text.primary, letterSpacing: 0.5 },
  tag: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: COLORS.brand.secondary, marginTop: 6, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.surface.glassBorder, backgroundColor: COLORS.surface.glass },
  chipTxt: { fontSize: 11, fontFamily: 'Outfit_500Medium', color: COLORS.text.secondary },

  cardOuter: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surface.glassBorder },
  cardBlur: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  cardSolid: { backgroundColor: 'rgba(10,21,32,0.88)' },
  cardInner: { padding: SPACING.lg, paddingBottom: SPACING.md },

  tabs: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.12)' },
  tabHit: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabTxt: { fontSize: 15, fontFamily: 'Outfit_500Medium', color: COLORS.text.tertiary },
  tabTxtOn: { color: COLORS.brand.primary, fontFamily: 'Outfit_700Bold' },
  tabUnderline: { position: 'absolute', bottom: 0, height: 3, width: 40, borderRadius: 2, backgroundColor: COLORS.brand.primary },
  tabUnderlineHidden: { position: 'absolute', bottom: 0, height: 3, width: 40, opacity: 0 },

  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: RADIUS.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  errTxt: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: COLORS.status.error, flex: 1 },

  fields: { gap: 12, marginBottom: 18 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.55)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(94,234,212,0.12)', overflow: 'hidden' },
  fieldAccent: { width: 3, alignSelf: 'stretch', backgroundColor: COLORS.brand.primary, opacity: 0.85 },
  fieldIcon: { marginLeft: 10, marginRight: 4 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Outfit_400Regular', color: COLORS.text.primary, paddingVertical: 15 },
  eye: { padding: 10 },

  submitBtn: { borderRadius: RADIUS.md, paddingVertical: 17, alignItems: 'center', marginTop: 4 },
  submitTxt: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: COLORS.text.inverse },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'center' },
  hintTxt: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: COLORS.text.tertiary },

  div: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(148,163,184,0.15)' },
  divTxt: { fontSize: 12, fontFamily: 'Outfit_400Regular', color: COLORS.text.tertiary, marginHorizontal: 12 },

  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.surface.glassBorder, backgroundColor: 'rgba(15,23,42,0.4)' },
  googleTxt: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: COLORS.text.primary },

  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 },
  footnote: { fontSize: 11, fontFamily: 'Outfit_400Regular', color: COLORS.text.tertiary, lineHeight: 18 },
  legalLink: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: COLORS.brand.primary, lineHeight: 18 },
});

import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { pendingPhotoStore } from '../../src/utils/pendingPhotoStore';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';

const MODE_COPY = {
  cerrahi: {
    title: 'Cerrahi rota',
    subtitle: 'Profil analizi, iyilesme takvimi ve doktora sorulacak basliklari hazirlar.',
    prompt: 'Kulaklar gorunebilir; onemli olan burun, cene ve profil hattinin net secilmesidir.',
  },
  medikal: {
    title: 'Medikal rota',
    subtitle: 'Cilt, hacim ve daha yumusak degisim ihtiyaclarini onceliklendirir.',
    prompt: 'Dogal isikta, filtre uygulanmamis ve makyaj etkisi minimum bir foto secin.',
  },
} as const;

const CHECKPOINTS = [
  'Yuzun tamami kadrajda olsun',
  'Duz bakis ve dengeli isik tercih edin',
  'Filtreli veya kolaj foto kullanmayin',
];

export default function CameraScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mode = category === 'cerrahi' ? 'cerrahi' : 'medikal';
  const copy = useMemo(() => MODE_COPY[mode], [mode]);

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Kamera izni gerekli');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Galeri izni gerekli');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [3, 4],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [3, 4],
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let b64 = asset.base64 ?? null;

        if (!b64 && asset.uri && Platform.OS !== 'web') {
          b64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });
        }

        if (!b64 && asset.uri && Platform.OS === 'web') {
          const resp = await fetch(asset.uri);
          const blob = await resp.blob();
          b64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const r = reader.result as string;
              resolve(r.split(',')[1]);
            };
            reader.readAsDataURL(blob);
          });
        }

        if (b64) setImage(b64);
      }
    } catch {
      Alert.alert('Hata', 'Fotograf alinamadi');
    }
  };

  const handleProceed = () => {
    if (!image) return;
    setLoading(true);
    pendingPhotoStore.photo = image;
    router.push({
      pathname: '/analysis/loading',
      params: { category: mode },
    });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={COLORS.gradient.hero}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.meshTop} />
      <View style={styles.meshBottom} />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="camera-back-btn"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.overline}>AYNA ATLAS CAPTURE</Text>
            <Text style={styles.title}>{copy.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Plan ciktisi icin net bir referans yukleyin</Text>
            <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>
          </View>

          {image ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${image}` }}
                style={styles.preview}
                resizeMode="cover"
              />
              <TouchableOpacity
                testID="retake-btn"
                style={styles.retakeBtn}
                onPress={() => setImage(null)}
              >
                <Ionicons name="refresh" size={16} color={COLORS.text.primary} />
                <Text style={styles.retakeText}>Baska fotograf sec</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderCard}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.centerBadge}>
                  <Ionicons name="person-outline" size={38} color={COLORS.brand.primary} />
                </View>
                <Text style={styles.placeholderText}>{copy.prompt}</Text>
              </View>
            </View>
          )}

          <View style={styles.checklistCard}>
            <Text style={styles.sectionTitle}>Hizli kalite kontrolu</Text>
            {CHECKPOINTS.map((item) => (
              <View key={item} style={styles.checkRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.status.success} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            {!image ? (
              <>
                <TouchableOpacity
                  testID="take-photo-btn"
                  onPress={() => pickImage(true)}
                  activeOpacity={0.86}
                >
                  <LinearGradient
                    colors={COLORS.gradient.accent}
                    style={styles.actionBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="camera" size={20} color={COLORS.text.inverse} />
                    <Text style={styles.actionBtnText}>Kamera ile cek</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="pick-gallery-btn"
                  style={styles.secondaryBtn}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.86}
                >
                  <Ionicons name="images-outline" size={20} color={COLORS.text.primary} />
                  <Text style={styles.secondaryBtnText}>Galeriden sec</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                testID="proceed-analysis-btn"
                onPress={handleProceed}
                activeOpacity={0.86}
              >
                <LinearGradient
                  colors={COLORS.gradient.accent}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text.inverse} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color={COLORS.text.inverse} />
                      <Text style={styles.actionBtnText}>Plan olustur</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  meshTop: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(125,211,252,0.08)',
  },
  meshBottom: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.glass,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  headerTextWrap: { flex: 1 },
  overline: { ...FONT.overline, color: COLORS.text.muted, marginBottom: 4 },
  title: { ...FONT.h3, color: COLORS.text.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingBottom: 36 },
  heroCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    marginBottom: 16,
  },
  heroTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 8 },
  heroSubtitle: { ...FONT.small, color: COLORS.text.secondary, lineHeight: 20 },
  previewContainer: {
    height: 420,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  preview: { width: '100%', height: '100%' },
  retakeBtn: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(5,10,20,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  retakeText: { ...FONT.small, color: COLORS.text.primary, fontWeight: '600' },
  placeholderCard: {
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface.card,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
    padding: 18,
    marginBottom: 16,
  },
  scanFrame: {
    height: 360,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(9,14,27,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  centerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(125,211,252,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.2)',
  },
  corner: { position: 'absolute', width: 42, height: 42, borderColor: COLORS.brand.primary },
  topLeft: { top: 18, left: 18, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 },
  topRight: { top: 18, right: 18, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 18, left: 18, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 18, right: 18, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 },
  placeholderText: {
    ...FONT.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
  },
  checklistCard: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.16)',
    marginBottom: 18,
  },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkText: { ...FONT.small, color: COLORS.text.secondary, flex: 1 },
  actions: { gap: 12 },
  actionBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnText: { ...FONT.body, color: COLORS.text.inverse, fontWeight: '800' },
  secondaryBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.surface.glass,
    borderWidth: 1,
    borderColor: COLORS.surface.glassBorder,
  },
  secondaryBtnText: { ...FONT.body, color: COLORS.text.primary, fontWeight: '600' },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { pendingPhotoStore } from '../../src/utils/pendingPhotoStore';

export default function CameraScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { t } = useLang();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Kamera izni gerekli'); return; }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Galeri izni gerekli'); return; }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], quality: 0.7, base64: true,
            allowsEditing: true, aspect: [3, 4],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], quality: 0.7, base64: true,
            allowsEditing: true, aspect: [3, 4],
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let b64 = asset.base64 ?? null;

        if (!b64 && asset.uri && Platform.OS !== 'web') {
          b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
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
      Alert.alert('Hata', 'Fotoğraf alınamadı');
    }
  };

  const handleProceed = () => {
    if (!image) return;
    setLoading(true);
    // Büyük base64'ü URL param olarak DEĞİL, memory store üzerinden taşı
    pendingPhotoStore.photo = image;
    router.push({
      pathname: '/analysis/loading',
      params: { category: category || 'medikal' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="camera-back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {category === 'cerrahi' ? t('surgical') : t('medicalAesthetic')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
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
              <Ionicons name="refresh" size={20} color={COLORS.text.primary} />
              <Text style={styles.retakeText}>Tekrar Seç</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <Ionicons name="person-outline" size={64} color={COLORS.text.tertiary} />
              <Text style={styles.placeholderText}>
                Yüzünüzün net göründüğü bir fotoğraf seçin
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {!image ? (
            <>
              <TouchableOpacity
                testID="take-photo-btn"
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F3D088', '#D1A354']}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={22} color="#000" />
                  <Text style={styles.actionBtnText}>{t('takePhoto')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pick-gallery-btn"
                style={styles.secondaryBtn}
                onPress={() => pickImage(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={22} color={COLORS.text.primary} />
                <Text style={styles.secondaryBtnText}>{t('pickFromGallery')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              testID="proceed-analysis-btn"
              onPress={handleProceed}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F3D088', '#D1A354']}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="scan" size={22} color="#000" />
                    <Text style={styles.actionBtnText}>{t('startAnalysis')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...FONT.h4, color: COLORS.text.primary },
  content: { flex: 1, paddingHorizontal: SPACING.lg },
  previewContainer: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 20 },
  preview: { flex: 1, borderRadius: RADIUS.lg },
  retakeBtn: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: RADIUS.full,
  },
  retakeText: { ...FONT.small, color: COLORS.text.primary },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 260, height: 340, justifyContent: 'center',
    alignItems: 'center', gap: 16,
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: COLORS.brand.primary },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  placeholderText: {
    ...FONT.small, color: COLORS.text.tertiary,
    textAlign: 'center', paddingHorizontal: 20,
  },
  actions: { gap: 12, paddingBottom: 30 },
  actionBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  actionBtnText: { ...FONT.body, fontWeight: '700', color: COLORS.text.inverse },
  secondaryBtn: {
    borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.surface.glassBorder,
  },
  secondaryBtnText: { ...FONT.body, color: COLORS.text.primary },
});

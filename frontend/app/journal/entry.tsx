import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/utils/api';

export default function JournalEntryScreen() {
  const { t } = useLang();
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!notes.trim()) return;
    setSaving(true);
    try {
      await api.post('/journal/entry', {
        mood: 'good',
        routine: [],
        water_glasses: 0,
        sleep_hours: 0,
        notes: notes.trim(),
      });
      Alert.alert('Kaydedildi', 'Notunuz başarıyla kaydedildi.');
      router.back();
    } catch {
      Alert.alert('Hata', 'Not kaydedilemedi.');
    } finally { setSaving(false); }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={s.title}>{t('addNote')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={s.input}
            placeholder="Bugün cildiniz hakkında notlar ekleyin..."
            placeholderTextColor={COLORS.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={handleSave} disabled={saving || !notes.trim()} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2DD4A8', '#1A9B7A']}
              style={[s.saveBtn, (!notes.trim() || saving) && s.saveBtnDisabled]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="save-outline" size={20} color="#050D0F" />
              <Text style={s.saveTxt}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)' },
  title: { ...FONT.h4, color: COLORS.text.primary },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  input: {
    ...FONT.body, color: COLORS.text.primary,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg, padding: 18,
    minHeight: 200, marginBottom: 24,
  },
  saveBtn: { borderRadius: RADIUS.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnDisabled: { opacity: 0.4 },
  saveTxt: { ...FONT.body, fontWeight: '700', color: '#050D0F' },
});

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLang } from '../../src/context/LanguageContext';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import api from '../../src/utils/api';

const MOODS = [
  { key: 'great', emoji: '🌟', label: 'Harika', color: '#2DD4A8' },
  { key: 'good', emoji: '😊', label: 'İyi', color: '#58E0C0' },
  { key: 'okay', emoji: '😐', label: 'Normal', color: '#F5B731' },
  { key: 'bad', emoji: '😕', label: 'Kötü', color: '#F7856E' },
];

const ROUTINE_ITEMS = [
  { key: 'cleanser', icon: 'water-outline', label: 'Temizleyici' },
  { key: 'toner', icon: 'flask-outline', label: 'Tonik' },
  { key: 'serum', icon: 'eyedrop-outline', label: 'Serum' },
  { key: 'moisturizer', icon: 'leaf-outline', label: 'Nemlendirici' },
  { key: 'sunscreen', icon: 'sunny-outline', label: 'Güneş Kremi' },
  { key: 'mask', icon: 'sparkles-outline', label: 'Maske' },
];

export default function JournalScreen() {
  const { t } = useLang();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [completedRoutine, setCompletedRoutine] = useState<string[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchEntries();
  }, []));

  const fetchEntries = async () => {
    try {
      const { data } = await api.get('/journal/entries');
      setJournalEntries(data.entries || []);
    } catch {}
  };

  const toggleRoutine = (key: string) => {
    setCompletedRoutine(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const saveEntry = async () => {
    if (!selectedMood) return;
    try {
      await api.post('/journal/entry', {
        mood: selectedMood,
        routine: completedRoutine,
        water_glasses: waterGlasses,
        sleep_hours: sleepHours,
      });
      setSaved(true);
      fetchEntries();
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  const routineProgress = completedRoutine.length / ROUTINE_ITEMS.length;

  return (
    <View style={s.root}>
      <LinearGradient colors={['#030A0C', '#050D0F', '#071215']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
            <View>
              <Text style={s.title}>{t('skinJournal')}</Text>
              <Text style={s.date}>{today}</Text>
            </View>
            <View style={s.streakBadge}>
              <Text style={s.streakEmoji}>🔥</Text>
              <Text style={s.streakTxt}>{journalEntries.length} gün</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.section}>
            <Text style={s.sectionTitle}>{t('skinCondition')}</Text>
            <View style={s.moodRow}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood.key}
                  style={[s.moodBtn, selectedMood === mood.key && { borderColor: mood.color, backgroundColor: mood.color + '10' }]}
                  onPress={() => setSelectedMood(mood.key)}
                  activeOpacity={0.8}
                >
                  <Text style={s.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[s.moodLabel, selectedMood === mood.key && { color: mood.color }]}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{t('skinRoutine')}</Text>
              <Text style={s.progressTxt}>{completedRoutine.length}/{ROUTINE_ITEMS.length}</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${routineProgress * 100}%` as any }]} />
            </View>
            <View style={s.routineGrid}>
              {ROUTINE_ITEMS.map(item => {
                const done = completedRoutine.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[s.routineBtn, done && s.routineBtnDone]}
                    onPress={() => toggleRoutine(item.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={item.icon as any} size={22} color={done ? '#2DD4A8' : '#5A7A74'} />
                    <Text style={[s.routineLabel, done && s.routineLabelDone]}>{item.label}</Text>
                    {done && (
                      <View style={s.routineCheck}>
                        <Ionicons name="checkmark" size={10} color="#050D0F" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(400)} style={s.trackersRow}>
            <View style={s.trackerCard}>
              <Text style={s.trackerIcon}>💧</Text>
              <Text style={s.trackerLabel}>{t('waterIntake')}</Text>
              <View style={s.counterRow}>
                <TouchableOpacity style={s.counterBtn} onPress={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}>
                  <Ionicons name="remove" size={16} color="#F0F6F4" />
                </TouchableOpacity>
                <Text style={s.counterVal}>{waterGlasses}</Text>
                <TouchableOpacity style={s.counterBtn} onPress={() => setWaterGlasses(waterGlasses + 1)}>
                  <Ionicons name="add" size={16} color="#F0F6F4" />
                </TouchableOpacity>
              </View>
              <Text style={s.trackerUnit}>bardak</Text>
            </View>

            <View style={s.trackerCard}>
              <Text style={s.trackerIcon}>😴</Text>
              <Text style={s.trackerLabel}>{t('sleepQuality')}</Text>
              <View style={s.counterRow}>
                <TouchableOpacity style={s.counterBtn} onPress={() => setSleepHours(Math.max(0, sleepHours - 1))}>
                  <Ionicons name="remove" size={16} color="#F0F6F4" />
                </TouchableOpacity>
                <Text style={s.counterVal}>{sleepHours}</Text>
                <TouchableOpacity style={s.counterBtn} onPress={() => setSleepHours(sleepHours + 1)}>
                  <Ionicons name="add" size={16} color="#F0F6F4" />
                </TouchableOpacity>
              </View>
              <Text style={s.trackerUnit}>saat</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(400)}>
            <TouchableOpacity
              onPress={saveEntry}
              disabled={!selectedMood || saved}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={saved ? ['#1A9B7A', '#0F7A5C'] : ['#2DD4A8', '#1A9B7A']}
                style={[s.saveBtn, !selectedMood && s.saveBtnDisabled]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {saved ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#050D0F" />
                    <Text style={s.saveTxt}>Kaydedildi!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#050D0F" />
                    <Text style={s.saveTxt}>Günü Kaydet</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {journalEntries.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={s.historySection}>
              <Text style={s.sectionTitle}>Son Kayıtlar</Text>
              {journalEntries.slice(0, 5).map((entry, i) => {
                const mood = MOODS.find(m => m.key === entry.mood);
                return (
                  <View key={i} style={s.historyCard}>
                    <Text style={s.historyEmoji}>{mood?.emoji || '📝'}</Text>
                    <View style={s.historyMeta}>
                      <Text style={s.historyDate}>{new Date(entry.created_at).toLocaleDateString('tr-TR')}</Text>
                      <Text style={s.historyDetails}>
                        💧 {entry.water_glasses} bardak · 😴 {entry.sleep_hours} saat · {(entry.routine || []).length} bakım
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050D0F' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { ...FONT.h2, color: COLORS.text.primary, marginBottom: 4 },
  date: { ...FONT.small, color: COLORS.text.tertiary },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(247,133,110,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(247,133,110,0.15)' },
  streakEmoji: { fontSize: 14 },
  streakTxt: { fontSize: 12, fontWeight: '700', color: '#F7856E' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { ...FONT.h4, color: COLORS.text.primary, marginBottom: 12 },
  progressTxt: { ...FONT.small, color: '#2DD4A8', fontWeight: '700' },

  moodRow: { flexDirection: 'row', gap: 10 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)', gap: 6 },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 11, fontWeight: '600', color: '#5A7A74' },

  progressTrack: { height: 4, backgroundColor: 'rgba(45,212,168,0.1)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2DD4A8', borderRadius: 2 },

  routineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  routineBtn: { width: (W - 70) / 3, alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 6 },
  routineBtnDone: { borderColor: 'rgba(45,212,168,0.3)', backgroundColor: 'rgba(45,212,168,0.05)' },
  routineLabel: { fontSize: 10, fontWeight: '600', color: '#5A7A74' },
  routineLabelDone: { color: '#2DD4A8' },
  routineCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#2DD4A8', alignItems: 'center', justifyContent: 'center' },

  trackersRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  trackerCard: { flex: 1, alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 6 },
  trackerIcon: { fontSize: 22 },
  trackerLabel: { fontSize: 11, fontWeight: '600', color: '#5A7A74' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(45,212,168,0.12)', alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: 24, fontWeight: '800', color: '#F0F6F4', minWidth: 30, textAlign: 'center' },
  trackerUnit: { fontSize: 11, color: '#5A7A74' },

  saveBtn: { borderRadius: 20, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  saveBtnDisabled: { opacity: 0.4 },
  saveTxt: { fontSize: 17, fontWeight: '800', color: '#050D0F' },

  historySection: { marginBottom: 20 },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  historyEmoji: { fontSize: 22 },
  historyMeta: { flex: 1 },
  historyDate: { ...FONT.small, color: COLORS.text.primary, fontWeight: '600', marginBottom: 2 },
  historyDetails: { ...FONT.xs, color: COLORS.text.tertiary },
});

const W = Dimensions.get('window').width;

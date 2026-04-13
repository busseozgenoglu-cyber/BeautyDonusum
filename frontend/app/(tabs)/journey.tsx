import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  addJournalEntry,
  buildRoutineForConcern,
  getConsultationQuestions,
  JourneyConcern,
  JourneyState,
  loadJourneyState,
  saveJourneyState,
  toggleTodayTask,
} from '../../src/utils/journeyLabStore';

const concernOptions: Array<{
  key: JourneyConcern;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: 'natural',
    title: 'Doğal görünüm',
    subtitle: 'Kademeli, minimal dokunuş odaklı',
    icon: 'leaf-outline',
  },
  {
    key: 'symmetry',
    title: 'Simetri',
    subtitle: 'Yüz dengesini iyileştirme planı',
    icon: 'git-compare-outline',
  },
  {
    key: 'skin',
    title: 'Cilt kalitesi',
    subtitle: 'Doku, parlaklık ve bariyer odağı',
    icon: 'water-outline',
  },
  {
    key: 'jawline',
    title: 'Çene hattı',
    subtitle: 'Profil ve kontur belirginliği',
    icon: 'triangle-outline',
  },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function JourneyScreen() {
  const [state, setState] = useState<JourneyState | null>(null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  useEffect(() => {
    const load = async () => {
      const data = await loadJourneyState();
      setState(data);
    };
    load();
  }, []);

  const persist = async (next: JourneyState) => {
    setState(next);
    await saveJourneyState(next);
  };

  const todayTasks = useMemo(() => {
    if (!state) return [];
    return state.routineByDate[getTodayKey()] || [];
  }, [state]);

  const completionRate = useMemo(() => {
    if (!todayTasks.length) return 0;
    const completed = todayTasks.filter((task) => task.done).length;
    return Math.round((completed / todayTasks.length) * 100);
  }, [todayTasks]);

  const questions = useMemo(() => {
    if (!state) return [];
    return getConsultationQuestions(state.concern);
  }, [state]);

  if (!state) {
    return (
      <View style={s.loadingRoot}>
        <Text style={s.loadingText}>Journey Lab yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#08111A', '#0A0F14', '#0A0A0D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={s.bloomBlue} />
      <View style={s.bloomGreen} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(450)} style={s.header}>
            <Text style={s.title}>Journey Lab</Text>
            <Text style={s.subtitle}>Günlük plan, check-in ve konsültasyon hazırlığı</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(420)} style={s.progressCard}>
            <View>
              <Text style={s.progressLabel}>Bugünün rutin ilerlemesi</Text>
              <Text style={s.progressValue}>{completionRate}% tamamlandı</Text>
            </View>
            <View style={s.progressRing}>
              <Text style={s.progressRingText}>{completionRate}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(420)} style={s.section}>
            <Text style={s.sectionTitle}>Odak alanın</Text>
            {concernOptions.map((item) => {
              const active = state.concern === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[s.concernCard, active && s.concernCardActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    const next = buildRoutineForConcern(state, item.key);
                    persist(next);
                  }}
                >
                  <View style={[s.concernIcon, active && s.concernIconActive]}>
                    <Ionicons name={item.icon} size={18} color={active ? '#08111A' : '#7DD3FC'} />
                  </View>
                  <View style={s.concernTextWrap}>
                    <Text style={s.concernTitle}>{item.title}</Text>
                    <Text style={s.concernSubtitle}>{item.subtitle}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={20} color="#7DD3FC" /> : null}
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(170).duration(420)} style={s.section}>
            <Text style={s.sectionTitle}>Bugünkü Mikro Rutin</Text>
            {todayTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={s.taskRow}
                activeOpacity={0.9}
                onPress={() => {
                  const next = toggleTodayTask(state, task.id);
                  persist(next);
                }}
              >
                <View style={[s.taskCheck, task.done && s.taskCheckDone]}>
                  {task.done ? <Ionicons name="checkmark" size={14} color="#051018" /> : null}
                </View>
                <Text style={[s.taskText, task.done && s.taskTextDone]}>{task.title}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(230).duration(420)} style={s.section}>
            <Text style={s.sectionTitle}>Hızlı Check-in</Text>
            <View style={s.metricRow}>
              <Text style={s.metricLabel}>Mood</Text>
              <View style={s.selectorRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={`mood-${value}`}
                    style={[s.selectorDot, mood === value && s.selectorDotActive]}
                    onPress={() => setMood(value as 1 | 2 | 3 | 4 | 5)}
                  >
                    <Text style={[s.selectorText, mood === value && s.selectorTextActive]}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.metricRow}>
              <Text style={s.metricLabel}>Enerji</Text>
              <View style={s.selectorRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={`energy-${value}`}
                    style={[s.selectorDot, energy === value && s.selectorDotActive]}
                    onPress={() => setEnergy(value as 1 | 2 | 3 | 4 | 5)}
                  >
                    <Text style={[s.selectorText, energy === value && s.selectorTextActive]}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Bugünkü gözlemini kısa not et..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={s.noteInput}
              multiline
              maxLength={220}
            />

            <TouchableOpacity
              activeOpacity={0.88}
              style={s.saveBtn}
              onPress={() => {
                if (!note.trim()) {
                  Alert.alert('Not gerekli', 'Lütfen check-in için kısa bir not gir.');
                  return;
                }
                const next = addJournalEntry(state, { mood, energy, note });
                persist(next);
                setNote('');
                Alert.alert('Kaydedildi', 'Bugünkü check-in kaydın eklendi.');
              }}
            >
              <Text style={s.saveBtnText}>Check-in Kaydet</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(280).duration(420)} style={s.section}>
            <Text style={s.sectionTitle}>Konsültasyon Soru Üretici</Text>
            {questions.map((question, index) => (
              <View key={`${question}-${index}`} style={s.questionRow}>
                <Ionicons name="help-circle-outline" size={16} color="#7DD3FC" />
                <Text style={s.questionText}>{question}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(330).duration(420)} style={s.section}>
            <Text style={s.sectionTitle}>Son Günlük Kayıtları</Text>
            {state.journal.length === 0 ? (
              <Text style={s.emptyText}>Henüz kayıt yok. İlk check-in kaydını oluştur.</Text>
            ) : (
              state.journal.slice(0, 3).map((entry) => (
                <View key={entry.id} style={s.journalCard}>
                  <View style={s.journalTop}>
                    <Text style={s.journalDate}>{new Date(entry.createdAt).toLocaleDateString('tr-TR')}</Text>
                    <Text style={s.journalScore}>Mood {entry.mood} · Enerji {entry.energy}</Text>
                  </View>
                  <Text style={s.journalNote}>{entry.note}</Text>
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0D' },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0D' },
  loadingText: { color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  bloomBlue: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0EA5E9',
    opacity: 0.13,
  },
  bloomGreen: {
    position: 'absolute',
    bottom: 20,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#22C55E',
    opacity: 0.11,
  },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 56 },
  header: { marginBottom: 22 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: 'rgba(125,211,252,0.75)', marginTop: 4 },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  progressValue: { fontSize: 20, fontWeight: '700', color: '#7DD3FC', marginTop: 2 },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7DD3FC',
    backgroundColor: 'rgba(125,211,252,0.12)',
  },
  progressRingText: { fontSize: 16, fontWeight: '800', color: '#7DD3FC' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, letterSpacing: 1.2 },
  concernCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 8,
  },
  concernCardActive: { borderColor: 'rgba(125,211,252,0.5)', backgroundColor: 'rgba(125,211,252,0.1)' },
  concernIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(125,211,252,0.14)',
    marginRight: 10,
  },
  concernIconActive: { backgroundColor: '#7DD3FC' },
  concernTextWrap: { flex: 1 },
  concernTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  concernSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,252,0.65)',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckDone: { backgroundColor: '#7DD3FC' },
  taskText: { flex: 1, color: '#FFFFFF', fontSize: 13 },
  taskTextDone: { color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through' },
  metricRow: { marginBottom: 12 },
  metricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  selectorRow: { flexDirection: 'row', gap: 8 },
  selectorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectorDotActive: { backgroundColor: 'rgba(125,211,252,0.2)', borderColor: 'rgba(125,211,252,0.5)' },
  selectorText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  selectorTextActive: { color: '#7DD3FC' },
  noteInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#FFFFFF',
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtn: {
    borderRadius: 12,
    backgroundColor: '#7DD3FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#041018' },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  questionText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },
  emptyText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  journalCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 8,
  },
  journalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  journalDate: { color: '#7DD3FC', fontSize: 11, fontWeight: '700' },
  journalScore: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  journalNote: { color: '#FFFFFF', fontSize: 13, lineHeight: 19 },
});

import * as SecureStore from 'expo-secure-store';

export type JourneyConcern = 'symmetry' | 'skin' | 'jawline' | 'natural';

export type RoutineTask = {
  id: string;
  title: string;
  done: boolean;
};

export type JournalEntry = {
  id: string;
  createdAt: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  note: string;
};

export type JourneyState = {
  concern: JourneyConcern;
  routineByDate: Record<string, RoutineTask[]>;
  journal: JournalEntry[];
};

const STORAGE_KEY = 'journey_lab_state_v1';

const baseTasks: Record<JourneyConcern, string[]> = {
  symmetry: [
    '2 dakika yüz gevşetme egzersizi yap',
    'Bugünkü fotoğrafını aynı açıyla kaydet',
    'Bol su içmeyi tamamla',
  ],
  skin: [
    'Nazik temizleme rutinini tamamla',
    'SPF kullanımını işaretle',
    'Akşam cilt nem desteğini uygula',
  ],
  jawline: [
    '3 dakika postür egzersizi yap',
    'Duruş kontrolü için omuzlarını hizala',
    'Şişkinlik azaltıcı su tüketimini tamamla',
  ],
  natural: [
    'Bugün için doğal görünüm hedefini yaz',
    'Uyku planını kontrol et',
    'Cilt ve beslenme notunu journala ekle',
  ],
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function createTasks(concern: JourneyConcern): RoutineTask[] {
  return baseTasks[concern].map((title, index) => ({
    id: `${concern}-${index + 1}`,
    title,
    done: false,
  }));
}

function getDefaultState(): JourneyState {
  const concern: JourneyConcern = 'natural';
  return {
    concern,
    routineByDate: {
      [getTodayKey()]: createTasks(concern),
    },
    journal: [],
  };
}

function normalizeState(state: JourneyState): JourneyState {
  const today = getTodayKey();
  const next = { ...state };
  if (!next.routineByDate[today]) {
    next.routineByDate = { ...next.routineByDate, [today]: createTasks(next.concern) };
  }
  return next;
}

export async function loadJourneyState(): Promise<JourneyState> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as JourneyState;
    if (!parsed.concern || !parsed.routineByDate || !Array.isArray(parsed.journal)) {
      return getDefaultState();
    }
    return normalizeState(parsed);
  } catch {
    return getDefaultState();
  }
}

export async function saveJourneyState(state: JourneyState): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
}

export function buildRoutineForConcern(
  state: JourneyState,
  concern: JourneyConcern
): JourneyState {
  const today = getTodayKey();
  return {
    ...state,
    concern,
    routineByDate: {
      ...state.routineByDate,
      [today]: createTasks(concern),
    },
  };
}

export function toggleTodayTask(state: JourneyState, taskId: string): JourneyState {
  const today = getTodayKey();
  const tasks = state.routineByDate[today] || [];
  return {
    ...state,
    routineByDate: {
      ...state.routineByDate,
      [today]: tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    },
  };
}

export function addJournalEntry(
  state: JourneyState,
  payload: Pick<JournalEntry, 'mood' | 'energy' | 'note'>
): JourneyState {
  const entry: JournalEntry = {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    mood: payload.mood,
    energy: payload.energy,
    note: payload.note.trim(),
  };
  return {
    ...state,
    journal: [entry, ...state.journal].slice(0, 30),
  };
}

export function getConsultationQuestions(concern: JourneyConcern): string[] {
  const common = [
    'İşlem sonrası 1, 3 ve 6. aylarda hangi değişimleri beklemeliyim?',
    'Benim yüz oranlarıma göre en doğal sonuç için hangi yaklaşımı önerirsiniz?',
  ];

  const byConcern: Record<JourneyConcern, string[]> = {
    symmetry: [
      'Asimetrinin ana nedenini nasıl değerlendiriyorsunuz?',
      'Doğal mimik dengesini korumak için hangi teknik daha uygun olur?',
    ],
    skin: [
      'Cilt kalitesini artırmak için işlemler hangi sırayla planlanmalı?',
      'Hassas ciltte komplikasyon riskini azaltmak için protokolünüz nedir?',
    ],
    jawline: [
      'Çene hattı belirginliği için cerrahi dışı ve cerrahi seçeneklerim neler?',
      'Profil dengesini korumak için işlem dozu nasıl belirlenir?',
    ],
    natural: [
      'Yüzümde “işlem yapılmış” görünümünü önlemek için planı nasıl kurgularsınız?',
      'Kademeli ilerleme için minimum etkili müdahale yaklaşımınız nedir?',
    ],
  };

  return [...byConcern[concern], ...common];
}

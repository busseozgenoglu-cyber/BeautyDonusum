type Category = 'cerrahi' | 'medikal';

type Recommendation = {
  area?: string;
  title?: string;
  priority?: 'high' | 'medium' | 'low' | string;
  cost_min_tl?: number;
  cost_max_tl?: number;
};

type MetricInfo = {
  label: string;
  short: string;
  note: string;
};

const METRIC_INFO: Record<string, MetricInfo> = {
  symmetry_score: {
    label: 'Simetri',
    short: 'Yuz dengesi',
    note: 'Fotograf, aci ve ifade standardi tekrarli degerlendirme icin onemli.',
  },
  jawline_definition: {
    label: 'Cene hatti',
    short: 'Alt yuz cizgisi',
    note: 'Profil ve 3/4 aci fotolariyle birlikte yorumlandiginda daha anlamli olur.',
  },
  nose_proportion: {
    label: 'Burun orani',
    short: 'Profil dengesi',
    note: 'On ve profil beklentisini ayri ayri not etmek karar kalitesini artirir.',
  },
  eye_spacing: {
    label: 'Goz cevresi',
    short: 'Bakis dengesi',
    note: 'Uyku, sislik ve makyaj aliskanliklari bu alani etkileyebilir.',
  },
  lip_ratio: {
    label: 'Dudak orani',
    short: 'Kontur ve hacim',
    note: 'Kucuk dozlarla ilerlemek genelde daha kontrollu sonuc verir.',
  },
  skin_quality: {
    label: 'Cilt kalitesi',
    short: 'Doku ve parlaklik',
    note: 'Aktif icerikler, gunes ve nem bariyeri en hizli degisen etkenlerdir.',
  },
  cheekbone_prominence: {
    label: 'Elmacik yapisi',
    short: 'Orta yuz hacmi',
    note: 'Mimik ve gulumseme fotografla birlikte degerlendirilmelidir.',
  },
  forehead_proportion: {
    label: 'Alin orani',
    short: 'Ust yuz dengesi',
    note: 'Sac cizgisi ve mimik kullanimi yorumlamayi degistirebilir.',
  },
  chin_projection: {
    label: 'Cene ucu',
    short: 'Profil destegi',
    note: 'Boyun hatti ve dudak-cene iliskisiyle birlikte bakilmasi faydalidir.',
  },
  overall_harmony: {
    label: 'Genel uyum',
    short: 'Butunsel skor',
    note: 'Tek bir bolge yerine genel dengeyi izlemek daha saglikli karar verir.',
  },
};

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function scoreTone(score: number) {
  if (score >= 8.3) {
    return {
      title: 'Net ve dengeli',
      detail: 'Ana karar artik yeni islem aramak degil; hedefi rafine etmek ve dogru uzman sorularini toplamak.',
    };
  }

  if (score >= 6.8) {
    return {
      title: 'Iyilestirilebilir alanlar var',
      detail: 'En cok fark yaratacak 2-3 bolgeyi once netlestirip gorusmeye o sekilde gitmek daha verimli olur.',
    };
  }

  return {
    title: 'Onceliklendirme gerekli',
    detail: 'Tumu yerine once en dusuk etki eden alanlari, toparlanma suresi ve butce ile birlikte ele al.',
  };
}

export function buildPlannerBadges(category: Category, recs: Recommendation[]) {
  const mins = recs.map((item) => item.cost_min_tl).filter((value): value is number => typeof value === 'number');
  const maxs = recs.map((item) => item.cost_max_tl).filter((value): value is number => typeof value === 'number');
  const priorities = recs.map((item) => item.priority).filter(Boolean);
  const highCount = priorities.filter((item) => item === 'high').length;

  const budget =
    mins.length && maxs.length
      ? `${Math.min(...mins) / 1000}K-${Math.max(...maxs) / 1000}K TL`
      : category === 'cerrahi'
        ? 'Plan bazli butce'
        : 'Seans bazli butce';

  return [
    { label: 'Rota', value: category === 'cerrahi' ? 'Cerrahi plan' : 'Medikal plan' },
    { label: 'Odak', value: highCount > 0 ? `${highCount} oncelikli konu` : 'Rutin koruma' },
    { label: 'Butce', value: budget },
  ];
}

export function buildFocusAreas(metrics: Record<string, unknown>) {
  const items = Object.entries(metrics)
    .filter(([key, value]) => key !== 'face_shape' && typeof value === 'number')
    .sort(([, a], [, b]) => (a as number) - (b as number))
    .slice(0, 3)
    .map(([key, value]) => {
      const info = METRIC_INFO[key] || {
        label: key,
        short: key,
        note: 'Bu alan icin fotograflari ayni isikta tekrar etmek daha tutarli yorum saglar.',
      };

      return {
        key,
        label: info.label,
        short: info.short,
        value: value as number,
        note: info.note,
      };
    });

  return items;
}

export function buildQuestionBank(category: Category, recs: Recommendation[]) {
  const baseline =
    category === 'cerrahi'
      ? [
          'Bu karar icin tek seansta mi, asamali mi ilerlemek daha dogru?',
          'Toparlanma surecinde ilk 14 gunu nasil planlamaliyim?',
          'Revizyon veya geri donus ihtimali hangi senaryolarda konusulur?',
        ]
      : [
          'Dogal gorunumu korumak icin minimum doz/enerji plani nedir?',
          'Kontrol veya top-up randevusu kac hafta sonra olmali?',
          'Bu islemi mevcut cilt bakim rutinimle nasil eslestirmeliyim?',
        ];

  const specific = recs.slice(0, 3).map((rec) => {
    const title = rec.title || rec.area || 'onerilen alan';
    return `${title} icin sonuc beklentisini hangi aci veya fotograflarla netlestirmeliyim?`;
  });

  return [...baseline, ...specific].slice(0, 5);
}

export function buildTimeline(category: Category, recs: Recommendation[]) {
  const lead = recs[0]?.title || (category === 'cerrahi' ? 'Ana prosedur' : 'Ana seans');

  return [
    {
      title: 'Bugun',
      detail: 'Hedef gorunumu ve istemedigin sonucu tek notta yaz. Bu dosya gorusmede hiz kazandirir.',
    },
    {
      title: '48 saat icinde',
      detail:
        category === 'cerrahi'
          ? `${lead} icin toparlanma ve izin planini ciz. Sosyal takvimi buna gore bosalt.`
          : `${lead} icin seans oncesi ve sonrasi urun/aktivite kisitlarini netlestir.`,
    },
    {
      title: 'Gorusme gunu',
      detail: 'Sorularini oncelik sirasina koy ve en fazla 3 ana beklentiyle gorusmeye gir.',
    },
  ];
}

export function buildRecoveryLens(category: Category, metrics: Record<string, unknown>) {
  const faceShape = typeof metrics.face_shape === 'string' ? metrics.face_shape : 'oval';

  return category === 'cerrahi'
    ? {
        title: 'Toparlanma penceresi',
        description: 'Cerrahi kararlar sadece sonucla degil, sosyal takvim ve odem yonetimiyle birlikte dusunulmeli.',
        bullets: [
          'Ilk hafta gorunurluk ve sislik yonetimi icin daha sakin bir takvim ayir.',
          'Uyku pozisyonu, buz uygulamasi ve ilk kontrol randevusu icin alan ac.',
          `${faceShape} yuz formunda profil degisimi genellikle fotograflarda daha belirgin hissedilir.`,
        ],
      }
    : {
        title: 'Bakım ve takip penceresi',
        description: 'Medikal islemlerde esas fark, doz kadar takip ve rutin uyumundan gelir.',
        bullets: [
          'Seans sonrasi ilk 24-72 saati aktif urunler ve sicak ortamlar icin planla.',
          'Dogal sonuc icin kademeli ilerlemeyi doktorunla konus.',
          `${faceShape} yuz formunda stil ve cilt rutinini birlikte optimize etmek genellikle daha dengeli gorunum verir.`,
        ],
      };
}

export function buildRoutine(category: Category, metrics: Record<string, unknown>) {
  const lowAreas = buildFocusAreas(metrics);
  const first = lowAreas[0]?.label || 'en hassas alan';

  return [
    {
      title: 'Sabah notu',
      detail:
        category === 'cerrahi'
          ? `${first} ile ilgili referans fotograflarini ayni isikta cekip dosyana ekle.`
          : `${first} icin cilt veya mimik farkini gozlemleyebilecegin net bir selfie serisi olustur.`,
    },
    {
      title: 'Aksam kaydi',
      detail: 'Hangi aci ve ifade seni daha iyi anlatiyor? Bir satir not dusmek sonraki gorusmede fark yaratir.',
    },
    {
      title: 'Haftalik kontrol',
      detail: 'Kararin hala ayni mi, yoksa sadece belirli bir bolgeye mi odaklanmak istiyorsun? Cevabi dosyana ekle.',
    },
  ];
}

export function buildHistoryInsight(item: {
  category: Category;
  recommendations?: { overall_score?: number; recommendations?: Recommendation[] };
  metrics?: Record<string, unknown>;
}) {
  const score =
    item.recommendations?.overall_score ??
    (((item.metrics?.overall_harmony as number | undefined) || 0) * 10);
  const tone = scoreTone(score);

  return {
    score,
    nextMove:
      item.category === 'cerrahi'
        ? 'Sorulari netlestir ve toparlanma takvimini ciz'
        : 'Seans araligini ve bakım uyumunu netlestir',
    tone: tone.title,
  };
}

export function getPriorityTone(priority?: string) {
  if (priority === 'high') {
    return {
      accent: '#FF7E6B',
      question: 'Bu alan icin beklenen degisim ve risk siniri nasil tarif edilir?',
    };
  }

  if (priority === 'medium') {
    return {
      accent: '#FFB454',
      question: 'Kademeli ilerleme veya alternatif uygulama secenegi var mi?',
    };
  }

  return {
    accent: '#57D39B',
    question: 'Koruyucu bakım ve takip rutini nasil kurulabilir?',
  };
}

export function getConciergeSummary(category: Category, faceShape: string | undefined, score: number) {
  const route = category === 'cerrahi' ? 'cerrahi karar oturumu' : 'medikal bakım oturumu';
  const shape = faceShape ? `${faceShape} yuz profili` : 'mevcut yuz profili';
  const tone = scoreTone(score);

  return `${shape} icin ${route} ozeti hazir: ${tone.title.toLowerCase()} bir tablo ve gorusme odaklari one cikiyor.`;
}

export function buildJourneyPlan(
  metrics: Record<string, unknown>,
  recs: Recommendation[],
  category: Category
) {
  const focusAreas = buildFocusAreas(metrics);
  const timeline = buildTimeline(category, recs);
  const recoveryLens = buildRecoveryLens(category, metrics);
  const routine = buildRoutine(category, metrics);
  const badges = buildPlannerBadges(category, recs);
  const questionPrompts = buildQuestionBank(category, recs);

  const phases = [
    {
      title: timeline[0]?.title || 'Bugun',
      description: timeline[0]?.detail || 'Onceliklerini netlestir.',
      items: focusAreas.map((item) => item.label).slice(0, 3),
    },
    {
      title: recoveryLens.title,
      description: recoveryLens.description,
      items: recoveryLens.bullets,
    },
    {
      title: timeline[2]?.title || 'Gorusme gunu',
      description: timeline[2]?.detail || 'Sorularini ve beklentilerini netlestir.',
      items: routine.map((item) => item.title),
    },
  ];

  return {
    badges,
    focusAreas,
    questionPrompts,
    phases,
    routine,
  };
}

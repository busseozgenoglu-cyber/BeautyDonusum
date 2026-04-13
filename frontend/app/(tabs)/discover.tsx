import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { COLORS, FONT, SPACING, RADIUS, SHADOWS } from '../../src/utils/theme';
import { useLang } from '../../src/context/LanguageContext';
import api from '../../src/utils/api';

type Procedure = {
  id: string;
  title: string;
  category: 'cerrahi' | 'medikal';
  icon: string;
  description: string;
  duration_min: number;
  duration_max: number;
  recovery_days: number;
  cost_min_tl: number;
  cost_max_tl: number;
  popularity_pct: number;
  risk_level: string;
  benefits: string[];
};

type EduTopic = {
  id: string;
  read_minutes: number;
  title_tr: string;
  title_en: string;
  summary_tr: string;
  summary_en: string;
};

const RISK_COLORS: Record<string, string> = {
  düşük: COLORS.status.success,
  orta: COLORS.status.warning,
  yüksek: COLORS.status.error,
};

const FACE_SHAPES = ['oval', 'kalp', 'kare', 'yuvarlak', 'elmas', 'dikdörtgen'] as const;

function ProcedureCard({ item, index }: { item: Procedure; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isSurgical = item.category === 'cerrahi';
  const accent = isSurgical ? COLORS.brand.primary : COLORS.brand.accent;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setExpanded(!expanded)}
        style={[s.procCard, { borderColor: expanded ? accent + '55' : COLORS.border.subtle }]}
      >
        <View style={s.procHeader}>
          <LinearGradient
            colors={isSurgical ? ['rgba(13,92,94,0.12)', 'rgba(13,92,94,0.04)'] : ['rgba(30,58,95,0.12)', 'rgba(30,58,95,0.04)']}
            style={s.procIconBox}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon as any} size={22} color={accent} />
          </LinearGradient>
          <View style={s.procMeta}>
            <Text style={s.procTitle}>{item.title}</Text>
            <View style={s.procTagRow}>
              <View style={[s.procCatTag, { backgroundColor: accent + '18' }]}>
                <Text style={[s.procCatTxt, { color: accent }]}>{isSurgical ? 'Cerrahi' : 'Medikal'}</Text>
              </View>
              <View style={[s.procRiskTag, { backgroundColor: RISK_COLORS[item.risk_level] + '18' }]}>
                <Text style={[s.procRiskTxt, { color: RISK_COLORS[item.risk_level] }]}>{item.risk_level} risk</Text>
              </View>
            </View>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.text.tertiary} />
        </View>
        <View style={s.popRow}>
          <Text style={s.popLabel}>Popülerlik</Text>
          <View style={s.popTrack}>
            <View style={[s.popFill, { width: `${item.popularity_pct}%` as any, backgroundColor: accent }]} />
          </View>
          <Text style={[s.popPct, { color: accent }]}>{item.popularity_pct}%</Text>
        </View>
        {expanded && (
          <Animated.View entering={FadeIn.duration(200)} style={s.procExpanded}>
            <View style={s.procDivider} />
            <Text style={s.procDesc}>{item.description}</Text>
            <View style={s.procStats}>
              <View style={s.procStat}>
                <Ionicons name="time-outline" size={15} color={accent} />
                <Text style={s.procStatVal}>{item.duration_min}–{item.duration_max} dk</Text>
                <Text style={s.procStatLbl}>Süre</Text>
              </View>
              <View style={s.procStatSep} />
              <View style={s.procStat}>
                <Ionicons name="bed-outline" size={15} color={accent} />
                <Text style={s.procStatVal}>{item.recovery_days === 0 ? 'Yok' : `${item.recovery_days} gün`}</Text>
                <Text style={s.procStatLbl}>İyileşme</Text>
              </View>
              <View style={s.procStatSep} />
              <View style={s.procStat}>
                <Ionicons name="cash-outline" size={15} color={accent} />
                <Text style={s.procStatVal}>{(item.cost_min_tl / 1000).toFixed(0)}K–{(item.cost_max_tl / 1000).toFixed(0)}K ₺</Text>
                <Text style={s.procStatLbl}>Fiyat</Text>
              </View>
            </View>
            <Text style={s.procSecLbl}>Faydaları</Text>
            {item.benefits.map((b, i) => (
              <View key={i} style={s.procBenefit}>
                <Ionicons name="checkmark-circle" size={15} color={accent} />
                <Text style={s.procBenefitTxt}>{b}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const { t, lang } = useLang();
  const [segment, setSegment] = useState<'procedures' | 'education' | 'atlas' | 'consult'>('procedures');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procLoading, setProcLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cerrahi' | 'medikal'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [topics, setTopics] = useState<EduTopic[]>([]);
  const [eduLoading, setEduLoading] = useState(false);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [topicBody, setTopicBody] = useState<Record<string, { title: string; body: string }>>({});

  const [atlasShape, setAtlasShape] = useState<string>('oval');
  const [atlasTips, setAtlasTips] = useState<any>(null);
  const [atlasLoading, setAtlasLoading] = useState(false);

  const [consentText, setConsentText] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [checklist, setChecklist] = useState<any>(null);
  const [consultLoading, setConsultLoading] = useState(false);

  const fetchProcedures = useCallback(async () => {
    try {
      const { data } = await api.get('/procedures');
      setProcedures(data.procedures || []);
    } catch { /* empty */ }
    finally { setProcLoading(false); }
  }, []);

  const fetchTopics = useCallback(async () => {
    setEduLoading(true);
    try {
      const { data } = await api.get('/education/topics');
      setTopics(data.topics || []);
    } catch { setTopics([]); }
    finally { setEduLoading(false); }
  }, []);

  const loadTopicDetail = async (id: string) => {
    if (topicBody[id]) {
      setOpenTopicId(openTopicId === id ? null : id);
      return;
    }
    try {
      const { data } = await api.get(`/education/topics/${id}`);
      const top = data.topic;
      const title = lang === 'en' ? top.title_en : top.title_tr;
      const body = lang === 'en' ? top.body_en : top.body_tr;
      setTopicBody((prev) => ({ ...prev, [id]: { title, body } }));
      setOpenTopicId(id);
    } catch { /* ignore */ }
  };

  const fetchAtlas = useCallback(async () => {
    setAtlasLoading(true);
    try {
      const { data } = await api.get(`/face-shape/${atlasShape}`);
      setAtlasTips(data.tips);
    } catch { setAtlasTips(null); }
    finally { setAtlasLoading(false); }
  }, [atlasShape]);

  const fetchConsent = useCallback(async () => {
    try {
      const { data } = await api.get('/consent/clip-text', { params: { lang } });
      setConsentText(data.text || '');
    } catch { setConsentText(''); }
  }, [lang]);

  useEffect(() => { fetchProcedures(); }, [fetchProcedures]);
  useEffect(() => {
    if (segment === 'education') fetchTopics();
  }, [segment, fetchTopics]);
  useEffect(() => {
    if (segment === 'atlas') fetchAtlas();
  }, [segment, fetchAtlas]);
  useEffect(() => {
    if (segment === 'consult') fetchConsent();
  }, [segment, fetchConsent]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (segment === 'procedures') await fetchProcedures();
    if (segment === 'education') await fetchTopics();
    if (segment === 'atlas') await fetchAtlas();
    if (segment === 'consult') await fetchConsent();
    setRefreshing(false);
  };

  const loadConsultChecklist = async () => {
    setConsultLoading(true);
    setChecklist(null);
    try {
      const { data: hist } = await api.get('/analysis/user/history');
      const first = (hist.analyses || [])[0];
      if (!first?.analysis_id) {
        setChecklist({ error: t('pdfNoAnalysis') });
        return;
      }
      const { data } = await api.get(`/analysis/${first.analysis_id}/consult-checklist`);
      setChecklist(data.checklist);
    } catch {
      setChecklist({ error: t('pdfError') });
    } finally {
      setConsultLoading(false);
    }
  };

  const filtered = filter === 'all' ? procedures : procedures.filter((p) => p.category === filter);

  const segBtn = (key: typeof segment, label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      key={key}
      testID={`discover-segment-${key}`}
      style={[s.segBtn, segment === key && s.segBtnOn]}
      onPress={() => setSegment(key)}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={16} color={segment === key ? COLORS.brand.primary : COLORS.text.tertiary} />
      <Text style={[s.segTxt, segment === key && s.segTxtOn]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <LinearGradient colors={['#F8FAFB', '#EEF2F5', '#F4F6F8']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={s.blobTeal} />
      <View style={s.blobGold} />

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand.primary} />}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
            <Text style={s.title}>{t('discover')}</Text>
            <Text style={s.subtitle}>
              {lang === 'en'
                ? 'Procedure guide, clinical education, face atlas, and consultation prep — unique to this app.'
                : 'Prosedür rehberi, klinik eğitim, yüz atlası ve konsültasyon hazırlığı — bu uygulamaya özgü içerik.'}
            </Text>
          </Animated.View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.segRow}>
            {segBtn('procedures', t('proceduresTab'), 'list-outline')}
            {segBtn('education', t('educationTab'), 'school-outline')}
            {segBtn('atlas', t('atlasTab'), 'map-outline')}
            {segBtn('consult', t('consultTab'), 'clipboard-outline')}
          </ScrollView>

          {segment === 'procedures' && (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.filterRow}>
                {(['all', 'cerrahi', 'medikal'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[s.filterBtn, filter === f && s.filterBtnOn]}
                    onPress={() => setFilter(f)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.filterTxt, filter === f && s.filterTxtOn]}>
                      {f === 'all' ? 'Tümü' : f === 'cerrahi' ? 'Cerrahi' : 'Medikal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
              <View style={s.banner}>
                <Ionicons name="information-circle-outline" size={17} color={COLORS.brand.primary} />
                <Text style={s.bannerTxt}>
                  {lang === 'en'
                    ? 'Prices are approximate averages for Turkey. Always confirm with your clinic.'
                    : 'Fiyatlar Türkiye ortalamasına göredir. Kesin bilgi için klinikle görüşünüz.'}
                </Text>
              </View>
              {procLoading ? (
                <ActivityIndicator color={COLORS.brand.primary} style={{ marginTop: 48 }} />
              ) : (
                filtered.map((item, i) => <ProcedureCard key={item.id} item={item} index={i} />)
              )}
              {!procLoading && filtered.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="search-outline" size={40} color={COLORS.text.tertiary} />
                  <Text style={s.emptyTxt}>Bu kategoride prosedür bulunamadı</Text>
                </View>
              )}
            </>
          )}

          {segment === 'education' && (
            <>
              {eduLoading ? (
                <ActivityIndicator color={COLORS.brand.primary} style={{ marginTop: 40 }} />
              ) : (
                topics.map((topic, i) => {
                  const title = lang === 'en' ? topic.title_en : topic.title_tr;
                  const summary = lang === 'en' ? topic.summary_en : topic.summary_tr;
                  const open = openTopicId === topic.id;
                  const detail = topicBody[topic.id];
                  return (
                    <Animated.View key={topic.id} entering={FadeInDown.delay(i * 50).duration(350)}>
                      <TouchableOpacity
                        style={[s.eduCard, open && s.eduCardOpen]}
                        onPress={() => loadTopicDetail(topic.id)}
                        activeOpacity={0.9}
                        testID={`education-topic-${topic.id}`}
                      >
                        <View style={s.eduTop}>
                          <View style={s.eduIcon}>
                            <Ionicons name="book-outline" size={20} color={COLORS.brand.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.eduTitle}>{title}</Text>
                            <Text style={s.eduMeta}>{topic.read_minutes} {t('readMin')}</Text>
                          </View>
                          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.text.tertiary} />
                        </View>
                        <Text style={s.eduSummary}>{summary}</Text>
                        {open && detail && (
                          <Animated.View entering={FadeIn.duration(220)} style={s.eduBodyWrap}>
                            <View style={s.eduDivider} />
                            <Text style={s.eduBody}>{detail.body}</Text>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })
              )}
            </>
          )}

          {segment === 'atlas' && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <Text style={s.atlasLbl}>{t('selectShape')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.atlasChips}>
                {FACE_SHAPES.map((sh) => (
                  <TouchableOpacity
                    key={sh}
                    style={[s.chip, atlasShape === sh && s.chipOn]}
                    onPress={() => setAtlasShape(sh)}
                    testID={`atlas-shape-${sh}`}
                  >
                    <Text style={[s.chipTxt, atlasShape === sh && s.chipTxtOn]}>{sh}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {atlasLoading ? (
                <ActivityIndicator color={COLORS.brand.primary} style={{ marginTop: 28 }} />
              ) : atlasTips ? (
                <View style={s.atlasCard}>
                  <Text style={s.atlasSec}>{lang === 'en' ? 'Overview' : 'Genel'}</Text>
                  <Text style={s.atlasTxt}>{atlasTips.description}</Text>
                  <Text style={s.atlasSec}>{lang === 'en' ? 'Makeup' : 'Makyaj'}</Text>
                  <Text style={s.atlasTxt}>{atlasTips.makeup}</Text>
                  <Text style={s.atlasSec}>{lang === 'en' ? 'Hair' : 'Saç'}</Text>
                  <Text style={s.atlasTxt}>{atlasTips.hair}</Text>
                  <Text style={s.atlasSec}>{lang === 'en' ? 'Glasses' : 'Gözlük'}</Text>
                  <Text style={s.atlasTxt}>{atlasTips.glasses}</Text>
                </View>
              ) : null}
            </Animated.View>
          )}

          {segment === 'consult' && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={s.consentCard}>
                <Text style={s.consentTitle}>{lang === 'en' ? 'Consent & AI notice' : 'Onay ve AI bilgilendirmesi'}</Text>
                <Text style={s.consentBody}>{consentText}</Text>
              </View>
              <Text style={s.notesLbl}>{lang === 'en' ? 'Your goals (optional, for your notes)' : 'Hedefleriniz (isteğe bağlı, not için)'}</Text>
              <TextInput
                style={s.notesInput}
                multiline
                placeholder={lang === 'en' ? 'e.g. refine profile, softer jawline…' : 'ör. profil dengeleme, daha yumuşak çene hattı…'}
                placeholderTextColor={COLORS.text.tertiary}
                value={consultNotes}
                onChangeText={setConsultNotes}
                textAlignVertical="top"
              />
              <TouchableOpacity
                testID="consult-checklist-btn"
                style={s.checkBtnWrap}
                onPress={loadConsultChecklist}
                disabled={consultLoading}
                activeOpacity={0.88}
              >
                <LinearGradient colors={[...COLORS.gradient.teal]} style={s.checkBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {consultLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="list-outline" size={18} color="#fff" />
                      <Text style={s.checkBtnTxt}>{t('consultChecklistLoad')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              {checklist?.error ? (
                <Text style={s.checkErr}>{checklist.error}</Text>
              ) : checklist ? (
                <View style={s.checkCard}>
                  <Text style={s.checkTitle}>{checklist.title || t('consultChecklistTitle')}</Text>
                  {checklist.intro ? <Text style={s.checkIntro}>{checklist.intro}</Text> : null}
                  {(checklist.sections || []).map((sec: any, idx: number) => (
                    <View key={idx} style={s.checkSec}>
                      <Text style={s.checkSecTitle}>{sec.heading}</Text>
                      {(sec.items || []).map((it: string, j: number) => (
                        <View key={j} style={s.checkItemRow}>
                          <Text style={s.checkBullet}>•</Text>
                          <Text style={s.checkItem}>{it}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {consultNotes.trim() ? (
                    <View style={s.checkSec}>
                      <Text style={s.checkSecTitle}>{lang === 'en' ? 'Your notes' : 'Notlarınız'}</Text>
                      <Text style={s.checkItem}>{consultNotes}</Text>
                    </View>
                  ) : null}
                  {checklist.disclaimer ? <Text style={s.checkDisc}>{checklist.disclaimer}</Text> : null}
                </View>
              ) : null}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.primary },
  blobTeal: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(13,92,94,0.08)' },
  blobGold: { position: 'absolute', bottom: 100, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(201,162,39,0.1)' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 8, paddingBottom: 72 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: COLORS.text.secondary, marginTop: 6, lineHeight: 20 },

  segRow: { flexDirection: 'row', gap: 8, marginBottom: 20, paddingRight: 8 },
  segBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle,
    marginRight: 8, ...SHADOWS.card,
  },
  segBtnOn: { borderColor: COLORS.brand.primary, backgroundColor: 'rgba(13,92,94,0.06)' },
  segTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text.tertiary, maxWidth: 120 },
  segTxtOn: { color: COLORS.brand.primary },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle,
  },
  filterBtnOn: { borderColor: COLORS.brand.primary, backgroundColor: 'rgba(13,92,94,0.08)' },
  filterTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text.tertiary },
  filterTxtOn: { color: COLORS.brand.primary },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(13,92,94,0.06)', borderRadius: RADIUS.md,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border.strong,
  },
  bannerTxt: { fontSize: 12, color: COLORS.text.secondary, flex: 1, lineHeight: 18 },

  procCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12,
    borderWidth: 1, ...SHADOWS.card,
  },
  procHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  procIconBox: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  procMeta: { flex: 1 },
  procTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary, marginBottom: 6 },
  procTagRow: { flexDirection: 'row', gap: 6 },
  procCatTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  procCatTxt: { fontSize: 11, fontWeight: '600' },
  procRiskTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  procRiskTxt: { fontSize: 11, fontWeight: '600' },
  popRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popLabel: { fontSize: 11, color: COLORS.text.tertiary, width: 58 },
  popTrack: { flex: 1, height: 5, backgroundColor: COLORS.bg.tertiary, borderRadius: 3, overflow: 'hidden' },
  popFill: { height: '100%', borderRadius: 3 },
  popPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  procExpanded: { marginTop: 4 },
  procDivider: { height: 1, backgroundColor: COLORS.border.subtle, marginVertical: 12 },
  procDesc: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 14 },
  procStats: { flexDirection: 'row', backgroundColor: COLORS.bg.primary, borderRadius: RADIUS.md, padding: 12, marginBottom: 14 },
  procStat: { flex: 1, alignItems: 'center', gap: 4 },
  procStatSep: { width: 1, backgroundColor: COLORS.border.subtle },
  procStatVal: { fontSize: 12, fontWeight: '700', color: COLORS.text.primary },
  procStatLbl: { fontSize: 10, color: COLORS.text.tertiary },
  procSecLbl: { fontSize: 11, fontWeight: '700', color: COLORS.text.tertiary, letterSpacing: 1, marginBottom: 8 },
  procBenefit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  procBenefitTxt: { fontSize: 13, color: COLORS.text.secondary, flex: 1 },

  empty: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyTxt: { fontSize: 14, color: COLORS.text.tertiary },

  eduCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card,
  },
  eduCardOpen: { borderColor: COLORS.brand.primary },
  eduTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eduIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(13,92,94,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  eduTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  eduMeta: { fontSize: 11, color: COLORS.text.tertiary, marginTop: 2 },
  eduSummary: { fontSize: 13, color: COLORS.text.secondary, marginTop: 10, lineHeight: 19 },
  eduBodyWrap: { marginTop: 4 },
  eduDivider: { height: 1, backgroundColor: COLORS.border.subtle, marginVertical: 14 },
  eduBody: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 21 },

  atlasLbl: { ...FONT.small, fontWeight: '700', color: COLORS.text.tertiary, marginBottom: 10, letterSpacing: 0.5 },
  atlasChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface.card, borderWidth: 1, borderColor: COLORS.border.subtle,
  },
  chipOn: { borderColor: COLORS.brand.primary, backgroundColor: 'rgba(13,92,94,0.08)' },
  chipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text.secondary, textTransform: 'capitalize' },
  chipTxtOn: { color: COLORS.brand.primary },
  atlasCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card,
  },
  atlasSec: { fontSize: 12, fontWeight: '700', color: COLORS.brand.primary, marginTop: 12, marginBottom: 6 },
  atlasTxt: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20 },
  consentCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border.subtle, ...SHADOWS.card,
  },
  consentTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary, marginBottom: 10 },
  consentBody: { fontSize: 12, color: COLORS.text.secondary, lineHeight: 19 },
  notesLbl: { fontSize: 12, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 8 },
  notesInput: {
    minHeight: 88,
    backgroundColor: COLORS.surface.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    padding: 14,
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  checkBtnWrap: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 16 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  checkBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  checkErr: { fontSize: 13, color: COLORS.status.error, textAlign: 'center', marginBottom: 12 },
  checkCard: {
    backgroundColor: COLORS.surface.card, borderRadius: RADIUS.lg, padding: 18,
    borderWidth: 1, borderColor: COLORS.border.strong, ...SHADOWS.card,
  },
  checkTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginBottom: 8 },
  checkIntro: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20, marginBottom: 14 },
  checkSec: { marginBottom: 14 },
  checkSecTitle: { fontSize: 14, fontWeight: '700', color: COLORS.brand.accent, marginBottom: 8 },
  checkItemRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  checkBullet: { fontSize: 14, color: COLORS.brand.primary, width: 14 },
  checkItem: { fontSize: 13, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },
  checkDisc: { fontSize: 11, color: COLORS.text.tertiary, fontStyle: 'italic', marginTop: 8, lineHeight: 17 },
});

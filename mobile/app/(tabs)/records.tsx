import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import { useWatchList } from '@/hooks/useWatchList';
import type { Language } from '@/constants/i18n';

// ─── Lab Data ─────────────────────────────────────────────────────────────────
// `name` is the English data key — used for watch list storage and trend lookup.
// `displayName` and `date` are localized at render time via the lookup maps below.

const LAB_RESULTS = [
  // ── CBC (Day +90, Mar 19 2026) ────────────────────────────────────────────
  { id: '1',  name: 'WBC',             value: '3.8 K/µL',    ref: '4.5–11.0 K/µL',   status: 'low',        date: 'Mar 19, 2026', unit: 'K/µL' },
  { id: '2',  name: 'Hemoglobin',      value: '9.4 g/dL',    ref: '12.0–16.0 g/dL',  status: 'low',        date: 'Mar 19, 2026', unit: 'g/dL' },
  { id: '3',  name: 'Hematocrit',      value: '28.5%',       ref: '36–46%',           status: 'low',        date: 'Mar 19, 2026', unit: '%' },
  { id: '4',  name: 'Platelets',       value: '88 K/µL',     ref: '150–400 K/µL',    status: 'low',        date: 'Mar 19, 2026', unit: 'K/µL' },
  // ── Kidney / CMP ──────────────────────────────────────────────────────────
  { id: '5',  name: 'Creatinine',      value: '1.18 mg/dL',  ref: '0.5–1.1 mg/dL',   status: 'high',       date: 'Mar 19, 2026', unit: 'mg/dL' },
  { id: '6',  name: 'BUN',             value: '22 mg/dL',    ref: '7–25 mg/dL',      status: 'normal',     date: 'Mar 19, 2026', unit: 'mg/dL' },
  { id: '7',  name: 'eGFR',            value: '58 mL/min',   ref: '>60 mL/min',      status: 'borderline', date: 'Mar 19, 2026', unit: 'mL/min' },
  // ── Electrolytes ──────────────────────────────────────────────────────────
  { id: '8',  name: 'Magnesium',       value: '1.4 mEq/L',   ref: '1.7–2.2 mEq/L',  status: 'low',        date: 'Mar 19, 2026', unit: 'mEq/L' },
  { id: '9',  name: 'Potassium',       value: '3.4 mEq/L',   ref: '3.5–5.0 mEq/L',  status: 'borderline', date: 'Mar 19, 2026', unit: 'mEq/L' },
  // ── Liver ─────────────────────────────────────────────────────────────────
  { id: '10', name: 'ALT',             value: '68 U/L',      ref: '7–40 U/L',        status: 'high',       date: 'Mar 19, 2026', unit: 'U/L' },
  { id: '11', name: 'AST',             value: '52 U/L',      ref: '10–40 U/L',       status: 'high',       date: 'Mar 19, 2026', unit: 'U/L' },
  { id: '12', name: 'Total Bilirubin', value: '1.9 mg/dL',   ref: '0.2–1.2 mg/dL',  status: 'high',       date: 'Mar 19, 2026', unit: 'mg/dL' },
  // ── Immunosuppression ─────────────────────────────────────────────────────
  { id: '13', name: 'Tacrolimus',      value: '8.2 ng/mL',   ref: '6–12 ng/mL',     status: 'normal',     date: 'Mar 19, 2026', unit: 'ng/mL' },
  // ── Infection Surveillance ────────────────────────────────────────────────
  { id: '14', name: 'CMV PCR',         value: '285 IU/mL',   ref: '<137 IU/mL',     status: 'high',       date: 'Mar 19, 2026', unit: 'IU/mL' },
  // ── Iron / Inflammation ───────────────────────────────────────────────────
  { id: '15', name: 'Ferritin',        value: '4,820 ng/mL', ref: '10–200 ng/mL',   status: 'high',       date: 'Mar 19, 2026', unit: 'ng/mL' },
  // ── Immunoglobulins ───────────────────────────────────────────────────────
  { id: '16', name: 'IgG',             value: '418 mg/dL',   ref: '700–1,600 mg/dL', status: 'low',       date: 'Mar 5, 2026',  unit: 'mg/dL' },
  // ── Engraftment ───────────────────────────────────────────────────────────
  { id: '17', name: 'Donor Chimerism', value: '97%',         ref: '>95%',            status: 'normal',     date: 'Feb 17, 2026', unit: '%' },
  { id: '18', name: 'T-cell Chimerism',value: '89%',         ref: '>95%',            status: 'borderline', date: 'Feb 17, 2026', unit: '%' },
];

// Localized display names for lab tests (values/units/refs are universal)
const LAB_DISPLAY_NAMES: Record<Language, Record<string, string>> = {
  en: {},  // empty = fall back to lab.name
  'zh-CN': {
    'WBC':              '白细胞（WBC）',
    'Hemoglobin':       '血红蛋白',
    'Hematocrit':       '红细胞压积',
    'Platelets':        '血小板',
    'Creatinine':       '肌酐',
    'BUN':              '血尿素氮（BUN）',
    'eGFR':             '估算肾小球滤过率',
    'Magnesium':        '镁',
    'Potassium':        '钾',
    'ALT':              '谷丙转氨酶（ALT）',
    'AST':              '谷草转氨酶（AST）',
    'Total Bilirubin':  '总胆红素',
    'Tacrolimus':       '他克莫司血药浓度',
    'CMV PCR':          '巨细胞病毒核酸（CMV PCR）',
    'Ferritin':         '铁蛋白',
    'IgG':              '免疫球蛋白G（IgG）',
    'Donor Chimerism':  '供体嵌合率',
    'T-cell Chimerism': 'T细胞嵌合率',
  },
};

const LAB_DATES: Record<Language, Record<string, string>> = {
  en: {},
  'zh-CN': {
    'Mar 19, 2026': '2026年3月19日',
    'Mar 5, 2026':  '2026年3月5日',
    'Feb 17, 2026': '2026年2月17日',
  },
};

// ─── Medication Data ───────────────────────────────────────────────────────────

interface MedItem { id: string; name: string; dose: string; freq: string }

const MEDS: Record<Language, MedItem[]> = {
  en: [
    { id: '1',  name: 'Tacrolimus',          dose: '2mg',      freq: 'Twice daily (GvHD prophylaxis)' },
    { id: '2',  name: 'Mycophenolate (MMF)', dose: '1,000mg',  freq: 'Three times daily' },
    { id: '3',  name: 'Prednisone',          dose: '30mg',     freq: 'Once daily (tapering)' },
    { id: '4',  name: 'Letermovir',          dose: '480mg',    freq: 'Once daily (CMV prophylaxis)' },
    { id: '5',  name: 'Acyclovir',           dose: '400mg',    freq: 'Twice daily (HSV/VZV)' },
    { id: '6',  name: 'TMP-SMX DS',          dose: '1 tab',    freq: 'Mon / Wed / Fri (PCP prophylaxis)' },
    { id: '7',  name: 'Voriconazole',        dose: '200mg',    freq: 'Twice daily (fungal prophylaxis)' },
    { id: '8',  name: 'IVIG',               dose: '0.4 g/kg',  freq: 'Every 3–4 weeks (IgG replacement)' },
    { id: '9',  name: 'Magnesium Oxide',     dose: '400mg',    freq: 'Three times daily' },
    { id: '10', name: 'Potassium Chloride',  dose: '20 mEq',   freq: 'Twice daily' },
    { id: '11', name: 'Omeprazole',          dose: '20mg',     freq: 'Once daily (GI protection)' },
  ],
  'zh-CN': [
    { id: '1',  name: '他克莫司',                dose: '2mg',      freq: '每日两次（预防移植物抗宿主病）' },
    { id: '2',  name: '吗替麦考酚酯（MMF）',      dose: '1,000mg',  freq: '每日三次' },
    { id: '3',  name: '泼尼松',                  dose: '30mg',     freq: '每日一次（逐步减量中）' },
    { id: '4',  name: '来特莫韦',                dose: '480mg',    freq: '每日一次（预防CMV感染）' },
    { id: '5',  name: '阿昔洛韦',               dose: '400mg',    freq: '每日两次（预防疱疹病毒）' },
    { id: '6',  name: '复方磺胺甲噁唑（TMP-SMX）', dose: '1片',     freq: '周一/三/五（预防卡氏肺孢子虫肺炎）' },
    { id: '7',  name: '伏立康唑',               dose: '200mg',    freq: '每日两次（预防真菌感染）' },
    { id: '8',  name: '静脉免疫球蛋白（IVIG）',   dose: '0.4 g/kg', freq: '每3-4周一次（补充免疫球蛋白）' },
    { id: '9',  name: '氧化镁',                 dose: '400mg',    freq: '每日三次' },
    { id: '10', name: '氯化钾',                 dose: '20 mEq',   freq: '每日两次' },
    { id: '11', name: '奥美拉唑',               dose: '20mg',     freq: '每日一次（保护胃黏膜）' },
  ],
};

const STATUS_COLOR: Record<string, string> = {
  high: Colors.red, low: Colors.orange, borderline: Colors.orange, normal: Colors.green,
};

export default function RecordsScreen() {
  const { language, t } = useLanguage();
  const { toggle, isWatching } = useWatchList();
  const [selecting, setSelecting] = useState(false);

  const meds = MEDS[language];
  const watchedLabs = LAB_RESULTS.filter(l => isWatching(l.name));
  const allLabs = LAB_RESULTS;

  const getDisplayName = (name: string) =>
    LAB_DISPLAY_NAMES[language][name] ?? name;

  const getDisplayDate = (date: string) =>
    LAB_DATES[language][date] ?? date;

  const handleLabPress = (lab: typeof LAB_RESULTS[0]) => {
    if (selecting) {
      toggle(lab.name);
    } else {
      router.push({
        pathname: '/lab-trend',
        params: { name: lab.name, value: lab.value, ref: lab.ref, status: lab.status, unit: lab.unit },
      });
    }
  };

  const renderLabRow = (lab: typeof LAB_RESULTS[0], showStar = false) => (
    <TouchableOpacity
      key={lab.id + (showStar ? '-w' : '')}
      style={[styles.labRow, selecting && styles.labRowSelecting]}
      onPress={() => handleLabPress(lab)}
      activeOpacity={0.7}
    >
      {selecting ? (
        <View style={[styles.checkbox, isWatching(lab.name) && styles.checkboxChecked]}>
          {isWatching(lab.name) && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
      ) : showStar ? (
        <View style={styles.starBadge}>
          <Ionicons name="star" size={14} color={Colors.orange} />
        </View>
      ) : null}
      <View style={styles.labMain}>
        <Text style={styles.labName}>{getDisplayName(lab.name)}</Text>
        <Text style={styles.labDate}>{getDisplayDate(lab.date)}</Text>
      </View>
      <View style={styles.labRight}>
        <Text style={[styles.labValue, { color: STATUS_COLOR[lab.status] }]}>{lab.value}</Text>
        <Text style={styles.labRef}>{lab.ref}</Text>
        {!selecting && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.labChevron} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('records')}</Text>
        <View style={styles.headerActions}>
          {!selecting && (
            <TouchableOpacity
              style={styles.askBtn}
              onPress={() => router.push('/chat?message=Explain my latest lab results')}
            >
              <Ionicons name="sparkles" size={13} color={Colors.blue} />
              <Text style={styles.askBtnText}>{t('askAI')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.selectBtn, selecting && styles.selectBtnActive]}
            onPress={() => setSelecting(v => !v)}
          >
            <Text style={[styles.selectBtnText, selecting && styles.selectBtnTextActive]}>
              {selecting ? t('doneBtn') : t('selectBtn')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Watch List section */}
        {watchedLabs.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View style={styles.watchListLabel}>
                <Ionicons name="star" size={12} color={Colors.orange} />
                <Text style={styles.sectionLabel}>{t('watchList')}</Text>
              </View>
              <Text style={styles.sectionSub}>{watchedLabs.length} {t('monitored')}</Text>
            </View>
            {watchedLabs.map(lab => renderLabRow(lab, true))}
            <View style={styles.divider} />
          </>
        )}

        {selecting && watchedLabs.length === 0 && (
          <View style={styles.selectHint}>
            <Text style={styles.selectHintText}>{t('watchListHint')}</Text>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('labResults')}</Text>
          {selecting && <Text style={styles.sectionSub}>{t('watchToggleHint')}</Text>}
        </View>
        {allLabs.map(lab => renderLabRow(lab, false))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('medications')}</Text>
        {meds.map((med) => (
          <View key={med.id} style={styles.medRow}>
            <View style={styles.medIcon}>
              <Ionicons name="medical-outline" size={18} color={Colors.blue} />
            </View>
            <View style={styles.medBody}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDose}>{med.dose} · {med.freq}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${Colors.blue}20`, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  askBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  selectBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bgGrouped },
  selectBtnActive: { backgroundColor: Colors.blue },
  selectBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  selectBtnTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: Colors.textTertiary },
  watchListLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  divider: { height: 1, backgroundColor: Colors.separator, marginVertical: 16 },
  selectHint: {
    backgroundColor: `${Colors.blue}15`, borderRadius: 10, padding: 12, marginBottom: 16,
  },
  selectHintText: { color: Colors.blue, fontSize: 13, textAlign: 'center' },
  labRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgGrouped, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  labRowSelecting: { paddingLeft: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: Colors.textTertiary, alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  starBadge: { marginRight: 8 },
  labMain: { flex: 1, gap: 3 },
  labName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  labDate: { fontSize: 12, color: Colors.textTertiary },
  labRight: { alignItems: 'flex-end', gap: 2 },
  labValue: { fontSize: 17, fontWeight: '600' },
  labRef: { fontSize: 11, color: Colors.textTertiary },
  labChevron: { marginTop: 2 },
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgGrouped, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  medIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: `${Colors.blue}18`, alignItems: 'center', justifyContent: 'center' },
  medBody: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  medDose: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

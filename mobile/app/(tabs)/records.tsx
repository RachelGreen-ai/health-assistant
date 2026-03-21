import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import { useWatchList } from '@/hooks/useWatchList';

const LAB_RESULTS = [
  { id: '1', name: 'HbA1c',           value: '7.8%',       ref: '4.0–5.6%',    status: 'high',       date: 'Mar 20, 2026', unit: '%' },
  { id: '2', name: 'Fasting Glucose', value: '142 mg/dL',  ref: '70–100 mg/dL', status: 'high',       date: 'Mar 20, 2026', unit: 'mg/dL' },
  { id: '3', name: 'LDL Cholesterol', value: '98 mg/dL',   ref: '<100 mg/dL',   status: 'normal',     date: 'Mar 20, 2026', unit: 'mg/dL' },
  { id: '4', name: 'Blood Pressure',  value: '128/82',      ref: '<120/80',      status: 'borderline', date: 'Mar 18, 2026', unit: 'mmHg' },
  { id: '5', name: 'eGFR',            value: '74 mL/min',  ref: '>60 mL/min',   status: 'normal',     date: 'Mar 20, 2026', unit: 'mL/min' },
];

const MEDS = [
  { id: '1', name: 'Metformin',    dose: '1000mg', freq: 'Twice daily',  icon: '💊' },
  { id: '2', name: 'Lisinopril',   dose: '10mg',   freq: 'Once daily',   icon: '💊' },
  { id: '3', name: 'Atorvastatin', dose: '40mg',   freq: 'Once nightly', icon: '💊' },
  { id: '4', name: 'Aspirin',      dose: '81mg',   freq: 'Once daily',   icon: '💊' },
];

const STATUS_COLOR: Record<string, string> = {
  high: Colors.red, low: Colors.orange, borderline: Colors.orange, normal: Colors.green,
};

export default function RecordsScreen() {
  const { t } = useLanguage();
  const { watchList, toggle, isWatching } = useWatchList();
  const [selecting, setSelecting] = useState(false);

  const watchedLabs = LAB_RESULTS.filter(l => isWatching(l.name));
  const allLabs = LAB_RESULTS;

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
          {isWatching(lab.name) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      ) : showStar ? (
        <View style={styles.starBadge}>
          <Text style={styles.starIcon}>★</Text>
        </View>
      ) : null}
      <View style={styles.labMain}>
        <Text style={styles.labName}>{lab.name}</Text>
        <Text style={styles.labDate}>{lab.date}</Text>
      </View>
      <View style={styles.labRight}>
        <Text style={[styles.labValue, { color: STATUS_COLOR[lab.status] }]}>{lab.value}</Text>
        <Text style={styles.labRef}>{lab.ref}</Text>
        {!selecting && <Text style={styles.labChevron}>›</Text>}
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
              <Text style={styles.askBtnText}>✦ Ask AI</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.selectBtn, selecting && styles.selectBtnActive]}
            onPress={() => setSelecting(v => !v)}
          >
            <Text style={[styles.selectBtnText, selecting && styles.selectBtnTextActive]}>
              {selecting ? 'Done' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Watch List section */}
        {watchedLabs.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>★ Watch List</Text>
              <Text style={styles.sectionSub}>{watchedLabs.length} monitored</Text>
            </View>
            {watchedLabs.map(lab => renderLabRow(lab, true))}
            <View style={styles.divider} />
          </>
        )}

        {selecting && watchedLabs.length === 0 && (
          <View style={styles.selectHint}>
            <Text style={styles.selectHintText}>Tap results below to add them to your Watch List</Text>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('labResults')}</Text>
          {selecting && <Text style={styles.sectionSub}>Tap to watch/unwatch</Text>}
        </View>
        {allLabs.map(lab => renderLabRow(lab, false))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('medications')}</Text>
        {MEDS.map((med) => (
          <View key={med.id} style={styles.medRow}>
            <View style={styles.medIcon}>
              <Text style={styles.medIconText}>{med.icon}</Text>
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
  askBtn: { backgroundColor: `${Colors.blue}20`, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  askBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  selectBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bgGrouped },
  selectBtnActive: { backgroundColor: Colors.blue },
  selectBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  selectBtnTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: Colors.textTertiary },
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
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  starBadge: { marginRight: 8 },
  starIcon: { color: Colors.orange, fontSize: 14 },
  labMain: { flex: 1, gap: 3 },
  labName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  labDate: { fontSize: 12, color: Colors.textTertiary },
  labRight: { alignItems: 'flex-end', gap: 2 },
  labValue: { fontSize: 17, fontWeight: '600' },
  labRef: { fontSize: 11, color: Colors.textTertiary },
  labChevron: { fontSize: 18, color: Colors.textTertiary, marginTop: 2 },
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgGrouped, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  medIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  medIconText: { fontSize: 18 },
  medBody: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  medDose: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

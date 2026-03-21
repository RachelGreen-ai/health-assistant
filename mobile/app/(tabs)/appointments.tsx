import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApptStatus = 'upcoming' | 'soon';
type ApptType = 'office' | 'lab' | 'telehealth';

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;          // display string
  sortDate: number;      // ms timestamp for sorting
  time: string;
  status?: ApptStatus;
  type?: ApptType;
  note?: string;
}

interface PastAppointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  sortDate: number;
  time: string;
  type?: ApptType;
  visitType?: string;    // "Office Visit", "Telehealth", etc.
  note?: string;
  visitNote: string;     // full clinical note content
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
// Today is 2026-03-20. Upcoming = after today; Past = before today.

const UPCOMING: Appointment[] = [
  {
    id: 'u1', doctor: 'Stanford Lab', specialty: 'Lab Work',
    date: 'Apr 5, 2026', sortDate: new Date('2026-04-05T07:30').getTime(),
    time: '7:30 AM', status: 'soon', type: 'lab',
    note: 'Fasting required · Pre-visit labs for Dr. Park',
  },
  {
    id: 'u2', doctor: 'Dr. Michael Park', specialty: 'Endocrinology',
    date: 'Apr 29, 2026', sortDate: new Date('2026-04-29T14:30').getTime(),
    time: '2:30 PM', status: 'upcoming', type: 'office',
    note: 'HbA1c trend review — bring glucose log',
  },
  {
    id: 'u3', doctor: 'Dr. Sarah Chen', specialty: 'Primary Care',
    date: 'May 12, 2026', sortDate: new Date('2026-05-12T10:00').getTime(),
    time: '10:00 AM', status: 'upcoming', type: 'office',
    note: 'Annual wellness visit',
  },
];

const PAST: PastAppointment[] = [
  {
    id: 'p1', doctor: 'Dr. Michael Park', specialty: 'Endocrinology',
    date: 'Jan 15, 2026', sortDate: new Date('2026-01-15T14:30').getTime(),
    time: '2:30 PM', type: 'office', visitType: 'Office Visit',
    note: 'HbA1c follow-up, diabetes management review',
    visitNote: `ENDOCRINOLOGY FOLLOW-UP NOTE — Jan 15, 2026
Provider: Dr. Michael Park, MD | Stanford Health Care

CHIEF COMPLAINT
Diabetes management follow-up, HbA1c review.

SUBJECTIVE
Patient presents for routine diabetes follow-up. Reports good compliance with metformin 1000 mg BID. Occasional fasting glucose readings of 130–150 mg/dL. Denies hypoglycemic episodes. Notes improved dietary habits over past 3 months with reduced carbohydrate intake.

OBJECTIVE
Weight: 185 lbs (↓3 lbs from last visit)
BP: 128/82 mmHg | HR: 72 bpm
HbA1c: 7.2% (improved from 7.8% in Oct 2025)
Fasting glucose today: 138 mg/dL
Foot exam: No lesions, sensation intact bilaterally.

ASSESSMENT
1. Type 2 Diabetes Mellitus — improving glycemic control
2. Hypertension — stable on current regimen
3. Obesity — slow but steady weight loss progress

PLAN
1. Continue metformin 1000 mg BID
2. ADD jardiance (empagliflozin) 10 mg daily for cardiovascular benefit and additional glucose lowering
3. Repeat HbA1c and comprehensive metabolic panel in 3 months (target Apr 2026)
4. Continue current diet and aerobic exercise regimen
5. Provided patient education on sick-day management and hypoglycemia awareness
6. Referral to dietitian placed — patient to schedule within 4 weeks

FOLLOW-UP: 3–4 months or sooner if glucose readings consistently >200 mg/dL

─────────────────────────────────────────────────────
ENDOCRINOLOGY FOLLOW-UP NOTE — Oct 22, 2025
Provider: Dr. Michael Park, MD | Stanford Health Care

CHIEF COMPLAINT
Worsening glycemic control, HbA1c trending up.

SUBJECTIVE
Patient returns for follow-up. Reports less adherent to diet over summer months. Fasting glucose readings 160–200 mg/dL. No hypoglycemic episodes. Denies polyuria, polydipsia. Mild fatigue noted.

OBJECTIVE
Weight: 188 lbs (↑4 lbs)
BP: 134/86 mmHg | HR: 76 bpm
HbA1c: 7.8% (up from 7.1% in Apr 2025)

ASSESSMENT
1. Type 2 Diabetes Mellitus — suboptimal control
2. Hypertension — slightly elevated, monitor

PLAN
1. Increase metformin to 1000 mg BID (was 500 mg BID)
2. Reinforce dietary counseling — referral to nutrition
3. Begin home glucose log — check fasting and 2h post-meal
4. Repeat HbA1c in 3 months
5. Consider adding GLP-1 agonist or SGLT2 inhibitor at next visit if no improvement

FOLLOW-UP: 3 months`,
  },
  {
    id: 'p2', doctor: 'Dr. Sarah Chen', specialty: 'Primary Care',
    date: 'Nov 3, 2025', sortDate: new Date('2025-11-03T09:00').getTime(),
    time: '9:00 AM', type: 'office', visitType: 'Annual Wellness Visit',
    note: 'Annual physical exam',
    visitNote: `PRIMARY CARE — ANNUAL WELLNESS VISIT — Nov 3, 2025
Provider: Dr. Sarah Chen, MD | Palo Alto Medical Foundation

PREVENTIVE CARE SUMMARY
Patient presents for annual wellness visit. Overall health is stable. Managing type 2 diabetes and hypertension with endocrinology co-management.

VITALS
Weight: 187 lbs | Height: 5'9" | BMI: 27.6
BP: 130/84 mmHg | HR: 74 bpm | Temp: 98.6°F
O2 Sat: 98% on room air

SCREENINGS & PREVENTIVE MEASURES
• Colorectal cancer screening: Cologuard ordered (age-appropriate)
• Depression screen (PHQ-9): Score 3 — minimal symptoms
• Alcohol use screen (AUDIT-C): Low risk
• Vision: Reports no changes, last eye exam 2024
• Hearing: Intact to conversational speech
• Immunizations: Flu vaccine given today; Tdap up to date; COVID-19 boosted Mar 2025

PHYSICAL EXAM
General: Well-appearing, no acute distress
HEENT: Normocephalic, PERRLA, TMs clear
Cardiovascular: RRR, no murmurs
Respiratory: CTA bilaterally
Abdomen: Soft, non-tender, no organomegaly
Extremities: No edema, pulses intact
Skin: No suspicious lesions

ASSESSMENT
1. Type 2 Diabetes — managed with endocrinology, HbA1c 7.8% (Oct 2025)
2. Hypertension — controlled
3. Preventive care — up to date per above

PLAN
1. Continue all current medications per endocrinology
2. Cologuard kit mailed to patient
3. Lipid panel ordered — fasting draw within 2 weeks
4. Follow up annual wellness in 12 months
5. Patient counseled on weight management and cardiovascular risk reduction

─────────────────────────────────────────────────────
PRIMARY CARE — SICK VISIT — Mar 12, 2025
Provider: Dr. Sarah Chen, MD

CHIEF COMPLAINT
Productive cough × 5 days, low-grade fever.

OBJECTIVE
Temp: 99.8°F | SpO2: 97%
Lungs: Scattered rhonchi bilaterally, no wheezing

ASSESSMENT
Acute bronchitis, likely viral

PLAN
1. Supportive care — rest, fluids, honey/lemon
2. Guaifenesin 400 mg q4h PRN for cough
3. No antibiotics indicated at this time
4. Return if fever >101°F or symptoms worsen after 7 days`,
  },
  {
    id: 'p3', doctor: 'Stanford Lab', specialty: 'Lab Work',
    date: 'Oct 23, 2025', sortDate: new Date('2025-10-23T07:00').getTime(),
    time: '7:00 AM', type: 'lab', visitType: 'Lab Draw',
    note: 'Pre-visit labs — HbA1c, CMP, lipid panel',
    visitNote: `LAB DRAW — Oct 23, 2025
Ordering Provider: Dr. Michael Park, MD
Facility: Stanford Lab Services — Palo Alto

ORDERS
• Hemoglobin A1c
• Comprehensive Metabolic Panel (CMP)
• Lipid Panel (fasting)
• Urine microalbumin/creatinine ratio

RESULTS (reported Oct 23, 2025)
HbA1c: 7.8% [H] (ref: <5.7%)
Glucose: 172 mg/dL [H] (ref: 70–99)
BUN: 18 mg/dL (normal)
Creatinine: 0.92 mg/dL (normal)
eGFR: >60 mL/min (normal)
Potassium: 4.1 mEq/L (normal)
Sodium: 139 mEq/L (normal)
Total Cholesterol: 198 mg/dL (borderline)
LDL: 124 mg/dL [borderline H] (ref: <100)
HDL: 48 mg/dL [L] (ref: >40)
Triglycerides: 162 mg/dL [H] (ref: <150)
Urine Albumin/Creatinine: 24 mg/g (normal <30)

PROVIDER NOTES
Results reviewed and shared with patient via MyChart. HbA1c trending up — discussed at Oct 22 endocrinology visit. LDL and triglycerides borderline — to monitor.`,
  },
];

// Sort upcoming ascending (soonest first), past descending (most recent first)
const sortedUpcoming = [...UPCOMING].sort((a, b) => a.sortDate - b.sortDate);
const sortedPast = [...PAST].sort((a, b) => b.sortDate - a.sortDate);

// ─── Visit Note Modal ──────────────────────────────────────────────────────────

function VisitNoteModal({
  appt,
  visible,
  onClose,
}: {
  appt: PastAppointment | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!appt) return null;

  const handleReviewWithAI = () => {
    onClose();
    setTimeout(() => {
      const prompt = `Please review and summarize my ${appt.visitType ?? appt.specialty} visit with ${appt.doctor} on ${appt.date}. Fetch the clinical notes for that date and give me a clear, patient-friendly summary covering: (1) why I came in, (2) what was examined and found, (3) any diagnosis updates, (4) medication changes (new, stopped, or adjusted), (5) any labs or referrals ordered, and (6) my follow-up action items.`;
      router.push(`/chat?message=${encodeURIComponent(prompt)}`);
    }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={modal.overlay}>
        <View style={[modal.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={modal.sheetHeader}>
            <View style={modal.handleBar} />
          </View>

          <View style={modal.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={modal.noteDoctor}>{appt.doctor}</Text>
              <Text style={modal.noteMeta}>{appt.visitType ?? appt.specialty} · {appt.date} · {appt.time}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Text style={modal.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={modal.divider} />

          {/* Scrollable note */}
          <ScrollView
            style={modal.noteScroll}
            contentContainerStyle={modal.noteContent}
            showsVerticalScrollIndicator
          >
            <Text style={modal.noteText}>{appt.visitNote}</Text>
          </ScrollView>

          <View style={modal.divider} />

          {/* AI Review CTA */}
          <TouchableOpacity style={modal.aiBtn} onPress={handleReviewWithAI} activeOpacity={0.8}>
            <Text style={modal.aiBtnText}>✦ Review with AI</Text>
            <Text style={modal.aiBtnSub}>Get a plain-language summary of this visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={sec.row}>
      <Text style={sec.title}>{title}</Text>
      <View style={sec.badge}>
        <Text style={sec.badgeText}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Upcoming Card ─────────────────────────────────────────────────────────────

function UpcomingCard({ appt }: { appt: Appointment }) {
  return (
    <View style={card.base}>
      <View style={card.top}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={card.doctor}>{appt.doctor}</Text>
          <Text style={card.specialty}>{appt.specialty}</Text>
        </View>
        <View style={[card.pill, appt.status === 'soon' && card.pillSoon]}>
          <Text style={[card.pillText, appt.status === 'soon' && card.pillTextSoon]}>
            {appt.status === 'soon' ? 'Soon' : 'Upcoming'}
          </Text>
        </View>
      </View>
      <Text style={card.date}>📅 {appt.date} · {appt.time}</Text>
      {appt.note && <Text style={card.note}>{appt.note}</Text>}
      <View style={card.actions}>
        <TouchableOpacity
          style={card.btnPrimary}
          activeOpacity={0.8}
          onPress={() => router.push(
            `/chat?message=${encodeURIComponent(`Help me prepare for my ${appt.specialty} appointment with ${appt.doctor} on ${appt.date}. What should I know, bring, and ask?`)}`
          )}
        >
          <Text style={card.btnPrimaryText}>✦ Prep with AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnSec} activeOpacity={0.7}>
          <Text style={card.btnSecText}>Reschedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Past Card ─────────────────────────────────────────────────────────────────

function PastCard({
  appt,
  onViewNote,
}: {
  appt: PastAppointment;
  onViewNote: (appt: PastAppointment) => void;
}) {
  const handleReviewWithAI = () => {
    const prompt = `Please review and summarize my ${appt.visitType ?? appt.specialty} visit with ${appt.doctor} on ${appt.date}. Fetch the clinical notes for that date and give me a clear, patient-friendly summary: why I came in, what was found, diagnosis updates, medication changes, any orders placed, and my action items.`;
    router.push(`/chat?message=${encodeURIComponent(prompt)}`);
  };

  return (
    <View style={[card.base, card.pastBase]}>
      <View style={card.top}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={card.doctor}>{appt.doctor}</Text>
          <Text style={card.specialty}>{appt.specialty}</Text>
        </View>
        {appt.visitType && (
          <View style={card.visitTypePill}>
            <Text style={card.visitTypeText}>{appt.visitType}</Text>
          </View>
        )}
      </View>
      <Text style={card.date}>📅 {appt.date} · {appt.time}</Text>
      {appt.note && <Text style={card.note}>{appt.note}</Text>}
      <View style={card.actions}>
        <TouchableOpacity
          style={card.btnNote}
          activeOpacity={0.8}
          onPress={() => onViewNote(appt)}
        >
          <Text style={card.btnNoteText}>📄 Visit Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnAI} activeOpacity={0.8} onPress={handleReviewWithAI}>
          <Text style={card.btnAIText}>✦ Review with AI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const { t } = useLanguage();
  const [selectedNote, setSelectedNote] = useState<PastAppointment | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointmentsTitle')}</Text>
        <TouchableOpacity style={styles.prepBtn} onPress={() => router.push('/prep')}>
          <Text style={styles.prepBtnText}>📋 Prep</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Upcoming */}
        <SectionHeader title="Upcoming" count={sortedUpcoming.length} />
        {sortedUpcoming.map((appt) => (
          <UpcomingCard key={appt.id} appt={appt} />
        ))}

        {/* Past */}
        <SectionHeader title="Past Visits" count={sortedPast.length} />
        {sortedPast.map((appt) => (
          <PastCard key={appt.id} appt={appt} onViewNote={setSelectedNote} />
        ))}
      </ScrollView>

      {/* Visit Note Modal */}
      <VisitNoteModal
        appt={selectedNote}
        visible={selectedNote !== null}
        onClose={() => setSelectedNote(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  prepBtn: {
    backgroundColor: `${Colors.purple}25`, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  prepBtnText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
});

const sec = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 2 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
});

const card = StyleSheet.create({
  base: { backgroundColor: Colors.bgGrouped, borderRadius: 16, padding: 16, gap: 8 },
  pastBase: { opacity: 0.92 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  doctor: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  specialty: { fontSize: 13, color: Colors.textSecondary },
  date: { fontSize: 13, color: Colors.textSecondary },
  note: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17, fontStyle: 'italic' },
  // Status pills – upcoming
  pill: { backgroundColor: `${Colors.blue}20`, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillSoon: { backgroundColor: `${Colors.orange}20` },
  pillText: { fontSize: 11, fontWeight: '600', color: Colors.blue },
  pillTextSoon: { color: Colors.orange },
  // Visit type tag – past
  visitTypePill: { backgroundColor: Colors.bgCard, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  visitTypeText: { fontSize: 11, fontWeight: '500', color: Colors.textTertiary },
  // Actions row
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  // Upcoming buttons
  btnPrimary: { flex: 1, backgroundColor: Colors.blue, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSec: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnSecText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  // Past buttons
  btnNote: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnNoteText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  btnAI: { flex: 1, backgroundColor: `${Colors.purple}22`, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnAIText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgGrouped,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  sheetHeader: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handleBar: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.separator,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 12,
  },
  noteDoctor: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  noteMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  closeBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  divider: { height: 0.5, backgroundColor: Colors.separator },
  noteScroll: { flexShrink: 1 },
  noteContent: { padding: 20 },
  noteText: {
    fontSize: 13, color: Colors.textSecondary, lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  aiBtn: {
    margin: 16, backgroundColor: `${Colors.purple}22`,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', gap: 3,
  },
  aiBtnText: { color: Colors.purple, fontSize: 15, fontWeight: '700' },
  aiBtnSub: { color: `${Colors.purple}99`, fontSize: 12 },
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/constants/i18n';

const GREETING = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 18) return '🌤️';
  return '🌙';
};

export default function HomeScreen() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Language Toggle */}
      <View style={styles.langBar}>
        <View style={styles.langToggle}>
          {(['en', 'zh-CN'] as Language[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langOpt, language === lang && styles.langOptActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                {lang === 'en' ? 'EN' : '中文'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Greeting */}
        <View style={styles.greetingCard}>
          <View>
            <Text style={styles.greetingTitle}>
              {t('greeting')}, Camila {GREETING()}
            </Text>
            <Text style={styles.greetingSubtitle}>
              {new Date().toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>C</Text></View>
        </View>

        {/* Ask CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ask HealthCompanion</Text>
          <Text style={styles.ctaBody}>{t('askPrompt')}</Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/chat?mode=voice')}
            >
              <Text style={styles.ctaBtnText}>🎙 {t('voiceBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaBtn, styles.ctaBtnSec]}
              onPress={() => router.push('/chat')}
            >
              <Text style={[styles.ctaBtnText, styles.ctaBtnSecText]}>⌨ {t('typeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert cards */}
        <AlertCard
          icon="📅"
          title="Appointment in 6 weeks"
          subtitle="Dr. Park · Endocrinology · Apr 29 · 2:30 PM"
          badge="Reschedule suggested"
          color={Colors.orange}
          onPress={() => router.push('/appointments')}
        />
        <AlertCard
          icon="🧪"
          title="New lab results available"
          subtitle="HbA1c · Glucose · Received today"
          color={Colors.blue}
          onPress={() => router.push('/records')}
        />
        <AlertCard
          icon="💊"
          title="4 active medications"
          subtitle="Metformin · Lisinopril · Atorvastatin · Aspirin"
          color={Colors.green}
          onPress={() => router.push('/records')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertCard({
  icon, title, subtitle, badge, color, onPress,
}: {
  icon: string; title: string; subtitle: string;
  badge?: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.alertCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.alertIcon, { backgroundColor: `${color}20` }]}>
        <Text style={styles.alertIconText}>{icon}</Text>
      </View>
      <View style={styles.alertBody}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSubtitle}>{subtitle}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${color}25` }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  langBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 },
  langToggle: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 20, padding: 2 },
  langOpt: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 18 },
  langOptActive: { backgroundColor: Colors.blue },
  langText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  langTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  greetingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  greetingTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  greetingSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  ctaCard: { backgroundColor: Colors.bgGrouped, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${Colors.blue}40` },
  ctaTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  ctaBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 14 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaBtn: { flex: 1, backgroundColor: Colors.blue, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  ctaBtnSec: { backgroundColor: Colors.bgCard },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ctaBtnSecText: { color: Colors.textPrimary },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgGrouped, borderRadius: 14, padding: 14, gap: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertIconText: { fontSize: 20 },
  alertBody: { flex: 1, gap: 3 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  alertSubtitle: { fontSize: 12, color: Colors.textSecondary },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
});

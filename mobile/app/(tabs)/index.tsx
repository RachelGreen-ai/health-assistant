import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/constants/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function greetingIcon(): { name: IoniconName; color: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { name: 'sunny', color: Colors.orange };
  if (hour < 18) return { name: 'partly-sunny', color: Colors.orange };
  return { name: 'moon', color: Colors.blue };
}

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

interface AlertData {
  iconName: IoniconName;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: string;
  color: string;
  route: '/records' | '/appointments';
}

const ALERTS: Record<Language, AlertData[]> = {
  en: [
    {
      iconName: 'warning-outline',
      iconColor: Colors.orange,
      title: 'CMV detected — Day +90',
      subtitle: 'CMV PCR 285 IU/mL · Above threshold of 137 · Monitor weekly',
      badge: 'Action needed',
      color: Colors.orange,
      route: '/records',
    },
    {
      iconName: 'alert-circle-outline',
      iconColor: Colors.red,
      title: 'Low magnesium',
      subtitle: 'Mg 1.4 mEq/L · Tacrolimus-related wasting · MgO dose active',
      badge: 'Watch closely',
      color: Colors.red,
      route: '/records',
    },
    {
      iconName: 'calendar-outline',
      iconColor: Colors.blue,
      title: 'Day +100 BMT visit in 10 days',
      subtitle: 'Dr. Patel · BMT Clinic · Mar 30 · Bone marrow biopsy scheduled',
      badge: 'Prep checklist ready',
      color: Colors.blue,
      route: '/appointments',
    },
    {
      iconName: 'flask-outline',
      iconColor: Colors.blue,
      title: 'Day +90 labs received',
      subtitle: 'CBC · CMP · Tacrolimus · CMV PCR · Mar 19, 2026',
      color: Colors.blue,
      route: '/records',
    },
    {
      iconName: 'medical-outline',
      iconColor: Colors.green,
      title: '11 active medications',
      subtitle: 'Tacrolimus · MMF · Prednisone · Letermovir + 7 more',
      color: Colors.green,
      route: '/records',
    },
  ],
  'zh-CN': [
    {
      iconName: 'warning-outline',
      iconColor: Colors.orange,
      title: '检测到CMV — 移植后第+90天',
      subtitle: 'CMV PCR 285 IU/mL · 超过阈值137 · 每周监测',
      badge: '需要处理',
      color: Colors.orange,
      route: '/records',
    },
    {
      iconName: 'alert-circle-outline',
      iconColor: Colors.red,
      title: '镁偏低',
      subtitle: 'Mg 1.4 mEq/L · 他克莫司相关流失 · 氧化镁剂量有效',
      badge: '密切关注',
      color: Colors.red,
      route: '/records',
    },
    {
      iconName: 'calendar-outline',
      iconColor: Colors.blue,
      title: '移植后第+100天复诊还有10天',
      subtitle: '帕特尔医生 · 骨髓移植门诊 · 3月30日 · 骨髓活检已安排',
      badge: '备诊清单已就绪',
      color: Colors.blue,
      route: '/appointments',
    },
    {
      iconName: 'flask-outline',
      iconColor: Colors.blue,
      title: '移植后第+90天化验结果已出',
      subtitle: '全血细胞计数 · 代谢全项 · 他克莫司 · CMV PCR · 2026年3月19日',
      color: Colors.blue,
      route: '/records',
    },
    {
      iconName: 'medical-outline',
      iconColor: Colors.green,
      title: '11种在用药物',
      subtitle: '他克莫司 · 吗替麦考酚酯 · 泼尼松 · 来特莫韦 + 7种其他',
      color: Colors.green,
      route: '/records',
    },
  ],
};

export default function HomeScreen() {
  const { language, setLanguage, t } = useLanguage();
  const greeting = greetingIcon();
  const greetingText = t(greetingKey());
  const alerts = ALERTS[language];

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
            <View style={styles.greetingTitleRow}>
              <Text style={styles.greetingTitle}>{greetingText}, Sophia</Text>
              <Ionicons name={greeting.name} size={20} color={greeting.color} />
            </View>
            <Text style={styles.greetingSubtitle}>
              {new Date().toLocaleDateString(language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>S</Text></View>
        </View>

        {/* Ask CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>{t('ctaTitle')}</Text>
          <Text style={styles.ctaBody}>{t('askPrompt')}</Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/chat?mode=voice')}
            >
              <View style={styles.ctaBtnInner}>
                <Ionicons name="mic" size={14} color="#fff" />
                <Text style={styles.ctaBtnText}>{t('voiceBtn')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaBtn, styles.ctaBtnSec]}
              onPress={() => router.push('/chat')}
            >
              <View style={styles.ctaBtnInner}>
                <Ionicons name="keypad-outline" size={14} color={Colors.textPrimary} />
                <Text style={[styles.ctaBtnText, styles.ctaBtnSecText]}>{t('typeBtn')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert cards */}
        {alerts.map((alert, i) => (
          <AlertCard
            key={i}
            iconName={alert.iconName}
            iconColor={alert.iconColor}
            title={alert.title}
            subtitle={alert.subtitle}
            badge={alert.badge}
            color={alert.color}
            onPress={() => router.push(alert.route)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertCard({
  iconName, iconColor, title, subtitle, badge, color, onPress,
}: {
  iconName: IoniconName; iconColor: string;
  title: string; subtitle: string;
  badge?: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.alertCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.alertIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={iconName} size={20} color={iconColor} />
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
  greetingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  ctaBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ctaBtnSecText: { color: Colors.textPrimary },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgGrouped, borderRadius: 14, padding: 14, gap: 12 },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertBody: { flex: 1, gap: 3 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  alertSubtitle: { fontSize: 12, color: Colors.textSecondary },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '500' },
});

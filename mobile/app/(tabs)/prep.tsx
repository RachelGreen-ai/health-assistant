import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/constants/i18n';

interface CheckItem {
  id: string;
  text: string;
  detail: string;
  checked: boolean;
  aiGenerated: boolean;
}

const INITIAL_ITEMS: Record<Language, CheckItem[]> = {
  en: [
    { id: '1', text: 'CMV PCR rising — discuss treatment', detail: 'Day +90: 285 IU/mL · Up from <137 at Day +60 · Ask about escalating to ganciclovir', checked: false, aiGenerated: true },
    { id: '2', text: 'Low magnesium despite supplementation', detail: 'Mg 1.4 mEq/L · On MgO 400mg TID · Discuss IV Mg or tacrolimus dose reduction', checked: false, aiGenerated: true },
    { id: '3', text: 'Liver enzymes trending up', detail: 'ALT 68 / AST 52 / Bili 1.9 · Rule out hepatic GvHD vs. voriconazole toxicity', checked: false, aiGenerated: true },
    { id: '4', text: 'T-cell chimerism borderline (89%)', detail: 'Day +60 result · Target >95% · Discuss DLI vs. immunosuppression taper strategy', checked: false, aiGenerated: true },
    { id: '5', text: 'Bone marrow biopsy Day +100', detail: 'Mar 30 · Confirm remission status and engraftment · Prep: NPO 4h, bring ID', checked: false, aiGenerated: false },
    { id: '6', text: 'IVIG infusion due', detail: 'Last infusion Mar 5 · IgG 418 mg/dL (target >500) · Schedule within next 2 weeks', checked: false, aiGenerated: true },
    { id: '7', text: 'Platelet count watch', detail: 'Plt 88 K/µL · No active bleeding · Ask about transfusion threshold policy', checked: false, aiGenerated: false },
  ],
  'zh-CN': [
    { id: '1', text: 'CMV PCR升高 — 讨论治疗方案', detail: '移植后第+90天：285 IU/mL · 较第+60天的<137升高 · 询问是否升级为更昔洛韦治疗', checked: false, aiGenerated: true },
    { id: '2', text: '口服补镁后镁仍偏低', detail: 'Mg 1.4 mEq/L · 正在服用氧化镁400mg每日三次 · 讨论静脉补镁或降低他克莫司剂量', checked: false, aiGenerated: true },
    { id: '3', text: '肝酶持续升高', detail: '谷丙转氨酶68 / 谷草转氨酶52 / 总胆红素1.9 · 排除肝脏移植物抗宿主病或伏立康唑毒性', checked: false, aiGenerated: true },
    { id: '4', text: 'T细胞嵌合率临界（89%）', detail: '第+60天结果 · 目标>95% · 讨论供体淋巴细胞输注（DLI）或减少免疫抑制策略', checked: false, aiGenerated: true },
    { id: '5', text: '移植后第+100天骨髓活检', detail: '3月30日 · 确认缓解状态和植入情况 · 准备：术前4小时禁食、携带身份证件', checked: false, aiGenerated: false },
    { id: '6', text: '免疫球蛋白静脉输注（IVIG）即将到期', detail: '上次输注3月5日 · IgG 418 mg/dL（目标>500）· 在未来2周内安排', checked: false, aiGenerated: true },
    { id: '7', text: '血小板计数监测', detail: '血小板88 K/µL · 无活动性出血 · 询问输血阈值标准', checked: false, aiGenerated: false },
  ],
};

export default function PrepScreen() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<CheckItem[]>(INITIAL_ITEMS[language]);

  // Refresh items when language changes (reset checked state)
  useEffect(() => {
    setItems(INITIAL_ITEMS[language].map((item) => ({ ...item, checked: false })));
  }, [language]);

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const unchecked = items.filter((i) => !i.checked).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('prepTitle')}</Text>
          <Text style={styles.headerSub}>{t('prepSubtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => router.push('/chat?message=Draft a message to Dr. Patel summarizing my Day +100 BMT appointment prep checklist')}
        >
          <Ionicons name="mail-outline" size={13} color={Colors.blue} />
          <Text style={styles.draftBtnText}>{t('draftBtn')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.aiHeader}>
          <View style={styles.aiHeaderLeft}>
            <Ionicons name="sparkles" size={13} color={Colors.blue} />
            <Text style={styles.aiHeaderText}>{t('aiChecklist')}</Text>
          </View>
          <Text style={styles.aiHeaderSub}>{unchecked} {t('itemsToDiscuss')}</Text>
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, item.checked && styles.itemChecked]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <View style={styles.itemBody}>
              <View style={styles.itemTitleRow}>
                <Text style={[styles.itemTitle, item.checked && styles.itemTitleChecked]}>
                  {item.text}
                </Text>
                {item.aiGenerated && (
                  <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
                )}
              </View>
              <Text style={styles.itemDetail}>{item.detail}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.askAiBtn}
          onPress={() => router.push('/chat?message=What else should I discuss with Dr. Patel at my Day +100 BMT visit given my recent labs?')}
        >
          <Ionicons name="sparkles" size={14} color={Colors.blue} />
          <Text style={styles.askAiBtnText}>{t('askAIMore')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  draftBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${Colors.blue}20`, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginTop: 2 },
  draftBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  aiHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 4,
  },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiHeaderText: { fontSize: 13, fontWeight: '600', color: Colors.blue },
  aiHeaderSub: { fontSize: 12, color: Colors.textTertiary },
  item: {
    flexDirection: 'row', gap: 12, backgroundColor: Colors.bgGrouped,
    borderRadius: 14, padding: 14, alignItems: 'flex-start',
  },
  itemChecked: { opacity: 0.5 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: Colors.separator, alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.green, borderColor: Colors.green },
  itemBody: { flex: 1, gap: 4 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  itemTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  itemTitleChecked: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  aiBadge: { backgroundColor: `${Colors.blue}20`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.blue },
  itemDetail: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  askAiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: `${Colors.blue}40`, borderStyle: 'dashed',
    marginTop: 4,
  },
  askAiBtnText: { color: Colors.blue, fontSize: 14, fontWeight: '500' },
});

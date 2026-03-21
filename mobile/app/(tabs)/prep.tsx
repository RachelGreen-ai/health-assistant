import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';

interface CheckItem {
  id: string;
  text: string;
  detail: string;
  checked: boolean;
  aiGenerated: boolean;
}

const INITIAL_ITEMS: CheckItem[] = [
  { id: '1', text: 'HbA1c trend (3 quarters rising)', detail: '6.8% → 7.2% → 7.8% · Ask about medication adjustment', checked: false, aiGenerated: true },
  { id: '2', text: 'Knee swelling', detail: 'Reported Nov 10, 2025 · Ongoing 3 days', checked: false, aiGenerated: true },
  { id: '3', text: 'Metformin nausea', detail: 'Reported in last 2 chat sessions · Ask about alternatives', checked: false, aiGenerated: true },
  { id: '4', text: 'Blood pressure goal check', detail: '128/82 · Target <120/80', checked: false, aiGenerated: false },
];

export default function PrepScreen() {
  const { t } = useLanguage();
  const [items, setItems] = useState<CheckItem[]>(INITIAL_ITEMS);

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const unchecked = items.filter((i) => !i.checked).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('prepTitle')}</Text>
          <Text style={styles.headerSub}>Dr. Park · Apr 29, 2026</Text>
        </View>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => router.push('/chat?message=Draft a message to Dr. Park summarizing my appointment prep checklist')}
        >
          <Text style={styles.draftBtnText}>✉ Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiHeaderText}>✦ AI-Generated Checklist</Text>
          <Text style={styles.aiHeaderSub}>{unchecked} items to discuss</Text>
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, item.checked && styles.itemChecked]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Text style={styles.checkmark}>✓</Text>}
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
          onPress={() => router.push('/chat?message=What else should I discuss with Dr. Park given my recent health data?')}
        >
          <Text style={styles.askAiBtnText}>✦ Ask AI for more suggestions</Text>
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
  draftBtn: { backgroundColor: `${Colors.blue}20`, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginTop: 2 },
  draftBtnText: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  aiHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 4,
  },
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
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemBody: { flex: 1, gap: 4 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  itemTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  itemTitleChecked: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  aiBadge: { backgroundColor: `${Colors.blue}20`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.blue },
  itemDetail: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  askAiBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: `${Colors.blue}40`, borderStyle: 'dashed',
    marginTop: 4,
  },
  askAiBtnText: { color: Colors.blue, fontSize: 14, fontWeight: '500' },
});

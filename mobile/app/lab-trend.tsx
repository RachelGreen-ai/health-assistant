import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { getLabTrends, streamChat, type LabObservation } from '@/services/api';
import { useWatchList } from '@/hooks/useWatchList';
import { useLanguage } from '@/hooks/useLanguage';

const PRESETS = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '5Y', months: 60 },
] as const;

function offsetDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

const CHART_W = 340;
const CHART_H = 180;
const PAD = { top: 20, right: 16, bottom: 36, left: 44 };


function TrendChart({ data, unit }: { data: LabObservation[]; unit: string }) {
  if (data.length < 2) {
    return (
      <View style={chart.empty}>
        <Text style={chart.emptyText}>Not enough data points to draw a trend</Text>
      </View>
    );
  }

  const vals = data.map(d => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const rangeV = maxV - minV || 1;

  const w = CHART_W - PAD.left - PAD.right;
  const h = CHART_H - PAD.top - PAD.bottom;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * w;
  const yOf = (v: number) => PAD.top + h - ((v - minV) / rangeV) * h;

  const points = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');

  const yTicks = [minV, minV + rangeV / 2, maxV];

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Y-axis gridlines + labels */}
      {yTicks.map((v, i) => (
        <React.Fragment key={i}>
          <Line
            x1={PAD.left} y1={yOf(v)} x2={CHART_W - PAD.right} y2={yOf(v)}
            stroke={Colors.separator} strokeWidth={0.5} strokeDasharray="4,4"
          />
          <SvgText
            x={PAD.left - 4} y={yOf(v) + 4}
            textAnchor="end" fontSize={10} fill={Colors.textTertiary}
          >
            {v.toFixed(1)}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Line */}
      <Polyline points={points} fill="none" stroke={Colors.blue} strokeWidth={2} strokeLinejoin="round" />

      {/* Dots + X labels */}
      {data.map((d, i) => (
        <React.Fragment key={i}>
          <Circle cx={xOf(i)} cy={yOf(d.value)} r={4} fill={Colors.blue} />
          {(i === 0 || i === data.length - 1 || data.length <= 6) && (
            <SvgText
              x={xOf(i)} y={CHART_H - 4}
              textAnchor="middle" fontSize={9} fill={Colors.textTertiary}
            >
              {d.date.slice(5)} {/* MM-DD */}
            </SvgText>
          )}
        </React.Fragment>
      ))}

      {/* Unit label */}
      <SvgText x={PAD.left + w / 2} y={CHART_H - 4} textAnchor="middle" fontSize={9} fill={Colors.textSecondary}>
        {unit}
      </SvgText>
    </Svg>
  );
}

export default function LabTrendScreen() {
  const { name, value, ref, status, unit } = useLocalSearchParams<{
    name: string; value: string; ref: string; status: string; unit?: string;
  }>();

  const today = new Date().toISOString().slice(0, 10);
  const [activePreset, setActivePreset] = useState<number>(12);
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState(offsetDate(12));
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<LabObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const { isWatching, toggle } = useWatchList();
  const { language } = useLanguage();
  const watching = isWatching(name);

  const STATUS_COLOR: Record<string, string> = {
    high: Colors.red, low: Colors.orange, borderline: Colors.orange, normal: Colors.green,
  };

  const runAnalysis = useCallback((obs: LabObservation[]) => {
    if (obs.length < 2) return;
    setAnalysis('');
    setAnalysisLoading(true);
    const summary = obs.map(o => `${o.date}: ${o.value} ${o.unit}`).join(', ');
    const prompt = `You are a compassionate health assistant. Here is the patient's ${name} trend data: ${summary}. In exactly one warm paragraph (3–4 sentences), analyze this trend. If improving, celebrate the progress with genuine encouragement. If stable or worsening, acknowledge with empathy and gently encourage them to keep working with their care team. Speak directly to the patient using "you". Do not use bullet points or headers.`;
    streamChat(
      prompt,
      `analysis-${name}-${Date.now()}`,
      language,
      chunk => setAnalysis(prev => prev + chunk),
      () => setAnalysisLoading(false),
      () => setAnalysisLoading(false),
    );
  }, [name, language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalysis('');
    try {
      const result = await getLabTrends(name, startDate, endDate);
      if (result.error) { setError(result.error); return; }
      if (result.observations?.length) {
        const sorted = result.observations.sort((a, b) => a.date.localeCompare(b.date));
        setData(sorted);
        if (watching) runAnalysis(sorted);
      } else {
        setError('No observations found for this date range');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  }, [name, startDate, endDate, watching, runAnalysis]);

  useEffect(() => { load(); }, []);

  const unitStr = data[0]?.unit ?? unit ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText} numberOfLines={1}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity style={styles.starBtn} onPress={() => {
          toggle(name);
          if (!watching && data.length >= 2) runAnalysis(data);
        }}>
          <Text style={[styles.starBtnText, watching && styles.starBtnActive]}>
            {watching ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current value card */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>Latest</Text>
          <Text style={[styles.currentValue, { color: STATUS_COLOR[status] ?? Colors.textPrimary }]}>
            {value}
          </Text>
          <Text style={styles.currentRef}>Ref: {ref}</Text>
        </View>

        {/* Preset chips */}
        <View style={styles.chipRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={[styles.chip, activePreset === p.months && styles.chipActive]}
              onPress={() => {
                setActivePreset(p.months);
                setShowCustom(false);
                setStartDate(offsetDate(p.months));
                setEndDate(today);
                setTimeout(load, 0);
              }}
            >
              <Text style={[styles.chipText, activePreset === p.months && styles.chipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, showCustom && styles.chipActive]}
            onPress={() => { setShowCustom(v => !v); setActivePreset(-1); }}
          >
            <Text style={[styles.chipText, showCustom && styles.chipTextActive]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Custom date inputs — only shown when Custom chip active */}
        {showCustom && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.dateInput} value={startDate} onChangeText={setStartDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.dateSep}>→</Text>
            <TextInput
              style={styles.dateInput} value={endDate} onChangeText={setEndDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary}
            />
            <TouchableOpacity style={styles.goBtn} onPress={load} disabled={loading}>
              <Text style={styles.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartCard}>
          {loading ? (
            <ActivityIndicator color={Colors.blue} style={{ padding: 40 }} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <TrendChart data={data} unit={unitStr} />
          )}
        </View>

        {/* Data table */}
        {!loading && data.length > 0 && (
          <View style={styles.tableCard}>
            <Text style={styles.tableHeader}>All Results</Text>
            {[...data].reverse().map((obs, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableDate}>{obs.date}</Text>
                <Text style={styles.tableVal}>{obs.value} {obs.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Analysis — only for watch list items */}
        {(analysis || analysisLoading) && (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisBadge}>✦ AI Analysis</Text>
              {analysisLoading && <ActivityIndicator size="small" color={Colors.blue} />}
            </View>
            <Text style={styles.analysisText}>{analysis}</Text>
            {!watching && !analysisLoading && (
              <TouchableOpacity onPress={() => { toggle(name); }}>
                <Text style={styles.watchPrompt}>★ Add to Watch List to see analysis automatically</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Prompt to watch if not yet watching and data is loaded */}
        {!loading && !analysisLoading && !analysis && data.length >= 2 && !watching && (
          <TouchableOpacity style={styles.watchCard} onPress={() => { toggle(name); runAnalysis(data); }}>
            <Text style={styles.watchCardText}>☆ Add to Watch List for AI trend analysis</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const chart = StyleSheet.create({
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  back: { width: 70, justifyContent: 'center' },
  backText: { color: Colors.blue, fontSize: 17, flexShrink: 0 },
  starBtn: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
  starBtnText: { fontSize: 22, color: Colors.textTertiary },
  starBtnActive: { color: Colors.orange },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  content: { padding: 16, paddingBottom: 48 },
  currentCard: {
    backgroundColor: Colors.bgGrouped, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  currentLabel: { fontSize: 12, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  currentValue: { fontSize: 36, fontWeight: '700', marginBottom: 4 },
  currentRef: { fontSize: 12, color: Colors.textSecondary },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.bgGrouped,
  },
  chipActive: { backgroundColor: Colors.blue },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dateSep: { color: Colors.textTertiary, fontSize: 14 },
  dateInput: {
    flex: 1, backgroundColor: Colors.bgGrouped, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, color: Colors.textPrimary, fontSize: 13,
  },
  goBtn: {
    backgroundColor: Colors.blue, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  goBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chartCard: {
    backgroundColor: Colors.bgGrouped, borderRadius: 16, padding: 12,
    alignItems: 'center', marginBottom: 16, minHeight: 80,
  },
  errorText: { color: Colors.red, fontSize: 13, padding: 20, textAlign: 'center' },
  tableCard: { backgroundColor: Colors.bgGrouped, borderRadius: 16, padding: 16 },
  tableHeader: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  tableDate: { fontSize: 14, color: Colors.textSecondary },
  tableVal: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  analysisCard: {
    backgroundColor: `${Colors.blue}12`, borderRadius: 16,
    padding: 16, marginTop: 12, borderWidth: 0.5, borderColor: `${Colors.blue}30`,
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  analysisBadge: { fontSize: 13, fontWeight: '600', color: Colors.blue },
  analysisText: { fontSize: 15, lineHeight: 24, color: Colors.textPrimary },
  watchPrompt: { color: Colors.blue, fontSize: 12, marginTop: 10 },
  watchCard: {
    backgroundColor: Colors.bgGrouped, borderRadius: 12, padding: 14,
    marginTop: 12, alignItems: 'center',
  },
  watchCardText: { color: Colors.textSecondary, fontSize: 14 },
});

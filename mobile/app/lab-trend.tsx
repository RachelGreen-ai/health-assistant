import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Rect, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { getLabTrends, streamChat, type LabObservation } from '@/services/api';
import { useWatchList } from '@/hooks/useWatchList';
import { useLanguage } from '@/hooks/useLanguage';

// ─── Mock Trend Data ──────────────────────────────────────────────────────────
// Fallback when the backend / Epic sandbox returns no observations.
// Realistic multi-year histories consistent with the patient profile.

// ─── BMT Patient Timeline ─────────────────────────────────────────────────────
// Sophia Chen · DLBCL → MUD Allo-SCT · Day 0: Dec 19, 2025
// Key dates:
//   Oct 2023       — DLBCL diagnosis
//   Nov 2023–Apr 2024 — R-CHOP ×6 (with rituximab)
//   Sep 2024       — Relapse (PET+)
//   Oct–Dec 2024   — R-ICE ×3 salvage
//   Dec 10–18 2025 — TBI/Cy conditioning
//   Dec 19, 2025   — Day 0 (MUD allo-SCT)
//   Jan 2, 2026    — Day +14 (engraftment confirmed, ANC >0.5)
//   Jan 18, 2026   — Day +30
//   Feb 17, 2026   — Day +60
//   Mar 19, 2026   — Day +90

const MOCK_TRENDS: Record<string, LabObservation[]> = {
  // ── CBC — WBC ─────────────────────────────────────────────────────────────
  'WBC': [
    { date: '2021-06-10', value: 6.2,  unit: 'K/µL' },  // healthy baseline
    { date: '2022-04-15', value: 5.8,  unit: 'K/µL' },
    { date: '2023-07-20', value: 6.4,  unit: 'K/µL' },
    { date: '2023-10-15', value: 12.4, unit: 'K/µL' },  // DLBCL diagnosis
    { date: '2023-11-18', value: 1.2,  unit: 'K/µL' },  // R-CHOP cycle 1 nadir
    { date: '2024-01-05', value: 5.4,  unit: 'K/µL' },  // recovery between cycles
    { date: '2024-02-20', value: 0.8,  unit: 'K/µL' },  // cycle 3 nadir
    { date: '2024-04-15', value: 6.2,  unit: 'K/µL' },  // complete response
    { date: '2024-09-10', value: 11.8, unit: 'K/µL' },  // relapse
    { date: '2024-10-18', value: 0.4,  unit: 'K/µL' },  // R-ICE nadir
    { date: '2024-12-05', value: 2.8,  unit: 'K/µL' },  // R-ICE recovery
    { date: '2025-11-10', value: 5.2,  unit: 'K/µL' },  // pre-transplant workup
    { date: '2025-12-15', value: 0.1,  unit: 'K/µL' },  // conditioning nadir
    { date: '2026-01-02', value: 2.8,  unit: 'K/µL' },  // Day +14, engraftment
    { date: '2026-01-09', value: 4.4,  unit: 'K/µL' },  // Day +21
    { date: '2026-01-18', value: 4.8,  unit: 'K/µL' },  // Day +30
    { date: '2026-02-17', value: 5.2,  unit: 'K/µL' },  // Day +60
    { date: '2026-03-19', value: 3.8,  unit: 'K/µL' },  // Day +90 (declining, tacro)
  ],
  // ── CBC — Hemoglobin ──────────────────────────────────────────────────────
  'Hemoglobin': [
    { date: '2021-06-10', value: 13.4, unit: 'g/dL' },
    { date: '2022-04-15', value: 13.6, unit: 'g/dL' },
    { date: '2023-07-20', value: 13.2, unit: 'g/dL' },
    { date: '2023-10-15', value: 11.2, unit: 'g/dL' },  // diagnosis (anemia of chronic disease)
    { date: '2023-11-18', value: 8.4,  unit: 'g/dL' },  // R-CHOP nadir (transfused)
    { date: '2024-01-05', value: 11.8, unit: 'g/dL' },  // recovery
    { date: '2024-04-15', value: 12.4, unit: 'g/dL' },  // complete response
    { date: '2024-09-10', value: 10.6, unit: 'g/dL' },  // relapse
    { date: '2024-10-18', value: 7.8,  unit: 'g/dL' },  // R-ICE nadir (transfused)
    { date: '2024-12-05', value: 9.8,  unit: 'g/dL' },
    { date: '2025-11-10', value: 10.2, unit: 'g/dL' },  // pre-transplant
    { date: '2025-12-15', value: 7.4,  unit: 'g/dL' },  // conditioning nadir (transfused)
    { date: '2026-01-02', value: 8.2,  unit: 'g/dL' },  // Day +14
    { date: '2026-01-18', value: 8.8,  unit: 'g/dL' },  // Day +30
    { date: '2026-02-17', value: 9.1,  unit: 'g/dL' },  // Day +60
    { date: '2026-03-19', value: 9.4,  unit: 'g/dL' },  // Day +90
  ],
  // ── CBC — Hematocrit ──────────────────────────────────────────────────────
  'Hematocrit': [
    { date: '2021-06-10', value: 40.2, unit: '%' },
    { date: '2023-10-15', value: 33.8, unit: '%' },
    { date: '2023-11-18', value: 25.4, unit: '%' },
    { date: '2024-04-15', value: 37.2, unit: '%' },
    { date: '2024-09-10', value: 32.0, unit: '%' },
    { date: '2025-12-15', value: 22.2, unit: '%' },
    { date: '2026-01-18', value: 26.4, unit: '%' },
    { date: '2026-02-17', value: 27.4, unit: '%' },
    { date: '2026-03-19', value: 28.5, unit: '%' },
  ],
  // ── CBC — Platelets ───────────────────────────────────────────────────────
  'Platelets': [
    { date: '2021-06-10', value: 245, unit: 'K/µL' },
    { date: '2022-04-15', value: 238, unit: 'K/µL' },
    { date: '2023-10-15', value: 188, unit: 'K/µL' },  // diagnosis (marrow infiltration)
    { date: '2023-11-18', value: 22,  unit: 'K/µL' },  // R-CHOP nadir (transfused)
    { date: '2024-01-05', value: 195, unit: 'K/µL' },  // recovery
    { date: '2024-04-15', value: 210, unit: 'K/µL' },  // complete response
    { date: '2024-09-10', value: 142, unit: 'K/µL' },  // relapse
    { date: '2024-10-18', value: 8,   unit: 'K/µL' },  // R-ICE nadir (transfused heavily)
    { date: '2024-12-05', value: 112, unit: 'K/µL' },
    { date: '2025-11-10', value: 128, unit: 'K/µL' },  // pre-transplant
    { date: '2025-12-15', value: 4,   unit: 'K/µL' },  // conditioning nadir
    { date: '2026-01-02', value: 28,  unit: 'K/µL' },  // Day +14 (engrafting)
    { date: '2026-01-09', value: 45,  unit: 'K/µL' },  // Day +21
    { date: '2026-01-18', value: 58,  unit: 'K/µL' },  // Day +30
    { date: '2026-02-17', value: 72,  unit: 'K/µL' },  // Day +60
    { date: '2026-03-19', value: 88,  unit: 'K/µL' },  // Day +90
  ],
  // ── Kidney — Creatinine ───────────────────────────────────────────────────
  'Creatinine': [
    { date: '2021-06-10', value: 0.72, unit: 'mg/dL' },
    { date: '2022-04-15', value: 0.74, unit: 'mg/dL' },
    { date: '2023-10-15', value: 0.76, unit: 'mg/dL' },
    { date: '2024-04-15', value: 0.78, unit: 'mg/dL' },  // during R-CHOP (mild hydration effect)
    { date: '2024-12-05', value: 0.74, unit: 'mg/dL' },
    { date: '2025-11-10', value: 0.72, unit: 'mg/dL' },  // pre-transplant baseline
    { date: '2026-01-02', value: 0.92, unit: 'mg/dL' },  // Day +14 (tacrolimus started)
    { date: '2026-01-18', value: 1.05, unit: 'mg/dL' },  // Day +30
    { date: '2026-02-17', value: 1.12, unit: 'mg/dL' },  // Day +60
    { date: '2026-03-19', value: 1.18, unit: 'mg/dL' },  // Day +90
  ],
  // ── Kidney — eGFR ────────────────────────────────────────────────────────
  'eGFR': [
    { date: '2021-06-10', value: 95,  unit: 'mL/min' },
    { date: '2022-04-15', value: 92,  unit: 'mL/min' },
    { date: '2024-04-15', value: 88,  unit: 'mL/min' },
    { date: '2025-11-10', value: 92,  unit: 'mL/min' },  // pre-transplant
    { date: '2026-01-02', value: 75,  unit: 'mL/min' },  // Day +14
    { date: '2026-01-18', value: 68,  unit: 'mL/min' },  // Day +30
    { date: '2026-02-17', value: 62,  unit: 'mL/min' },  // Day +60
    { date: '2026-03-19', value: 58,  unit: 'mL/min' },  // Day +90
  ],
  // ── Electrolytes — Magnesium ──────────────────────────────────────────────
  'Magnesium': [
    { date: '2025-11-10', value: 1.9,  unit: 'mEq/L' },  // pre-transplant baseline
    { date: '2026-01-02', value: 1.7,  unit: 'mEq/L' },  // Day +14 (tacrolimus started)
    { date: '2026-01-18', value: 1.5,  unit: 'mEq/L' },  // Day +30 (wasting begins)
    { date: '2026-02-02', value: 1.4,  unit: 'mEq/L' },  // Day +45 (MgO dose increased)
    { date: '2026-02-17', value: 1.4,  unit: 'mEq/L' },  // Day +60
    { date: '2026-03-04', value: 1.4,  unit: 'mEq/L' },  // Day +75
    { date: '2026-03-19', value: 1.4,  unit: 'mEq/L' },  // Day +90 (persistent despite oral supp)
  ],
  // ── Immunosuppression — Tacrolimus ────────────────────────────────────────
  'Tacrolimus': [
    { date: '2025-12-26', value: 9.8,  unit: 'ng/mL' },  // Day +7
    { date: '2026-01-02', value: 11.2, unit: 'ng/mL' },  // Day +14
    { date: '2026-01-09', value: 10.5, unit: 'ng/mL' },  // Day +21
    { date: '2026-01-18', value: 9.8,  unit: 'ng/mL' },  // Day +30
    { date: '2026-02-02', value: 8.8,  unit: 'ng/mL' },  // Day +45
    { date: '2026-02-17', value: 9.2,  unit: 'ng/mL' },  // Day +60
    { date: '2026-03-04', value: 7.8,  unit: 'ng/mL' },  // Day +75
    { date: '2026-03-19', value: 8.2,  unit: 'ng/mL' },  // Day +90
  ],
  // ── Infection — CMV PCR ───────────────────────────────────────────────────
  // 137 IU/mL = assay lower limit of quantification (not detected)
  'CMV PCR': [
    { date: '2026-01-18', value: 137, unit: 'IU/mL' },  // Day +30, undetectable (letermovir)
    { date: '2026-02-02', value: 137, unit: 'IU/mL' },  // Day +45
    { date: '2026-02-17', value: 142, unit: 'IU/mL' },  // Day +60, low-level detectable
    { date: '2026-03-04', value: 215, unit: 'IU/mL' },  // Day +75, rising
    { date: '2026-03-19', value: 285, unit: 'IU/mL' },  // Day +90, action threshold
  ],
  // ── Iron — Ferritin ───────────────────────────────────────────────────────
  // Elevated due to transfusional iron overload (multiple pRBC during chemo + conditioning)
  'Ferritin': [
    { date: '2021-06-10', value: 185,  unit: 'ng/mL' },  // baseline
    { date: '2023-10-15', value: 420,  unit: 'ng/mL' },  // diagnosis
    { date: '2024-04-15', value: 820,  unit: 'ng/mL' },  // post R-CHOP (transfusions)
    { date: '2024-12-05', value: 1240, unit: 'ng/mL' },  // post R-ICE
    { date: '2025-11-10', value: 2180, unit: 'ng/mL' },  // pre-transplant
    { date: '2026-01-02', value: 3450, unit: 'ng/mL' },  // Day +14 (conditioning + transfusions)
    { date: '2026-01-18', value: 3680, unit: 'ng/mL' },  // Day +30
    { date: '2026-02-17', value: 4200, unit: 'ng/mL' },  // Day +60
    { date: '2026-03-19', value: 4820, unit: 'ng/mL' },  // Day +90
  ],
  // ── Liver — ALT ───────────────────────────────────────────────────────────
  'ALT': [
    { date: '2021-06-10', value: 22,  unit: 'U/L' },
    { date: '2023-10-15', value: 28,  unit: 'U/L' },
    { date: '2024-02-20', value: 38,  unit: 'U/L' },  // R-CHOP hepatotoxicity
    { date: '2024-04-15', value: 24,  unit: 'U/L' },  // recovery
    { date: '2024-10-18', value: 42,  unit: 'U/L' },  // R-ICE hepatotoxicity
    { date: '2024-12-05', value: 24,  unit: 'U/L' },
    { date: '2025-11-10', value: 22,  unit: 'U/L' },  // pre-transplant
    { date: '2026-01-02', value: 38,  unit: 'U/L' },  // Day +14 (tacrolimus + vori)
    { date: '2026-01-18', value: 52,  unit: 'U/L' },  // Day +30
    { date: '2026-02-17', value: 61,  unit: 'U/L' },  // Day +60
    { date: '2026-03-19', value: 68,  unit: 'U/L' },  // Day +90 (GvHD vs. drug effect)
  ],
  // ── Liver — AST ───────────────────────────────────────────────────────────
  'AST': [
    { date: '2021-06-10', value: 18,  unit: 'U/L' },
    { date: '2023-10-15', value: 24,  unit: 'U/L' },
    { date: '2024-02-20', value: 34,  unit: 'U/L' },
    { date: '2024-04-15', value: 20,  unit: 'U/L' },
    { date: '2024-10-18', value: 36,  unit: 'U/L' },
    { date: '2025-11-10', value: 18,  unit: 'U/L' },
    { date: '2026-01-02', value: 28,  unit: 'U/L' },  // Day +14
    { date: '2026-01-18', value: 38,  unit: 'U/L' },  // Day +30
    { date: '2026-02-17', value: 44,  unit: 'U/L' },  // Day +60
    { date: '2026-03-19', value: 52,  unit: 'U/L' },  // Day +90
  ],
  // ── Liver — Total Bilirubin ───────────────────────────────────────────────
  'Total Bilirubin': [
    { date: '2021-06-10', value: 0.6, unit: 'mg/dL' },
    { date: '2023-10-15', value: 0.9, unit: 'mg/dL' },
    { date: '2024-02-20', value: 1.1, unit: 'mg/dL' },
    { date: '2024-04-15', value: 0.8, unit: 'mg/dL' },
    { date: '2025-11-10', value: 0.7, unit: 'mg/dL' },
    { date: '2026-01-02', value: 1.0, unit: 'mg/dL' },  // Day +14
    { date: '2026-01-18', value: 1.3, unit: 'mg/dL' },  // Day +30
    { date: '2026-02-17', value: 1.6, unit: 'mg/dL' },  // Day +60
    { date: '2026-03-19', value: 1.9, unit: 'mg/dL' },  // Day +90
  ],
  // ── Immunoglobulin — IgG ──────────────────────────────────────────────────
  // Depleted by rituximab (anti-CD20) and lymphodepletion conditioning
  'IgG': [
    { date: '2021-06-10', value: 1240, unit: 'mg/dL' },  // baseline
    { date: '2023-10-15', value: 980,  unit: 'mg/dL' },  // pre-treatment
    { date: '2024-04-15', value: 580,  unit: 'mg/dL' },  // post R-CHOP (rituximab B-cell depletion)
    { date: '2024-09-10', value: 460,  unit: 'mg/dL' },  // relapse
    { date: '2025-11-10', value: 520,  unit: 'mg/dL' },  // pre-transplant
    { date: '2026-01-18', value: 420,  unit: 'mg/dL' },  // Day +30 (post-conditioning)
    { date: '2026-03-05', value: 418,  unit: 'mg/dL' },  // pre-IVIG (Mar 5, 2026)
    { date: '2026-03-19', value: 418,  unit: 'mg/dL' },  // Day +90 (2 wks post-IVIG)
  ],
  // ── Engraftment — Donor Chimerism (whole blood) ───────────────────────────
  'Donor Chimerism': [
    { date: '2026-01-02', value: 82,  unit: '%' },  // Day +14 (early engraftment)
    { date: '2026-01-18', value: 91,  unit: '%' },  // Day +30
    { date: '2026-02-17', value: 97,  unit: '%' },  // Day +60 (confirmed)
  ],
  // ── Engraftment — T-cell Chimerism ────────────────────────────────────────
  'T-cell Chimerism': [
    { date: '2026-01-18', value: 72,  unit: '%' },  // Day +30 (T-cells engraft slower)
    { date: '2026-02-17', value: 89,  unit: '%' },  // Day +60 (borderline, target >95%)
  ],
  // ── Electrolytes — Potassium ──────────────────────────────────────────────
  'Potassium': [
    { date: '2025-11-10', value: 4.0,  unit: 'mEq/L' },
    { date: '2026-01-18', value: 3.6,  unit: 'mEq/L' },  // Day +30
    { date: '2026-02-17', value: 3.5,  unit: 'mEq/L' },  // Day +60
    { date: '2026-03-19', value: 3.4,  unit: 'mEq/L' },  // Day +90 (tacrolimus wasting)
  ],
  // ── Kidney — BUN ─────────────────────────────────────────────────────────
  'BUN': [
    { date: '2025-11-10', value: 14,  unit: 'mg/dL' },
    { date: '2026-01-18', value: 18,  unit: 'mg/dL' },
    { date: '2026-02-17', value: 20,  unit: 'mg/dL' },
    { date: '2026-03-19', value: 22,  unit: 'mg/dL' },
  ],
  // ── Thyroid — TSH (TBI effect on thyroid) ─────────────────────────────────
  'TSH': [
    { date: '2021-06-10', value: 2.1,  unit: 'mIU/L' },
    { date: '2023-07-20', value: 2.3,  unit: 'mIU/L' },
    { date: '2025-11-10', value: 2.0,  unit: 'mIU/L' },  // pre-transplant
    { date: '2026-03-19', value: 3.2,  unit: 'mIU/L' },  // Day +90 (TBI thyroid effect)
  ],
};

function getMockTrend(labName: string, startDate: string, endDate: string): LabObservation[] {
  return (MOCK_TRENDS[labName] ?? [])
    .filter(o => o.date >= startDate && o.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

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

// Chart dimensions — responsive to screen width
const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 56; // 16*2 content padding + 12*2 card padding
const CHART_H = 220;
const PAD = { top: 28, right: 16, bottom: 52, left: 52 };

// ── Chart helpers ─────────────────────────────────────────────────────────────

function parseRefBounds(refStr: string): { low?: number; high?: number } {
  const nums = (refStr.match(/\d+\.?\d*/g) ?? []).map(Number);
  if (refStr.trimStart().startsWith('<')) return { high: nums[0] };
  if (refStr.trimStart().startsWith('>')) return { low: nums[0] };
  if (nums.length >= 2) return { low: nums[0], high: nums[1] };
  return {};
}

function niceYTicks(minV: number, maxV: number, target = 4): number[] {
  const span = maxV - minV || 1;
  const rough = span / (target - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  let step = mag;
  for (const f of [1, 2, 2.5, 5, 10]) {
    step = f * mag;
    if (step >= rough * 0.8) break;
  }
  const lo = Math.floor(minV / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t < maxV + step * 1.01 && ticks.length <= target + 2; t += step) {
    ticks.push(Math.round(t * 1e6) / 1e6);
  }
  return ticks;
}

function fmtTick(v: number): string {
  const a = Math.abs(v);
  if (a >= 100) return Math.round(v).toString();
  if (a >= 1)   return v.toFixed(1);
  return v.toFixed(2);
}

function buildPaths(
  pts: Array<{ x: number; y: number }>,
  bottomY: number,
): { line: string; area: string } {
  if (pts.length < 2) return { line: '', area: '' };
  const tension = 0.35; // Catmull-Rom tension
  const ext = [pts[0], ...pts, pts[pts.length - 1]];
  let line = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = ext[i], p1 = ext[i + 1], p2 = ext[i + 2], p3 = ext[i + 3];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    line += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const lastX = pts[pts.length - 1].x.toFixed(1);
  const firstX = pts[0].x.toFixed(1);
  return {
    line,
    area: line + ` L ${lastX},${bottomY} L ${firstX},${bottomY} Z`,
  };
}

function pickXLabels(
  data: LabObservation[],
  xOf: (i: number) => number,
): Array<{ x: number; label: string }> {
  if (data.length === 0) return [];
  const t0 = new Date(data[0].date + 'T12:00').getTime();
  const t1 = new Date(data[data.length - 1].date + 'T12:00').getTime();
  const spanDays = (t1 - t0) / 86400000;

  const fmtDate = (s: string): string => {
    const d = new Date(s + 'T12:00');
    const mon = d.toLocaleDateString('en-US', { month: 'short' });
    return spanDays > 365
      ? `${mon} '${String(d.getFullYear()).slice(2)}`
      : `${mon} ${d.getDate()}`;
  };

  // Multi-year: one label per calendar year (first point of that year)
  if (spanDays > 365 * 1.1) {
    const seen = new Set<number>();
    const result: Array<{ x: number; label: string }> = [];
    data.forEach((obs, i) => {
      const yr = new Date(obs.date + 'T12:00').getFullYear();
      if (!seen.has(yr)) {
        seen.add(yr);
        result.push({ x: xOf(i), label: `'${String(yr).slice(2)}` });
      }
    });
    return result;
  }

  // ≤5 points: show all
  if (data.length <= 5) {
    return data.map((obs, i) => ({ x: xOf(i), label: fmtDate(obs.date) }));
  }

  // Up to 5 evenly-spaced, always including first + last
  const MAX = 5;
  const chosen = new Set<number>([0, data.length - 1]);
  const step = Math.round((data.length - 1) / (MAX - 1));
  for (let j = step; j < data.length - 1 && chosen.size < MAX; j += step) {
    chosen.add(j);
  }
  return [...chosen].sort((a, b) => a - b).map(i => ({
    x: xOf(i), label: fmtDate(data[i].date),
  }));
}

// ── TrendChart component ──────────────────────────────────────────────────────

function TrendChart({
  data, unit, refStr,
}: { data: LabObservation[]; unit: string; refStr: string }) {
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

  const ticks = niceYTicks(minV, maxV);
  const yAxisMin = ticks[0];
  const yAxisMax = ticks[ticks.length - 1];
  const yRange   = yAxisMax - yAxisMin || 1;

  const pw = CHART_W - PAD.left - PAD.right;  // plot width
  const ph = CHART_H - PAD.top  - PAD.bottom; // plot height
  const plotBottom = PAD.top + ph;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * pw;
  const yOf = (v: number) => PAD.top + ph - ((v - yAxisMin) / yRange) * ph;

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value) }));
  const { line: linePath, area: areaPath } = buildPaths(pts, plotBottom);

  // Reference range band
  const ref = parseRefBounds(refStr);
  const bandHigh = ref.high !== undefined ? Math.max(yAxisMin, Math.min(yAxisMax, ref.high)) : yAxisMax;
  const bandLow  = ref.low  !== undefined ? Math.max(yAxisMin, Math.min(yAxisMax, ref.low))  : yAxisMin;
  const showBand = bandHigh > bandLow;

  const xLabels = pickXLabels(data, xOf);

  return (
    <View>
      <Text style={chart.unitLabel}>{unit}</Text>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={Colors.blue} stopOpacity="0.20" />
            <Stop offset="1"   stopColor={Colors.blue} stopOpacity="0.00" />
          </LinearGradient>
        </Defs>

        {/* Normal reference range band */}
        {showBand && (
          <Rect
            x={PAD.left} y={yOf(bandHigh)}
            width={pw}    height={yOf(bandLow) - yOf(bandHigh)}
            fill={Colors.green} fillOpacity={0.07}
          />
        )}

        {/* Y-axis dashed gridlines + labels */}
        {ticks.map((v, i) => (
          <React.Fragment key={i}>
            <Line
              x1={PAD.left} y1={yOf(v)} x2={CHART_W - PAD.right} y2={yOf(v)}
              stroke={Colors.separator} strokeWidth={0.5} strokeDasharray="4,3"
            />
            <SvgText
              x={PAD.left - 6} y={yOf(v) + 4}
              textAnchor="end" fontSize={10} fill={Colors.textTertiary}
            >
              {fmtTick(v)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Axis borders */}
        <Line x1={PAD.left} y1={PAD.top}    x2={PAD.left}            y2={plotBottom} stroke={Colors.separator} strokeWidth={0.5} />
        <Line x1={PAD.left} y1={plotBottom} x2={CHART_W - PAD.right} y2={plotBottom} stroke={Colors.separator} strokeWidth={0.5} />

        {/* Gradient area fill */}
        <Path d={areaPath} fill="url(#lineGrad)" />

        {/* Trend line — smooth Catmull-Rom bezier */}
        <Path d={linePath} fill="none" stroke={Colors.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data dots */}
        {pts.map((p, i) => {
          const isLast = i === pts.length - 1;
          return (
            <React.Fragment key={i}>
              {isLast && <Circle cx={p.x} cy={p.y} r={9} fill={Colors.blue} fillOpacity={0.12} />}
              <Circle cx={p.x} cy={p.y} r={isLast ? 4.5 : 3} fill={Colors.blue} />
            </React.Fragment>
          );
        })}

        {/* X-axis labels — below the axis line, never overlapping */}
        {xLabels.map((l, i) => (
          <SvgText
            key={i} x={l.x} y={plotBottom + 18}
            textAnchor="middle" fontSize={10} fill={Colors.textTertiary}
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
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
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
    const prompt = `You are a concise health assistant. Here is the patient's ${name} trend data: ${summary}. In exactly 1–2 sentences, tell them whether this trend is improving, stable, or worsening, and one key takeaway. Be warm but brief. Speak directly using "you". No bullet points.`;
    streamChat(
      prompt,
      `analysis-${name}-${Date.now()}`,
      language,
      chunk => setAnalysis(prev => prev + chunk),
      () => setAnalysisLoading(false),
      () => setAnalysisLoading(false),
    );
  }, [name, language]);

  // Pass dates explicitly to avoid stale-closure bugs when preset chips update state
  const load = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    setAnalysis('');
    try {
      const result = await getLabTrends(name, start, end);
      if (result.error) { setError(result.error); return; }
      const observations = result.observations?.length
        ? result.observations
        : getMockTrend(name, start, end);
      if (observations.length) {
        const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date));
        setData(sorted);
        setVisibleCount(PAGE_SIZE);
      } else {
        setError('No observations found for this date range');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  }, [name, runAnalysis]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(startDate, endDate); }, []);

  const unitStr = data[0]?.unit ?? unit ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={Colors.blue} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity style={styles.starBtn} onPress={() => {
          toggle(name);
        }}>
          <Ionicons
            name={watching ? 'star' : 'star-outline'}
            size={22}
            color={watching ? Colors.orange : Colors.textTertiary}
          />
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
                const s = offsetDate(p.months);
                setActivePreset(p.months);
                setShowCustom(false);
                setStartDate(s);
                setEndDate(today);
                load(s, today); // pass fresh dates directly — no stale closure
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
            <Ionicons name="arrow-forward" size={14} color={Colors.textTertiary} />
            <TextInput
              style={styles.dateInput} value={endDate} onChangeText={setEndDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary}
            />
            <TouchableOpacity style={styles.goBtn} onPress={() => load(startDate, endDate)} disabled={loading}>
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
            <TrendChart data={data} unit={unitStr} refStr={ref ?? ''} />
          )}
        </View>

        {/* Data table */}
        {!loading && data.length > 0 && (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableHeader}>Results</Text>
              <Text style={styles.tableCount}>
                {Math.min(visibleCount, data.length)} of {data.length}
              </Text>
            </View>
            {[...data].reverse().slice(0, visibleCount).map((obs, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableDate}>{obs.date}</Text>
                <Text style={styles.tableVal}>{obs.value} {obs.unit}</Text>
              </View>
            ))}
            {visibleCount < data.length && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleCount(c => c + PAGE_SIZE)}
              >
                <Text style={styles.loadMoreText}>
                  Load More ({data.length - visibleCount} remaining)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* AI Analysis */}
        {!loading && data.length >= 2 && watching && !analysis && !analysisLoading && (
          <TouchableOpacity style={styles.analysisBtn} onPress={() => runAnalysis(data)}>
            <Ionicons name="sparkles" size={14} color={Colors.blue} />
            <Text style={styles.analysisBtnText}>Get AI Analysis</Text>
          </TouchableOpacity>
        )}

        {(analysis || analysisLoading) && (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <View style={styles.analysisBadgeRow}>
                <Ionicons name="sparkles" size={13} color={Colors.blue} />
                <Text style={styles.analysisBadge}>AI Analysis</Text>
              </View>
              {analysisLoading
                ? <ActivityIndicator size="small" color={Colors.blue} />
                : <TouchableOpacity onPress={() => runAnalysis(data)}>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
              }
            </View>
            <Text style={styles.analysisText}>{analysis}</Text>
          </View>
        )}

        {/* Prompt to watch if not yet watching and data is loaded */}
        {!loading && data.length >= 2 && !watching && (
          <TouchableOpacity style={styles.watchCard} onPress={() => toggle(name)}>
            <View style={styles.watchCardInner}>
              <Ionicons name="star-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.watchCardText}>Add to Watch List to enable AI analysis</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const chart = StyleSheet.create({
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  unitLabel: {
    fontSize: 11, color: Colors.textTertiary, textAlign: 'right',
    marginBottom: 2, paddingRight: 4,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.separator,
  },
  back: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: Colors.blue, fontSize: 17 },
  starBtn: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
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
  analysisBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  analysisBadge: { fontSize: 13, fontWeight: '600', color: Colors.blue },
  analysisText: { fontSize: 15, lineHeight: 24, color: Colors.textPrimary },
  watchPromptRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  watchPrompt: { color: Colors.blue, fontSize: 12 },
  watchCard: {
    backgroundColor: Colors.bgGrouped, borderRadius: 12, padding: 14,
    marginTop: 12, alignItems: 'center',
  },
  watchCardInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  watchCardText: { color: Colors.textSecondary, fontSize: 14 },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tableCount: { fontSize: 12, color: Colors.textTertiary },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 12 },
  loadMoreText: { color: Colors.blue, fontSize: 14, fontWeight: '500' },
  analysisBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${Colors.blue}12`, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, marginTop: 12,
    borderWidth: 0.5, borderColor: `${Colors.blue}30`, justifyContent: 'center',
  },
  analysisBtnText: { color: Colors.blue, fontSize: 14, fontWeight: '600' },
  refreshText: { color: Colors.blue, fontSize: 12, fontWeight: '500' },
});

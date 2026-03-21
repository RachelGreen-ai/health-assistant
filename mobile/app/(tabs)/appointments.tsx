import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/constants/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApptStatus = 'upcoming' | 'soon';
type ApptType = 'office' | 'lab' | 'telehealth';

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  sortDate: number;
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
  visitType?: string;
  note?: string;
  visitNote: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const UPCOMING: Record<Language, Appointment[]> = {
  en: [
    {
      id: 'u1', doctor: 'Stanford BMT Lab', specialty: 'Lab Draw',
      date: 'Mar 25, 2026', sortDate: new Date('2026-03-25T07:30').getTime(),
      time: '7:30 AM', status: 'soon', type: 'lab',
      note: 'Day +95 routine labs · CBC, CMP, tacrolimus level, CMV PCR · Fasting required',
    },
    {
      id: 'u2', doctor: 'Dr. Ananya Patel', specialty: 'BMT Clinic',
      date: 'Mar 30, 2026', sortDate: new Date('2026-03-30T10:00').getTime(),
      time: '10:00 AM', status: 'soon', type: 'office',
      note: 'Day +100 comprehensive visit · Bone marrow biopsy scheduled same day',
    },
    {
      id: 'u3', doctor: 'Dr. Lisa Wong', specialty: 'Ophthalmology',
      date: 'Apr 1, 2026', sortDate: new Date('2026-04-01T14:00').getTime(),
      time: '2:00 PM', status: 'upcoming', type: 'office',
      note: 'Day +102 · GvHD ocular screening · Bring medication list',
    },
    {
      id: 'u4', doctor: 'Dr. Marcus Reed', specialty: 'Dermatology',
      date: 'Apr 11, 2026', sortDate: new Date('2026-04-11T11:00').getTime(),
      time: '11:00 AM', status: 'upcoming', type: 'office',
      note: 'Day +112 · Skin GvHD surveillance · Full body skin exam',
    },
    {
      id: 'u5', doctor: 'Stanford BMT Lab', specialty: 'Lab Draw',
      date: 'Apr 19, 2026', sortDate: new Date('2026-04-19T07:30').getTime(),
      time: '7:30 AM', status: 'upcoming', type: 'lab',
      note: 'Day +120 · Chimerism recheck (whole blood + T-cell) · Tacrolimus level',
    },
  ],
  'zh-CN': [
    {
      id: 'u1', doctor: '斯坦福大学骨髓移植实验室', specialty: '抽血化验',
      date: '2026年3月25日', sortDate: new Date('2026-03-25T07:30').getTime(),
      time: '上午 7:30', status: 'soon', type: 'lab',
      note: '移植后第+95天常规化验 · 全血细胞计数、代谢全项、他克莫司浓度、CMV PCR · 需空腹',
    },
    {
      id: 'u2', doctor: '帕特尔医生', specialty: '骨髓移植门诊',
      date: '2026年3月30日', sortDate: new Date('2026-03-30T10:00').getTime(),
      time: '上午 10:00', status: 'soon', type: 'office',
      note: '移植后第+100天综合复诊 · 同日安排骨髓活检',
    },
    {
      id: 'u3', doctor: '王医生', specialty: '眼科',
      date: '2026年4月1日', sortDate: new Date('2026-04-01T14:00').getTime(),
      time: '下午 2:00', status: 'upcoming', type: 'office',
      note: '移植后第+102天 · 移植物抗宿主病眼部筛查 · 请携带药物清单',
    },
    {
      id: 'u4', doctor: '里德医生', specialty: '皮肤科',
      date: '2026年4月11日', sortDate: new Date('2026-04-11T11:00').getTime(),
      time: '上午 11:00', status: 'upcoming', type: 'office',
      note: '移植后第+112天 · 皮肤移植物抗宿主病监测 · 全身皮肤检查',
    },
    {
      id: 'u5', doctor: '斯坦福大学骨髓移植实验室', specialty: '抽血化验',
      date: '2026年4月19日', sortDate: new Date('2026-04-19T07:30').getTime(),
      time: '上午 7:30', status: 'upcoming', type: 'lab',
      note: '移植后第+120天 · 嵌合率复查（全血 + T细胞）· 他克莫司血药浓度',
    },
  ],
};

const PAST: Record<Language, PastAppointment[]> = {
  en: [
    {
      id: 'p1', doctor: 'Stanford BMT Lab', specialty: 'Lab Draw',
      date: 'Mar 19, 2026', sortDate: new Date('2026-03-19T07:30').getTime(),
      time: '7:30 AM', type: 'lab', visitType: 'Lab Draw',
      note: 'Day +90 labs — CBC, CMP, tacrolimus, CMV PCR, ferritin, IgG',
      visitNote: `LAB DRAW — Day +90 — Mar 19, 2026
Ordering Provider: Dr. Ananya Patel, MD | Stanford BMT Program

ORDERS
• CBC with differential
• Comprehensive Metabolic Panel (CMP)
• Magnesium, Phosphorus
• Tacrolimus trough level
• CMV PCR (quantitative)
• Ferritin
• IgG level

RESULTS (reported Mar 19, 2026)
WBC: 3.8 K/µL [L] (ref: 4.5–11.0)
Hemoglobin: 9.4 g/dL [L] (ref: 12.0–16.0)
Hematocrit: 28.5% [L] (ref: 36–46%)
Platelets: 88 K/µL [L] (ref: 150–400)
Creatinine: 1.18 mg/dL [H] (ref: 0.5–1.1)
BUN: 22 mg/dL (normal)
eGFR: 58 mL/min [borderline] (ref: >60)
Magnesium: 1.4 mEq/L [L] (ref: 1.7–2.2)
Potassium: 3.4 mEq/L [L] (ref: 3.5–5.0)
ALT: 68 U/L [H] (ref: 7–40)
AST: 52 U/L [H] (ref: 10–40)
Total Bilirubin: 1.9 mg/dL [H] (ref: 0.2–1.2)
Tacrolimus trough: 8.2 ng/mL (therapeutic; ref: 6–12)
CMV PCR: 285 IU/mL [H] — DETECTABLE (ref: <137)
Ferritin: 4,820 ng/mL [H] (ref: 10–200)
IgG: 418 mg/dL [L] — from Mar 5, 2026 (ref: 700–1,600)

PROVIDER NOTES
CMV viremia increasing — discussed escalation from letermovir prophylaxis to preemptive ganciclovir with ID team. Liver enzymes mildly elevated — monitoring for hepatic GvHD vs. voriconazole effect. Magnesium remains low despite oral supplementation. IVIG due within 2 weeks given IgG <500.`,
    },
    {
      id: 'p2', doctor: 'Dr. Ananya Patel', specialty: 'BMT Clinic',
      date: 'Feb 17, 2026', sortDate: new Date('2026-02-17T10:00').getTime(),
      time: '10:00 AM', type: 'office', visitType: 'BMT Follow-Up',
      note: 'Day +60 visit · Chimerism results · Engraftment confirmed',
      visitNote: `BMT CLINIC FOLLOW-UP — Day +60 — Feb 17, 2026
Provider: Dr. Ananya Patel, MD | Stanford BMT Program
Patient: Sophia Chen · MRN BMT-2025-04471
Diagnosis: DLBCL (relapsed/refractory) · MUD Allo-SCT · TBI/Cy conditioning · Day 0: Dec 19, 2025

INTERVAL HISTORY
Patient doing reasonably well at Day +60. Reports significant fatigue limiting ADLs to ~4 hours of activity/day. Appetite improved from prior visit — eating ~75% of normal intake. Mild nausea, controlled with ondansetron PRN. No fever, no chills. Mild dry mouth and occasional dry eyes.

VITALS
Weight: 114 lbs (↓8 lbs from pre-transplant baseline)
BP: 118/74 mmHg | HR: 88 bpm | Temp: 98.2°F | SpO2: 97%

KEY LABS (Day +60)
WBC: 5.2 K/µL | Hgb: 9.1 g/dL | Plt: 72 K/µL
Creatinine: 1.12 | Mg: 1.4 | ALT: 61 | Tacrolimus: 9.2 ng/mL
CMV PCR: 142 IU/mL (low-level detectable — monitoring)
Donor Chimerism: 97% whole blood · 89% T-cell

PHYSICAL EXAM
General: Fatigued but alert, no acute distress
Skin: No rash, no jaundice
Eyes: Mild conjunctival dryness bilaterally
Oral mucosa: Mild xerostomia, no ulcers
Abdomen: Soft, non-tender, no hepatosplenomegaly
Extremities: No edema, peripheral pulses intact

ASSESSMENT
1. Engraftment confirmed — Day +60 chimerism 97% whole blood; T-cell chimerism 89% (borderline — will recheck Day +120)
2. Pancytopenia — expected post-transplant, recovering trajectory
3. CMV viremia — low-level, monitoring weekly; letermovir prophylaxis continued
4. Tacrolimus nephrotoxicity — creatinine mildly elevated, electrolyte wasting (Mg, K)
5. No clinical evidence of GvHD at this time — mild xerostomia may represent subclinical oral GvHD, monitoring

PLAN
1. Continue tacrolimus 2 mg BID — trough goal 8–10 ng/mL
2. Continue MMF 1000 mg TID, prednisone 30 mg (taper planned after Day +100 biopsy)
3. Continue letermovir 480 mg QD; if CMV PCR increases >500 at next draw, escalate to ganciclovir
4. Increase MgO to 400 mg TID + KCl 20 mEq BID for electrolyte repletion
5. Continue voriconazole, TMP-SMX, acyclovir as prophylaxis
6. IVIG infusion scheduled (IgG 418 mg/dL < target 500)
7. Day +100 bone marrow biopsy — scheduled Mar 30, 2026
8. Ophthalmology referral placed for GvHD ocular screening (Apr 1)

FOLLOW-UP: Day +90 (Mar 19, 2026) — lab draw only; Day +100 comprehensive`,
    },
    {
      id: 'p3', doctor: 'Dr. Ananya Patel', specialty: 'BMT Clinic',
      date: 'Jan 18, 2026', sortDate: new Date('2026-01-18T10:00').getTime(),
      time: '10:00 AM', type: 'office', visitType: 'BMT Follow-Up',
      note: 'Day +30 visit · First major outpatient milestone',
      visitNote: `BMT CLINIC FOLLOW-UP — Day +30 — Jan 18, 2026
Provider: Dr. Ananya Patel, MD | Stanford BMT Program
Patient: Sophia Chen · MRN BMT-2025-04471
Day 0: Dec 19, 2025 · Discharge: Jan 4, 2026 (Day +16)

INTERVAL HISTORY
First outpatient visit since discharge. Patient tolerated discharge well. Reports severe fatigue, requiring >12 hours sleep daily. Oral mucositis resolving — now Grade 1. Eating approximately 50% of normal intake — nutritional supplementation (Ensure TID). No fever since discharge. Mild skin dryness on forearms.

VITALS
Weight: 112 lbs (↓10 lbs from baseline)
BP: 112/70 mmHg | HR: 92 bpm | Temp: 97.8°F | SpO2: 98%

KEY LABS (Day +30)
WBC: 4.8 K/µL (engrafted) | Hgb: 8.8 g/dL | Plt: 58 K/µL
ANC: 2.2 K/µL (above 0.5 — engraftment confirmed Day +14)
Creatinine: 1.05 | Mg: 1.5 | ALT: 52
Tacrolimus: 9.8 ng/mL (therapeutic)
CMV PCR: <137 IU/mL (undetectable)
Ferritin: 3,450 ng/mL (post-transfusional iron overload)

ASSESSMENT
1. Successful myeloid engraftment — ANC >0.5 confirmed Day +14, Day +21 ANC 2.8
2. Thrombocytopenia — platelet engraftment ongoing, Plt 58 K/µL (improving)
3. Anemia — Hgb 8.8, no transfusion required at this time
4. CMV PCR undetectable — letermovir prophylaxis effective
5. Tacrolimus therapeutic — mild creatinine elevation, electrolyte wasting noted

PLAN
1. Tacrolimus 2 mg BID (trough 9.8 — slightly high; will recheck in 2 weeks)
2. Continue MMF 1000 mg TID + prednisone 40 mg QD (taper to 30 mg at Day +60)
3. All prophylaxis continued (letermovir, voriconazole, TMP-SMX, acyclovir)
4. Nutritional support — continue Ensure TID; dietitian follow-up
5. Add MgO 400 mg TID (Mg 1.5, tacrolimus-related wasting)
6. PICC line removed today — healing well

FOLLOW-UP: Day +60 (Feb 17, 2026)`,
    },
    {
      id: 'p4', doctor: 'Stanford BMT Unit', specialty: 'Allogeneic Transplant',
      date: 'Dec 19, 2025', sortDate: new Date('2025-12-19T08:00').getTime(),
      time: '8:00 AM', type: 'office', visitType: 'Transplant Admission',
      note: 'Day 0 · MUD Allo-SCT infusion · TBI/Cy conditioning complete',
      visitNote: `ALLOGENEIC STEM CELL TRANSPLANT — Day 0 — Dec 19, 2025
Provider: Dr. Ananya Patel, MD | Stanford BMT Program
Patient: Sophia Chen · MRN BMT-2025-04471

TRANSPLANT SUMMARY
Diagnosis: Diffuse Large B-Cell Lymphoma (DLBCL), GCB subtype, relapsed/refractory
• Initial diagnosis: Oct 2023 — Stage IIIA, IPI score 3
• First-line: R-CHOP ×6 cycles (Nov 2023–Apr 2024) → Complete Response
• Relapse: Sep 2024 — PET-positive mediastinal/retroperitoneal disease
• Salvage: R-ICE ×3 cycles (Oct–Dec 2024) → Partial Response
• Auto-SCT considered but not pursued (high-risk features, MYC rearrangement)
• Allogeneic SCT decision: Jan 2025 HLA typing; MUD 10/10 match identified

CONDITIONING REGIMEN
TBI/Cy: Total Body Irradiation 1200 cGy (fractionated Dec 10–15) + Cyclophosphamide 60 mg/kg ×2 doses (Dec 17–18)

GRAFT SOURCE
Donor: MUD — 10/10 HLA match | G-CSF mobilized PBSC
Graft composition: CD34+ cells 4.2 ×10⁶/kg | CD3+ cells 28 ×10⁷/kg
Infused: Dec 19, 2025 08:15 — tolerated without complication

GvHD PROPHYLAXIS INITIATED
Tacrolimus (from Day -1) + MMF (from Day 0) + mini-methotrexate (Days +1, +3, +6, +11)

DISCHARGE: Day +16 (Jan 4, 2026) — engraftment confirmed, no major complications`,
    },
  ],
  'zh-CN': [
    {
      id: 'p1', doctor: '斯坦福大学骨髓移植实验室', specialty: '抽血化验',
      date: '2026年3月19日', sortDate: new Date('2026-03-19T07:30').getTime(),
      time: '上午 7:30', type: 'lab', visitType: '抽血化验',
      note: '移植后第+90天化验 — 全血细胞计数、代谢全项、他克莫司、CMV PCR、铁蛋白、IgG',
      visitNote: `化验单 — 移植后第+90天 — 2026年3月19日
开单医生：帕特尔医生 | 斯坦福大学骨髓移植中心

检查项目
• 全血细胞计数及分类
• 代谢全项（CMP）
• 镁、磷
• 他克莫司谷浓度
• 巨细胞病毒核酸定量（CMV PCR）
• 铁蛋白
• 免疫球蛋白G（IgG）

结果（报告日期：2026年3月19日）
白细胞（WBC）：3.8 K/µL [偏低]（参考值：4.5–11.0）
血红蛋白：9.4 g/dL [偏低]（参考值：12.0–16.0）
红细胞压积：28.5% [偏低]（参考值：36–46%）
血小板：88 K/µL [偏低]（参考值：150–400）
肌酐：1.18 mg/dL [偏高]（参考值：0.5–1.1）
血尿素氮：22 mg/dL（正常）
估算肾小球滤过率：58 mL/min [临界]（参考值：>60）
镁：1.4 mEq/L [偏低]（参考值：1.7–2.2）
钾：3.4 mEq/L [偏低]（参考值：3.5–5.0）
谷丙转氨酶（ALT）：68 U/L [偏高]（参考值：7–40）
谷草转氨酶（AST）：52 U/L [偏高]（参考值：10–40）
总胆红素：1.9 mg/dL [偏高]（参考值：0.2–1.2）
他克莫司谷浓度：8.2 ng/mL（治疗范围内；参考值：6–12）
CMV PCR：285 IU/mL [偏高] — 阳性（参考值：<137）
铁蛋白：4,820 ng/mL [偏高]（参考值：10–200）
免疫球蛋白G（IgG）：418 mg/dL [偏低] — 2026年3月5日（参考值：700–1,600）

医生备注
CMV病毒血症升高 — 已与感染科团队讨论，将从来特莫韦预防治疗升级为更昔洛韦抢先治疗。肝酶轻度升高 — 正在监测是否为肝脏移植物抗宿主病还是伏立康唑毒性所致。口服补镁后镁仍偏低。IgG低于500，2周内安排免疫球蛋白静脉输注（IVIG）。`,
    },
    {
      id: 'p2', doctor: '帕特尔医生', specialty: '骨髓移植门诊',
      date: '2026年2月17日', sortDate: new Date('2026-02-17T10:00').getTime(),
      time: '上午 10:00', type: 'office', visitType: '骨髓移植门诊随访',
      note: '移植后第+60天就诊 · 嵌合率结果 · 移植造血确认',
      visitNote: `骨髓移植门诊随访 — 移植后第+60天 — 2026年2月17日
主治医生：帕特尔医生 | 斯坦福大学骨髓移植中心
患者：陈思颖（Sophia Chen）· 病历号 BMT-2025-04471
诊断：弥漫大B细胞淋巴瘤（复发/难治）· 无关供体异基因造血干细胞移植 · 全身照射/环磷酰胺预处理 · 移植日：2025年12月19日

病史回顾
患者移植后第+60天，整体情况尚可。诉明显乏力，日常活动受限，每日可活动约4小时。食欲较上次就诊有所改善，进食量约为平时的75%。轻度恶心，按需服用昂丹司琼控制。无发热、无寒战。轻度口腔干燥，偶有眼干。

生命体征
体重：114磅（较移��前基线下降8磅）
血压：118/74 mmHg | 心率：88次/分 | 体温：36.8°C | 血氧饱和度：97%

主要化验（移植后第+60天）
白细胞：5.2 K/µL | 血红蛋白：9.1 g/dL | 血小板：72 K/µL
肌酐：1.12 | 镁：1.4 | 谷丙转氨酶：61 | 他克莫司：9.2 ng/mL
CMV PCR：142 IU/mL（低水平阳性 — 持续监测）
供体嵌合率：全血97% · T细胞89%

体格检查
一般情况：乏力，神志清，无急性面容
皮肤：无皮疹，无黄疸
眼部：双侧轻度结膜干燥
口腔黏膜：轻度口腔干燥，无溃疡
腹部：软，无压痛，无肝脾肿大
四肢：无水肿，外周脉搏正常

诊断
1. 移植造血成功 — 移植后第+60天全血嵌合率97%；T细胞嵌合率89%（临界值 — 将在第+120天复查）
2. 全血细胞减少 — 移植后预期反应，恢复中
3. CMV病毒血症 — 低水平，每周监测；继续来特莫韦预防治疗
4. 他克莫司肾毒性 — 肌酐轻度升高，电解质流失（镁、钾）
5. 暂无移植物抗宿主病临床表现 — 轻度口腔干燥可能为口腔亚临床GvHD，持续监测

诊疗计划
1. 继续他克莫司2mg每日两次 — 谷浓度目标8–10 ng/mL
2. 继续吗替麦考酚酯1000mg每日三次，泼尼松30mg（计划第+100天活检后减量）
3. 继续来特莫韦480mg每日一次；如下次CMV PCR >500，升级为更昔洛韦
4. 氧化镁400mg每日三次 + 氯化钾20 mEq每日两次补充电解质
5. 继续伏立康唑、复方磺胺甲噁唑、阿昔洛韦预防治疗
6. 安排免疫球蛋白静脉输注（IgG 418 mg/dL < 目标值500）
7. 移植后第+100天骨髓活检 — 已安排于2026年3月30日
8. 眼科转诊已开立，进行GvHD眼部筛查（4月1日）

复诊：第+90天（2026年3月19日）— 仅化验；第+100天综合复诊`,
    },
    {
      id: 'p3', doctor: '帕特尔医生', specialty: '骨髓移植门诊',
      date: '2026年1月18日', sortDate: new Date('2026-01-18T10:00').getTime(),
      time: '上午 10:00', type: 'office', visitType: '骨髓移植门诊随访',
      note: '移植后第+30天就诊 · 首次重要门诊里程碑',
      visitNote: `骨髓移植门诊随访 — 移植后第+30天 — 2026年1月18日
主治医生：帕特尔医生 | 斯坦福大学骨髓移植中心
患者：陈思颖（Sophia Chen）· 病历号 BMT-2025-04471
移植日：2025年12月19日 · 出院：2026年1月4日（移植后第+16天）

病史回顾
出院后首次门诊随访。患者耐受出院情况良好。诉严重乏力，每日需睡眠超过12小时。口腔黏膜炎好转 — 目前为1级。进食量约为平时的50% — 正在进行营养补充（安素每日三次）。出院后无发热。前臂皮肤轻度干燥。

生命体征
体重：112磅（较基线下降10磅）
血压：112/70 mmHg | 心率：92次/分 | 体温：36.6°C | 血氧饱和度：98%

主要化验（移植后第+30天）
白细胞：4.8 K/µL（已植入）| 血红蛋白：8.8 g/dL | 血小板：58 K/µL
中性粒细胞绝对计数：2.2 K/µL（>0.5 — 移植后第+14天确认造血植入）
肌酐：1.05 | 镁：1.5 | 谷丙转氨酶：52
他克莫司：9.8 ng/mL（治疗范围内）
CMV PCR：<137 IU/mL（未检测到）
铁蛋白：3,450 ng/mL（输血后铁过载）

诊断
1. 骨髓造血植入成功 — 第+14天ANC>0.5确认，第+21天ANC 2.8
2. 血小板减少 — 血小板植入中，Plt 58 K/µL（好转中）
3. 贫血 — 血红蛋白8.8，暂无需输血
4. CMV PCR未检测到 — 来特莫韦预防有效
5. 他克莫司治疗范围内 — 肌酐轻度升高，注意电解质流失

诊疗计划
1. 他克莫司2mg每日两次（谷浓度9.8 — 略偏高；2周后复查）
2. 继续吗替麦考酚酯1000mg每日三次 + 泼尼松40mg每日一次（第+60天减至30mg）
3. 继续所有预防用药（来特莫韦、伏立康唑、复方磺胺甲噁唑、阿昔洛韦）
4. 营养支持 — 继续安素每日三次；营养科随访
5. 加用氧化镁400mg每日三次（镁1.5，他克莫司相关流失）
6. 今日拔除PICC导管 — 愈合良好

复诊：第+60天（2026年2月17日）`,
    },
    {
      id: 'p4', doctor: '斯坦福大学骨髓移植病区', specialty: '异基因移植',
      date: '2025年12月19日', sortDate: new Date('2025-12-19T08:00').getTime(),
      time: '上午 8:00', type: 'office', visitType: '移植入院',
      note: '移植第0天 · 无关供体异基因造血干细胞移植回输 · 全身照射/环磷酰胺预处理完成',
      visitNote: `异基因造血干细胞移植 — 移植当日（Day 0）— 2025年12月19日
主治医生：帕特尔医生 | 斯坦福大学骨髓移植中心
患者：陈思颖（Sophia Chen）· 病历号 BMT-2025-04471

移植摘要
诊断：弥漫大B细胞淋巴瘤（DLBCL），生发中心B细胞亚型，复发/难治性
• 初诊：2023年10月 — III期A，IPI评分3分
• 一线治疗：R-CHOP化疗×6个周期（2023年11月–2024年4月）→ 完全缓解
• 复发：2024年9月 — PET扫描显示纵隔/腹膜后淋巴结阳性
• 挽救治疗：R-ICE×3个周期（2024年10月–12月）→ 部分缓解
• 自体移植评估后未进行（高危特征，MYC基因重排）
• 异基因移植决策：2025年1月HLA配型；找到10/10配型无关供体

预处理方案
全身照射/环磷酰胺：全身照射1200 cGy（分次照射，12月10–15日）+ 环磷酰胺60 mg/kg × 2次（12月17–18日）

移植物来源
供体：无关供体 — 10/10 HLA配型 | G-CSF动员外周血干细胞
移植物组成：CD34+细胞 4.2×10⁶/kg | CD3+细胞 28×10⁷/kg
回输时间：2025年12月19日 08:15 — 耐受良好，无并发症

移植物抗宿主病预防方案
他克莫司（从移植前第-1天起）+ 吗替麦考酚酯（从移植当日起）+ 小剂量甲氨蝶呤（第+1、+3、+6、+11天）

出院：移植后第+16天（2026年1月4日）— 造血植入确认，无重大并发症`,
    },
  ],
};

// Sort upcoming ascending (soonest first), past descending (most recent first)
function sortedUpcoming(lang: Language) {
  return [...UPCOMING[lang]].sort((a, b) => a.sortDate - b.sortDate);
}
function sortedPast(lang: Language) {
  return [...PAST[lang]].sort((a, b) => b.sortDate - a.sortDate);
}

// ─── Visit Note Modal ──────────────────────────────────────────────────────────

function VisitNoteModal({
  appt,
  visible,
  onClose,
  t,
}: {
  appt: PastAppointment | null;
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
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
          <View style={modal.sheetHeader}>
            <View style={modal.handleBar} />
          </View>

          <View style={modal.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={modal.noteDoctor}>{appt.doctor}</Text>
              <Text style={modal.noteMeta}>{appt.visitType ?? appt.specialty} · {appt.date} · {appt.time}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={modal.divider} />

          <ScrollView
            style={modal.noteScroll}
            contentContainerStyle={modal.noteContent}
            showsVerticalScrollIndicator
          >
            <Text style={modal.noteText}>{appt.visitNote}</Text>
          </ScrollView>

          <View style={modal.divider} />

          <TouchableOpacity style={modal.aiBtn} onPress={handleReviewWithAI} activeOpacity={0.8}>
            <View style={modal.aiBtnRow}>
              <Ionicons name="sparkles" size={15} color={Colors.purple} />
              <Text style={modal.aiBtnText}>{t('reviewWithAI')}</Text>
            </View>
            <Text style={modal.aiBtnSub}>{t('reviewWithAISub')}</Text>
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

function UpcomingCard({ appt, t }: { appt: Appointment; t: (key: string) => string }) {
  return (
    <View style={card.base}>
      <View style={card.top}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={card.doctor}>{appt.doctor}</Text>
          <Text style={card.specialty}>{appt.specialty}</Text>
        </View>
        <View style={[card.pill, appt.status === 'soon' && card.pillSoon]}>
          <Text style={[card.pillText, appt.status === 'soon' && card.pillTextSoon]}>
            {appt.status === 'soon' ? t('statusSoon') : t('statusUpcoming')}
          </Text>
        </View>
      </View>
      <View style={card.dateRow}>
        <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
        <Text style={card.date}>{appt.date} · {appt.time}</Text>
      </View>
      {appt.note && <Text style={card.note}>{appt.note}</Text>}
      <View style={card.actions}>
        <TouchableOpacity
          style={card.btnPrimary}
          activeOpacity={0.8}
          onPress={() => router.push(
            `/chat?message=${encodeURIComponent(`Help me prepare for my ${appt.specialty} appointment with ${appt.doctor} on ${appt.date}. What should I know, bring, and ask?`)}`
          )}
        >
          <View style={card.btnInner}>
            <Ionicons name="sparkles" size={13} color="#fff" />
            <Text style={card.btnPrimaryText}>{t('prepWithAI')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnSec} activeOpacity={0.7}>
          <Text style={card.btnSecText}>{t('rescheduleBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Past Card ─────────────────────────────────────────────────────────────────

function PastCard({
  appt,
  onViewNote,
  t,
}: {
  appt: PastAppointment;
  onViewNote: (appt: PastAppointment) => void;
  t: (key: string) => string;
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
      <View style={card.dateRow}>
        <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
        <Text style={card.date}>{appt.date} · {appt.time}</Text>
      </View>
      {appt.note && <Text style={card.note}>{appt.note}</Text>}
      <View style={card.actions}>
        <TouchableOpacity
          style={card.btnNote}
          activeOpacity={0.8}
          onPress={() => onViewNote(appt)}
        >
          <View style={card.btnInner}>
            <Ionicons name="document-text-outline" size={13} color={Colors.textSecondary} />
            <Text style={card.btnNoteText}>{t('visitSummary')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={card.btnAI} activeOpacity={0.8} onPress={handleReviewWithAI}>
          <View style={card.btnInner}>
            <Ionicons name="sparkles" size={13} color={Colors.purple} />
            <Text style={card.btnAIText}>{t('reviewWithAI')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const { language, t } = useLanguage();
  const [selectedNote, setSelectedNote] = useState<PastAppointment | null>(null);

  const upcoming = sortedUpcoming(language);
  const past = sortedPast(language);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointmentsTitle')}</Text>
        <TouchableOpacity style={styles.prepBtn} onPress={() => router.push('/prep')}>
          <View style={styles.prepBtnInner}>
            <Ionicons name="clipboard-outline" size={13} color={Colors.purple} />
            <Text style={styles.prepBtnText}>{t('prepBtn')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title={t('upcomingTitle')} count={upcoming.length} />
        {upcoming.map((appt) => (
          <UpcomingCard key={appt.id} appt={appt} t={t} />
        ))}

        <SectionHeader title={t('pastVisitsTitle')} count={past.length} />
        {past.map((appt) => (
          <PastCard key={appt.id} appt={appt} onViewNote={setSelectedNote} t={t} />
        ))}
      </ScrollView>

      <VisitNoteModal
        appt={selectedNote}
        visible={selectedNote !== null}
        onClose={() => setSelectedNote(null)}
        t={t}
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
  prepBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
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
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { fontSize: 13, color: Colors.textSecondary },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  note: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17, fontStyle: 'italic' },
  pill: { backgroundColor: `${Colors.blue}20`, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  pillSoon: { backgroundColor: `${Colors.orange}20` },
  pillText: { fontSize: 11, fontWeight: '600', color: Colors.blue },
  pillTextSoon: { color: Colors.orange },
  visitTypePill: { backgroundColor: Colors.bgCard, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  visitTypeText: { fontSize: 11, fontWeight: '500', color: Colors.textTertiary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  btnPrimary: { flex: 1, backgroundColor: Colors.blue, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnSec: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  btnSecText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
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
  aiBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBtnText: { color: Colors.purple, fontSize: 15, fontWeight: '700' },
  aiBtnSub: { color: `${Colors.purple}99`, fontSize: 12 },
});

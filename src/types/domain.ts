/**
 * Clean domain objects returned by parsers and ultimately sent to the AI.
 * These are deliberately free of FHIR-isms — the AI works with these, not raw FHIR.
 */

// ── Patient ────────────────────────────────────────────────────────────────────

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone?: string;
}

export interface ActiveCondition {
  display: string;
  icdCode?: string;
  onsetDate?: string;
  clinicalStatus: string;
}

export interface PatientSummary {
  name: string;
  dateOfBirth: string;
  mrn: string;
  gender: string;
  activeConditions: ActiveCondition[];
  allergySummary: string[]; // short strings like "Penicillin (hives, severe)"
  emergencyContacts: EmergencyContact[];
}

// ── Labs ───────────────────────────────────────────────────────────────────────

export type LabInterpretation = 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high' | 'unknown';

export interface LabResult {
  loincCode: string;
  display: string;
  value: number | string;
  unit: string;
  referenceRange?: string;
  interpretation: LabInterpretation;
  effectiveDate: string; // ISO 8601
}

export interface LabTrends {
  panel: string;
  // keyed by analyte display name, e.g. "WBC", "ANC"
  results: Record<string, LabResult[]>;
}

// ── Medications ────────────────────────────────────────────────────────────────

export interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  route?: string;
  prescriber?: string;
  startDate?: string;
}

export interface MedicationRegimen {
  chemoAgents: MedicationItem[];
  supportive: MedicationItem[];   // antiemetics, steroids, growth factors
  prophylaxis: MedicationItem[];  // antivirals, antifungals, antibiotics
  prn: MedicationItem[];          // as-needed
  other: MedicationItem[];
}

// ── Appointments ───────────────────────────────────────────────────────────────

export interface AppointmentInfo {
  date: string;      // e.g. "2024-06-15"
  time: string;      // e.g. "10:30 AM"
  provider: string;
  specialty?: string;
  location: string;
  distanceFlag: boolean; // true if location is flagged as far (>threshold miles)
  status: string;
}

// ── Care Team ──────────────────────────────────────────────────────────────────

export interface CareTeamMember {
  role: string;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
}

// ── Clinical Notes ─────────────────────────────────────────────────────────────

export interface ClinicalNote {
  type: string;
  date: string;
  provider?: string;
  text: string; // stripped of XML/HTML, normalized whitespace
}

// ── Treatment History ──────────────────────────────────────────────────────────

export type TreatmentEventType =
  | 'surgery'
  | 'infusion'
  | 'chemo_cycle'
  | 'radiation'
  | 'transplant'
  | 'procedure'
  | 'other';

export interface TreatmentEvent {
  type: TreatmentEventType;
  description: string;
  date: string;
  provider?: string;
  location?: string;
}

// ── Allergies ──────────────────────────────────────────────────────────────────

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'unknown';

export interface AllergyItem {
  substance: string;
  reactions: string[];
  severity: AllergySeverity;
  status: string;
}

export interface AllergyProfile {
  drugAllergies: AllergyItem[];
  foodAllergies: AllergyItem[];
  environmentalAllergies: AllergyItem[];
  other: AllergyItem[];
}

// ── Oncology Summary ───────────────────────────────────────────────────────────

export interface OncologySummary {
  patient: Pick<PatientSummary, 'name' | 'dateOfBirth' | 'mrn'>;
  primaryDiagnosis?: ActiveCondition;
  currentChemoAgents: MedicationItem[];
  recentKeyLabs: LabResult[];  // most recent value per analyte
  nextAppointment?: AppointmentInfo;
  asOf: string; // ISO 8601 timestamp
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export class NoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoDataError';
  }
}

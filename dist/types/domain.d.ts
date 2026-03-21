/**
 * Clean domain objects returned by parsers and ultimately sent to the AI.
 * These are deliberately free of FHIR-isms — the AI works with these, not raw FHIR.
 */
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
    allergySummary: string[];
    emergencyContacts: EmergencyContact[];
}
export type LabInterpretation = 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high' | 'unknown';
export interface LabResult {
    loincCode: string;
    display: string;
    value: number | string;
    unit: string;
    referenceRange?: string;
    interpretation: LabInterpretation;
    effectiveDate: string;
}
export interface LabTrends {
    panel: string;
    results: Record<string, LabResult[]>;
}
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
    supportive: MedicationItem[];
    prophylaxis: MedicationItem[];
    prn: MedicationItem[];
    other: MedicationItem[];
}
export interface AppointmentInfo {
    date: string;
    time: string;
    provider: string;
    specialty?: string;
    location: string;
    distanceFlag: boolean;
    status: string;
}
export interface CareTeamMember {
    role: string;
    name: string;
    specialty?: string;
    phone?: string;
    email?: string;
}
export interface ClinicalNote {
    type: string;
    date: string;
    provider?: string;
    text: string;
}
export type TreatmentEventType = 'surgery' | 'infusion' | 'chemo_cycle' | 'radiation' | 'transplant' | 'procedure' | 'other';
export interface TreatmentEvent {
    type: TreatmentEventType;
    description: string;
    date: string;
    provider?: string;
    location?: string;
}
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
export interface OncologySummary {
    patient: Pick<PatientSummary, 'name' | 'dateOfBirth' | 'mrn'>;
    primaryDiagnosis?: ActiveCondition;
    currentChemoAgents: MedicationItem[];
    recentKeyLabs: LabResult[];
    nextAppointment?: AppointmentInfo;
    asOf: string;
}
export declare class NoDataError extends Error {
    constructor(message: string);
}

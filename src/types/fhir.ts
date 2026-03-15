/**
 * Minimal FHIR R4 type definitions — only fields we actually read.
 * Not a complete FHIR spec; intentionally narrow to keep things manageable.
 */

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirReference {
  reference?: string;
  display?: string;
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirRange {
  low?: FhirQuantity;
  high?: FhirQuantity;
}

export interface FhirIdentifier {
  system?: string;
  value?: string;
  type?: FhirCodeableConcept;
}

export interface FhirHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FhirAddress {
  use?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirContactPoint {
  system?: string; // phone | fax | email | url | sms | other
  value?: string;
  use?: string;
}

export interface FhirAnnotation {
  text?: string;
  time?: string;
}

export interface FhirDosageInstruction {
  text?: string;
  timing?: {
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: string;
      boundsPeriod?: FhirPeriod;
    };
    code?: FhirCodeableConcept;
  };
  route?: FhirCodeableConcept;
  doseAndRate?: Array<{
    doseQuantity?: FhirQuantity;
    doseRange?: FhirRange;
  }>;
}

// ── Resources ──────────────────────────────────────────────────────────────────

export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  birthDate?: string;
  gender?: string;
  address?: FhirAddress[];
  telecom?: FhirContactPoint[];
  contact?: Array<{
    relationship?: FhirCodeableConcept[];
    name?: FhirHumanName;
    telecom?: FhirContactPoint[];
  }>;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id?: string;
  status?: string;
  category?: FhirCodeableConcept[];
  code?: FhirCodeableConcept;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  issued?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueCodeableConcept?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
  subject?: FhirReference;
}

export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  id?: string;
  status?: string;
  intent?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  subject?: FhirReference;
  authoredOn?: string;
  requester?: FhirReference;
  dosageInstruction?: FhirDosageInstruction[];
  category?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
}

export interface FhirAppointment {
  resourceType: 'Appointment';
  id?: string;
  status?: string;
  serviceType?: FhirCodeableConcept[];
  specialty?: FhirCodeableConcept[];
  start?: string;
  end?: string;
  comment?: string;
  patientInstruction?: string;
  participant?: Array<{
    actor?: FhirReference;
    status?: string;
    type?: FhirCodeableConcept[];
  }>;
  reasonCode?: FhirCodeableConcept[];
}

export interface FhirCareTeam {
  resourceType: 'CareTeam';
  id?: string;
  status?: string;
  name?: string;
  subject?: FhirReference;
  period?: FhirPeriod;
  participant?: Array<{
    role?: FhirCodeableConcept[];
    member?: FhirReference;
    onBehalfOf?: FhirReference;
    period?: FhirPeriod;
  }>;
}

export interface FhirPractitioner {
  resourceType: 'Practitioner';
  id?: string;
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  qualification?: Array<{
    code?: FhirCodeableConcept;
  }>;
}

export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id?: string;
  status?: string;
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  date?: string;
  author?: FhirReference[];
  description?: string;
  content?: Array<{
    attachment?: {
      contentType?: string;
      url?: string;
      data?: string; // base64
      title?: string;
    };
  }>;
  context?: {
    period?: FhirPeriod;
    encounter?: FhirReference[];
  };
}

export interface FhirProcedure {
  resourceType: 'Procedure';
  id?: string;
  status?: string;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
  performedDateTime?: string;
  performedPeriod?: FhirPeriod;
  performer?: Array<{
    actor?: FhirReference;
  }>;
  location?: FhirReference;
  note?: FhirAnnotation[];
}

export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  subject?: FhirReference;
  onsetDateTime?: string;
  onsetPeriod?: FhirPeriod;
  recordedDate?: string;
  note?: FhirAnnotation[];
}

export interface FhirAllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id?: string;
  clinicalStatus?: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  type?: string; // allergy | intolerance
  category?: string[]; // food | medication | environment | biologic
  criticality?: string; // low | high | unable-to-assess
  code?: FhirCodeableConcept;
  patient?: FhirReference;
  onsetDateTime?: string;
  reaction?: Array<{
    substance?: FhirCodeableConcept;
    manifestation?: FhirCodeableConcept[];
    severity?: string; // mild | moderate | severe
  }>;
}

// ── Bundle ─────────────────────────────────────────────────────────────────────

export interface FhirBundleEntry<T> {
  fullUrl?: string;
  resource?: T;
}

export interface FhirBundle<T> {
  resourceType: 'Bundle';
  type?: string;
  total?: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry?: FhirBundleEntry<T>[];
}

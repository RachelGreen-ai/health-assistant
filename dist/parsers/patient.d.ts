import type { FhirPatient } from '../types/fhir.js';
import type { PatientSummary } from '../types/domain.js';
export declare function parsePatient(patient: FhirPatient): PatientSummary;

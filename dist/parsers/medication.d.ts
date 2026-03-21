import type { FhirMedicationRequest } from '../types/fhir.js';
import type { MedicationRegimen } from '../types/domain.js';
export declare function parseMedicationRegimen(requests: FhirMedicationRequest[]): MedicationRegimen;

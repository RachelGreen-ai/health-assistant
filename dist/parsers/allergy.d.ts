import type { FhirAllergyIntolerance } from '../types/fhir.js';
import type { AllergyProfile, AllergyItem } from '../types/domain.js';
export declare function parseAllergies(allergies: FhirAllergyIntolerance[]): AllergyProfile;
/** Short one-liner summaries for use in PatientSummary.allergySummary */
export declare function allergyOneLiner(item: AllergyItem): string;

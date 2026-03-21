import type { FhirProcedure } from '../types/fhir.js';
import type { TreatmentEvent } from '../types/domain.js';
export declare function parseProcedures(procedures: FhirProcedure[]): TreatmentEvent[];

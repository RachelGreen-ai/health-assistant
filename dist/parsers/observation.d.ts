import type { FhirObservation } from '../types/fhir.js';
import type { LabResult, LabTrends } from '../types/domain.js';
export declare function parseLabTrends(observations: FhirObservation[], panelName: string): LabTrends;
/** Return only the most recent result for each analyte (for the oncology summary). */
export declare function parseLatestLabs(observations: FhirObservation[]): LabResult[];

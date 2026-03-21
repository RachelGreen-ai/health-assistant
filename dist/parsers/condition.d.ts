import type { FhirCondition } from '../types/fhir.js';
import type { ActiveCondition } from '../types/domain.js';
export declare function parseConditions(conditions: FhirCondition[]): ActiveCondition[];

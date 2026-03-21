import type { FhirDocumentReference } from '../types/fhir.js';
import type { ClinicalNote } from '../types/domain.js';
export declare function parseDocument(docRef: FhirDocumentReference, rawText: string): ClinicalNote;

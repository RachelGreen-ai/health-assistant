import type { FhirPatient, FhirObservation, FhirMedicationRequest, FhirAppointment, FhirCareTeam, FhirPractitioner, FhirDocumentReference, FhirProcedure, FhirCondition, FhirAllergyIntolerance } from '../types/fhir.js';
export interface DateRange {
    start?: string;
    end?: string;
}
/** GET a single FHIR resource by path + optional params. */
export declare function fhirGet<T>(path: string, params?: Record<string, string>): Promise<T>;
/**
 * GET a FHIR Bundle and return all entry resources, following pagination links
 * until exhausted or maxEntries is reached.
 */
export declare function fhirBundle<T>(resourceType: string, params: Record<string, string>, maxEntries?: number): Promise<T[]>;
export declare function getPatient(patientId: string): Promise<FhirPatient>;
export declare function getObservations(patientId: string, codes: string[], dateRange?: DateRange, count?: number): Promise<FhirObservation[]>;
export declare function getMedicationRequests(patientId: string, status?: string): Promise<FhirMedicationRequest[]>;
export declare function getAppointments(patientId: string, count?: number): Promise<FhirAppointment[]>;
export declare function getCareTeams(patientId: string): Promise<FhirCareTeam[]>;
export declare function getPractitioner(practitionerId: string): Promise<FhirPractitioner>;
export declare function getDocumentReferences(patientId: string, count?: number): Promise<FhirDocumentReference[]>;
export declare function getProcedures(patientId: string, dateRange?: DateRange): Promise<FhirProcedure[]>;
export declare function getConditions(patientId: string): Promise<FhirCondition[]>;
export declare function getAllergyIntolerances(patientId: string): Promise<FhirAllergyIntolerance[]>;
/**
 * Fetch a Binary resource and return its decoded text content.
 * Used to retrieve clinical note bodies from DocumentReference.content.attachment.url
 */
export declare function getBinaryText(binaryUrl: string): Promise<string>;

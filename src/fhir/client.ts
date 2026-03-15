import axios, { AxiosInstance } from 'axios';
import { getValidAccessToken } from '../auth/auth-client.js';
import { config } from '../config.js';
import type {
  FhirBundle,
  FhirPatient,
  FhirObservation,
  FhirMedicationRequest,
  FhirAppointment,
  FhirCareTeam,
  FhirPractitioner,
  FhirDocumentReference,
  FhirProcedure,
  FhirCondition,
  FhirAllergyIntolerance,
} from '../types/fhir.js';

export interface DateRange {
  start?: string; // ISO 8601
  end?: string;
}

// ── Axios instance ─────────────────────────────────────────────────────────────

const http: AxiosInstance = axios.create({
  baseURL: config.baseUrl,
  headers: { Accept: 'application/fhir+json' },
  timeout: 30_000,
});

// Inject a fresh Bearer token before every request
http.interceptors.request.use(async (req) => {
  const token = await getValidAccessToken();
  req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Core helpers ───────────────────────────────────────────────────────────────

/** GET a single FHIR resource by path + optional params. */
export async function fhirGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const response = await http.get<T>(path, { params });
  return response.data;
}

/**
 * GET a FHIR Bundle and return all entry resources, following pagination links
 * until exhausted or maxEntries is reached.
 */
export async function fhirBundle<T>(
  resourceType: string,
  params: Record<string, string>,
  maxEntries = 200
): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `${config.baseUrl}/${resourceType}`;
  let firstRequest = true;

  while (url && results.length < maxEntries) {
    let response: Awaited<ReturnType<typeof http.get<FhirBundle<T>>>>;
    if (firstRequest) {
      response = await http.get<FhirBundle<T>>(url, { params });
      firstRequest = false;
    } else {
      response = await http.get<FhirBundle<T>>(url);
    }

    const bundle: FhirBundle<T> = response.data;

    for (const entry of bundle.entry ?? []) {
      if (entry.resource) results.push(entry.resource);
      if (results.length >= maxEntries) break;
    }

    // Follow the "next" link for pagination
    const nextLink = bundle.link?.find((l: { relation: string; url: string }) => l.relation === 'next');
    url = nextLink?.url ?? null;
  }

  return results;
}

// ── Typed convenience methods ──────────────────────────────────────────────────

export async function getPatient(patientId: string): Promise<FhirPatient> {
  return fhirGet<FhirPatient>(`Patient/${patientId}`);
}

export async function getObservations(
  patientId: string,
  codes: string[],
  dateRange?: DateRange,
  count = 50
): Promise<FhirObservation[]> {
  const params: Record<string, string> = {
    patient:  patientId,
    code:     codes.join(','),
    _sort:    '-date',
    _count:   String(count),
  };
  if (dateRange?.start) params['date'] = `ge${dateRange.start}`;
  if (dateRange?.end)   params['date'] = params['date']
    ? `${params['date']}&date=le${dateRange.end}`
    : `le${dateRange.end}`;

  return fhirBundle<FhirObservation>('Observation', params, count);
}

export async function getMedicationRequests(
  patientId: string,
  status = 'active'
): Promise<FhirMedicationRequest[]> {
  return fhirBundle<FhirMedicationRequest>('MedicationRequest', {
    patient: patientId,
    status,
    _sort:   '-authoredon',
    _count:  '100',
  });
}

export async function getAppointments(
  patientId: string,
  count = 10
): Promise<FhirAppointment[]> {
  const today = new Date().toISOString().split('T')[0];
  return fhirBundle<FhirAppointment>('Appointment', {
    patient: patientId,
    status:  'booked,arrived,pending',
    date:    `ge${today}`,
    _sort:   'date',
    _count:  String(count),
  }, count);
}

export async function getCareTeams(patientId: string): Promise<FhirCareTeam[]> {
  return fhirBundle<FhirCareTeam>('CareTeam', {
    patient: patientId,
    status:  'active',
  });
}

export async function getPractitioner(practitionerId: string): Promise<FhirPractitioner> {
  return fhirGet<FhirPractitioner>(`Practitioner/${practitionerId}`);
}

export async function getDocumentReferences(
  patientId: string,
  count = 5
): Promise<FhirDocumentReference[]> {
  return fhirBundle<FhirDocumentReference>('DocumentReference', {
    patient: patientId,
    status:  'current',
    _sort:   '-date',
    _count:  String(count),
  }, count);
}

export async function getProcedures(
  patientId: string,
  dateRange?: DateRange
): Promise<FhirProcedure[]> {
  const params: Record<string, string> = {
    patient: patientId,
    status:  'completed',
    _sort:   '-date',
    _count:  '100',
  };
  if (dateRange?.start) params['date'] = `ge${dateRange.start}`;
  if (dateRange?.end)   params['date'] = `le${dateRange.end}`;

  return fhirBundle<FhirProcedure>('Procedure', params);
}

export async function getConditions(patientId: string): Promise<FhirCondition[]> {
  return fhirBundle<FhirCondition>('Condition', {
    patient:          patientId,
    'clinical-status': 'active,recurrence,relapse',
    _sort:            '-recorded-date',
    _count:           '100',
  });
}

export async function getAllergyIntolerances(patientId: string): Promise<FhirAllergyIntolerance[]> {
  return fhirBundle<FhirAllergyIntolerance>('AllergyIntolerance', {
    patient: patientId,
    _sort:   '-date',
    _count:  '100',
  });
}

/**
 * Fetch a Binary resource and return its decoded text content.
 * Used to retrieve clinical note bodies from DocumentReference.content.attachment.url
 */
export async function getBinaryText(binaryUrl: string): Promise<string> {
  // Binary URLs may be absolute (full URL) or relative (just the ID path)
  const url = binaryUrl.startsWith('http') ? binaryUrl : `${config.baseUrl}/${binaryUrl}`;
  const response = await http.get<string>(url, {
    headers: { Accept: 'text/plain, text/html, application/xml, */*' },
    responseType: 'text',
  });
  return response.data;
}

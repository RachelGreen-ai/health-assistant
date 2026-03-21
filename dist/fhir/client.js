import axios from 'axios';
import { getValidAccessToken } from '../auth/auth-client.js';
import { config } from '../config.js';
// ── Axios instance ─────────────────────────────────────────────────────────────
const http = axios.create({
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
export async function fhirGet(path, params = {}) {
    const response = await http.get(path, { params });
    return response.data;
}
/**
 * GET a FHIR Bundle and return all entry resources, following pagination links
 * until exhausted or maxEntries is reached.
 */
export async function fhirBundle(resourceType, params, maxEntries = 200) {
    const results = [];
    let url = `${config.baseUrl}/${resourceType}`;
    let firstRequest = true;
    while (url && results.length < maxEntries) {
        let response;
        if (firstRequest) {
            response = await http.get(url, { params });
            firstRequest = false;
        }
        else {
            response = await http.get(url);
        }
        const bundle = response.data;
        for (const entry of bundle.entry ?? []) {
            if (entry.resource)
                results.push(entry.resource);
            if (results.length >= maxEntries)
                break;
        }
        // Follow the "next" link for pagination
        const nextLink = bundle.link?.find((l) => l.relation === 'next');
        url = nextLink?.url ?? null;
    }
    return results;
}
// ── Typed convenience methods ──────────────────────────────────────────────────
export async function getPatient(patientId) {
    return fhirGet(`Patient/${patientId}`);
}
export async function getObservations(patientId, codes, dateRange, count = 50) {
    const params = {
        patient: patientId,
        code: codes.join(','),
        _sort: '-date',
        _count: String(count),
    };
    if (dateRange?.start)
        params['date'] = `ge${dateRange.start}`;
    if (dateRange?.end)
        params['date'] = params['date']
            ? `${params['date']}&date=le${dateRange.end}`
            : `le${dateRange.end}`;
    return fhirBundle('Observation', params, count);
}
export async function getMedicationRequests(patientId, status = 'active') {
    return fhirBundle('MedicationRequest', {
        patient: patientId,
        status,
        _sort: '-authoredon',
        _count: '100',
    });
}
export async function getAppointments(patientId, count = 10) {
    const today = new Date().toISOString().split('T')[0];
    return fhirBundle('Appointment', {
        patient: patientId,
        status: 'booked,arrived,pending',
        date: `ge${today}`,
        _sort: 'date',
        _count: String(count),
    }, count);
}
export async function getCareTeams(patientId) {
    return fhirBundle('CareTeam', {
        patient: patientId,
        status: 'active',
    });
}
export async function getPractitioner(practitionerId) {
    return fhirGet(`Practitioner/${practitionerId}`);
}
export async function getDocumentReferences(patientId, count = 5) {
    return fhirBundle('DocumentReference', {
        patient: patientId,
        status: 'current',
        _sort: '-date',
        _count: String(count),
    }, count);
}
export async function getProcedures(patientId, dateRange) {
    const params = {
        patient: patientId,
        status: 'completed',
        _sort: '-date',
        _count: '100',
    };
    if (dateRange?.start)
        params['date'] = `ge${dateRange.start}`;
    if (dateRange?.end)
        params['date'] = `le${dateRange.end}`;
    return fhirBundle('Procedure', params);
}
export async function getConditions(patientId) {
    return fhirBundle('Condition', {
        patient: patientId,
        'clinical-status': 'active,recurrence,relapse',
        _sort: '-recorded-date',
        _count: '100',
    });
}
export async function getAllergyIntolerances(patientId) {
    return fhirBundle('AllergyIntolerance', {
        patient: patientId,
        _sort: '-date',
        _count: '100',
    });
}
/**
 * Fetch a Binary resource and return its decoded text content.
 * Used to retrieve clinical note bodies from DocumentReference.content.attachment.url
 */
export async function getBinaryText(binaryUrl) {
    // Binary URLs may be absolute (full URL) or relative (just the ID path)
    const url = binaryUrl.startsWith('http') ? binaryUrl : `${config.baseUrl}/${binaryUrl}`;
    const response = await http.get(url, {
        headers: { Accept: 'text/plain, text/html, application/xml, */*' },
        responseType: 'text',
    });
    return response.data;
}
//# sourceMappingURL=client.js.map
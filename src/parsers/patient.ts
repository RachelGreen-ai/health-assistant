import type { FhirPatient } from '../types/fhir.js';
import type { PatientSummary, EmergencyContact } from '../types/domain.js';

export function parsePatient(patient: FhirPatient): PatientSummary {
  // Official name (prefer 'official', fall back to first)
  const nameEntry = patient.name?.find(n => n.use === 'official') ?? patient.name?.[0];
  const given  = nameEntry?.given?.join(' ') ?? '';
  const family = nameEntry?.family ?? '';
  const name   = [given, family].filter(Boolean).join(' ') || 'Unknown';

  // MRN: Epic uses system URL containing 'MR' or 'MRN'
  const mrnEntry = patient.identifier?.find(id =>
    id.type?.coding?.some(c => c.code === 'MR' || c.code === 'MRN') ||
    id.system?.toLowerCase().includes('mrn') ||
    id.system?.toLowerCase().includes('medical-record')
  );
  const mrn = mrnEntry?.value ?? patient.identifier?.[0]?.value ?? 'N/A';

  // Emergency contacts
  const emergencyContacts: EmergencyContact[] = (patient.contact ?? []).map(c => {
    const rel = c.relationship?.[0]?.coding?.[0]?.display
             ?? c.relationship?.[0]?.text
             ?? 'Contact';
    const cName = c.name
      ? [c.name.given?.join(' '), c.name.family].filter(Boolean).join(' ')
      : 'Unknown';
    const phone = c.telecom?.find(t => t.system === 'phone')?.value;
    return { name: cName, relationship: rel, phone };
  });

  return {
    name,
    dateOfBirth: patient.birthDate ?? 'Unknown',
    mrn,
    gender: patient.gender ?? 'unknown',
    activeConditions: [],  // filled in by patient-summary tool after calling condition parser
    allergySummary: [],    // filled in by patient-summary tool after calling allergy parser
    emergencyContacts,
  };
}

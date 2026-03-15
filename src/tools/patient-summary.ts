import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getPatient, getConditions, getAllergyIntolerances } from '../fhir/client.js';
import { parsePatient } from '../parsers/patient.js';
import { parseConditions } from '../parsers/condition.js';
import { parseAllergies, allergyOneLiner } from '../parsers/allergy.js';

export const patientSummaryInputSchema = z.object({});

export async function patientSummaryHandler(): Promise<string> {
  const patientId = getPatientId();

  const [fhirPatient, conditions, allergies] = await Promise.all([
    getPatient(patientId),
    getConditions(patientId),
    getAllergyIntolerances(patientId),
  ]);

  const summary   = parsePatient(fhirPatient);
  const conds     = parseConditions(conditions);
  const allergyProfile = parseAllergies(allergies);
  const allAllergyItems = [
    ...allergyProfile.drugAllergies,
    ...allergyProfile.foodAllergies,
    ...allergyProfile.environmentalAllergies,
    ...allergyProfile.other,
  ];

  summary.activeConditions = conds;
  summary.allergySummary   = allAllergyItems.map(allergyOneLiner);

  const lines: string[] = [
    `## Patient Summary`,
    `**Name:** ${summary.name}`,
    `**Date of Birth:** ${summary.dateOfBirth}`,
    `**MRN:** ${summary.mrn}`,
    `**Gender:** ${summary.gender}`,
    '',
  ];

  // Conditions
  if (summary.activeConditions.length > 0) {
    lines.push('### Active Conditions');
    for (const c of summary.activeConditions) {
      const icd  = c.icdCode ? ` [${c.icdCode}]` : '';
      const onset = c.onsetDate ? ` (since ${c.onsetDate.slice(0, 10)})` : '';
      lines.push(`- ${c.display}${icd}${onset}`);
    }
    lines.push('');
  } else {
    lines.push('### Active Conditions\nNone recorded.\n');
  }

  // Allergies
  if (summary.allergySummary.length > 0) {
    lines.push('### Known Allergies');
    for (const a of summary.allergySummary) lines.push(`- ${a}`);
    lines.push('');
  } else {
    lines.push('### Known Allergies\nNone recorded (or not yet loaded into system).\n');
  }

  // Emergency contacts
  if (summary.emergencyContacts.length > 0) {
    lines.push('### Emergency Contacts');
    for (const ec of summary.emergencyContacts) {
      const phone = ec.phone ? ` — ${ec.phone}` : '';
      lines.push(`- ${ec.name} (${ec.relationship})${phone}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

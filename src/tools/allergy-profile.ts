import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getAllergyIntolerances } from '../fhir/client.js';
import { parseAllergies } from '../parsers/allergy.js';
import type { AllergyItem } from '../types/domain.js';

export const allergyProfileInputSchema = z.object({});

function severityIcon(s: string): string {
  if (s === 'severe')   return '🔴';
  if (s === 'moderate') return '🟡';
  if (s === 'mild')     return '🟢';
  return '⚪';
}

function formatAllergyList(items: AllergyItem[]): string {
  if (items.length === 0) return '_None on record_';
  return items.map(a => {
    const rxns = a.reactions.length > 0 ? ` → ${a.reactions.join(', ')}` : '';
    return `- ${severityIcon(a.severity)} **${a.substance}**${rxns}`;
  }).join('\n');
}

export async function allergyProfileHandler(): Promise<string> {
  const patientId = getPatientId();
  const raw       = await getAllergyIntolerances(patientId);

  if (raw.length === 0) {
    return 'No allergy information found. This may mean no allergies are on record, or they have not yet been entered into the system.';
  }

  const profile = parseAllergies(raw);
  const lines   = ['## Allergy Profile\n'];

  lines.push('### Drug / Medication Allergies');
  lines.push(formatAllergyList(profile.drugAllergies));
  lines.push('');

  lines.push('### Food Allergies');
  lines.push(formatAllergyList(profile.foodAllergies));
  lines.push('');

  lines.push('### Environmental Allergies');
  lines.push(formatAllergyList(profile.environmentalAllergies));
  lines.push('');

  if (profile.other.length > 0) {
    lines.push('### Other');
    lines.push(formatAllergyList(profile.other));
    lines.push('');
  }

  lines.push('_🔴 Severe &nbsp; 🟡 Moderate &nbsp; 🟢 Mild &nbsp; ⚪ Unknown severity_');
  lines.push('');
  lines.push('_Always inform every provider and pharmacist of your allergies before receiving any new medication._');

  return lines.join('\n');
}

import type { FhirAllergyIntolerance } from '../types/fhir.js';
import type { AllergyProfile, AllergyItem, AllergySeverity } from '../types/domain.js';

function mapSeverity(s?: string): AllergySeverity {
  if (!s) return 'unknown';
  const lower = s.toLowerCase();
  if (lower === 'mild')     return 'mild';
  if (lower === 'moderate') return 'moderate';
  if (lower === 'severe')   return 'severe';
  return 'unknown';
}

function mapCriticalityToSeverity(criticality?: string): AllergySeverity {
  if (!criticality) return 'unknown';
  if (criticality === 'high')   return 'severe';
  if (criticality === 'low')    return 'mild';
  return 'unknown';
}

export function parseAllergies(allergies: FhirAllergyIntolerance[]): AllergyProfile {
  const profile: AllergyProfile = {
    drugAllergies:          [],
    foodAllergies:          [],
    environmentalAllergies: [],
    other:                  [],
  };

  for (const a of allergies) {
    const substance = a.code?.text
      ?? a.code?.coding?.[0]?.display
      ?? 'Unknown substance';

    const reactions: string[] = (a.reaction ?? []).flatMap(r =>
      (r.manifestation ?? []).map(m => m.text ?? m.coding?.[0]?.display ?? 'reaction')
    );

    // Severity: take worst across all reactions, or fall back to criticality
    const reactionSeverities = (a.reaction ?? []).map(r => mapSeverity(r.severity));
    const severityRank = (s: AllergySeverity) =>
      ({ severe: 3, moderate: 2, mild: 1, unknown: 0 })[s];
    const worstReaction = reactionSeverities.sort((a, b) => severityRank(b) - severityRank(a))[0];
    const severity = worstReaction && worstReaction !== 'unknown'
      ? worstReaction
      : mapCriticalityToSeverity(a.criticality);

    const status = a.clinicalStatus?.coding?.[0]?.code
      ?? a.clinicalStatus?.text
      ?? 'active';

    const item: AllergyItem = { substance, reactions, severity, status };

    const categories = a.category ?? ['medication'];
    if (categories.includes('food'))        profile.foodAllergies.push(item);
    else if (categories.includes('environment')) profile.environmentalAllergies.push(item);
    else if (categories.includes('medication'))  profile.drugAllergies.push(item);
    else                                         profile.other.push(item);
  }

  return profile;
}

/** Short one-liner summaries for use in PatientSummary.allergySummary */
export function allergyOneLiner(item: AllergyItem): string {
  const rxns = item.reactions.length > 0 ? ` (${item.reactions.join(', ')})` : '';
  const sev  = item.severity !== 'unknown' ? ` — ${item.severity}` : '';
  return `${item.substance}${rxns}${sev}`;
}

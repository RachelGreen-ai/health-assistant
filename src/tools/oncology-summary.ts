import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import {
  getPatient,
  getConditions,
  getMedicationRequests,
  getObservations,
  getAppointments,
} from '../fhir/client.js';
import { parsePatient } from '../parsers/patient.js';
import { parseConditions } from '../parsers/condition.js';
import { parseMedicationRegimen } from '../parsers/medication.js';
import { parseLatestLabs } from '../parsers/observation.js';
import { parseAppointments } from '../parsers/appointment.js';
import { PANEL_CODES } from '../constants/loinc.js';
import { config } from '../config.js';

export const oncologySummaryInputSchema = z.object({});

export async function oncologySummaryHandler(): Promise<string> {
  const patientId = getPatientId();
  const last30Days = {
    start: new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0],
    end:   new Date().toISOString().split('T')[0],
  };

  // Fan-out: fetch everything in parallel
  const [fhirPatient, conditions, medRequests, observations, fhirAppts] = await Promise.all([
    getPatient(patientId),
    getConditions(patientId),
    getMedicationRequests(patientId),
    getObservations(
      patientId,
      [...PANEL_CODES.CBC, ...PANEL_CODES.TUMOR_MARKERS],
      last30Days,
      60
    ),
    getAppointments(patientId, 1),
  ]);

  const patient   = parsePatient(fhirPatient);
  const conds     = parseConditions(conditions);
  const regimen   = parseMedicationRegimen(medRequests);
  const recentLabs = parseLatestLabs(observations);
  const appts     = parseAppointments(fhirAppts, config.distanceThresholdMiles);

  // Primary diagnosis: first condition (usually primary cancer)
  const primaryDx = conds[0];

  const lines = [
    `## Oncology / Care Summary`,
    `_As of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}_`,
    '',
    `**Patient:** ${patient.name}  |  **DOB:** ${patient.dateOfBirth}  |  **MRN:** ${patient.mrn}`,
    '',
  ];

  // Primary diagnosis
  if (primaryDx) {
    const icd   = primaryDx.icdCode ? ` [${primaryDx.icdCode}]` : '';
    const onset = primaryDx.onsetDate ? ` (since ${primaryDx.onsetDate.slice(0, 10)})` : '';
    lines.push(`### Primary Diagnosis`);
    lines.push(`${primaryDx.display}${icd}${onset}`);
    lines.push('');
  }

  // Active chemo
  if (regimen.chemoAgents.length > 0) {
    lines.push('### Current Treatment Protocol');
    for (const m of regimen.chemoAgents) {
      lines.push(`- **${m.name}** — ${m.dose} ${m.frequency}`.trim());
    }
    lines.push('');
  }

  // Key recent labs
  if (recentLabs.length > 0) {
    lines.push('### Recent Key Labs (last 30 days)');
    for (const r of recentLabs) {
      const val   = typeof r.value === 'number' ? r.value.toFixed(2) : r.value;
      const flag  = r.interpretation === 'critical-high' ? ' 🔴 CRITICAL HIGH'
                  : r.interpretation === 'critical-low'  ? ' 🔴 CRITICAL LOW'
                  : r.interpretation === 'high'           ? ' ↑'
                  : r.interpretation === 'low'            ? ' ↓'
                  : '';
      lines.push(`- **${r.display}:** ${val} ${r.unit}${flag} _(${r.effectiveDate.slice(0, 10)})_`);
    }
    lines.push('');
  } else {
    lines.push('### Recent Key Labs\n_No CBC or tumor marker results found in the last 30 days._\n');
  }

  // Next appointment
  const next = appts[0];
  if (next) {
    lines.push('### Next Appointment');
    lines.push(`${next.date} at ${next.time}`);
    lines.push(`${next.provider}${next.specialty ? ` (${next.specialty})` : ''} — ${next.location}`);
    if (next.distanceFlag) {
      lines.push('> 📞 This location may require significant travel. Consider calling to ask about phone/video options.');
    }
    lines.push('');
  } else {
    lines.push('### Next Appointment\n_No upcoming appointments found._\n');
  }

  return lines.join('\n');
}

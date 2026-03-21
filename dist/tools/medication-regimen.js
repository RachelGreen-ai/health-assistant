import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getMedicationRequests } from '../fhir/client.js';
import { parseMedicationRegimen } from '../parsers/medication.js';
export const medicationRegimenInputSchema = z.object({});
function formatMedList(items) {
    if (items.length === 0)
        return '_None_';
    return items.map(m => {
        const parts = [`**${m.name}**`, m.dose, m.frequency].filter(Boolean);
        const meta = [m.route, m.prescriber ? `Rx: ${m.prescriber}` : ''].filter(Boolean);
        return `- ${parts.join(' — ')}${meta.length ? `\n  _${meta.join(' | ')}_` : ''}`;
    }).join('\n');
}
export async function medicationRegimenHandler() {
    const patientId = getPatientId();
    const requests = await getMedicationRequests(patientId);
    if (requests.length === 0) {
        return 'No active medications found in the record.';
    }
    const regimen = parseMedicationRegimen(requests);
    const lines = ['## Current Medication Regimen\n'];
    if (regimen.chemoAgents.length > 0) {
        lines.push('### Primary / Specialty Medications');
        lines.push(formatMedList(regimen.chemoAgents));
        lines.push('');
    }
    if (regimen.supportive.length > 0) {
        lines.push('### Supportive Medications');
        lines.push(formatMedList(regimen.supportive));
        lines.push('');
    }
    if (regimen.prophylaxis.length > 0) {
        lines.push('### Preventive Medications');
        lines.push(formatMedList(regimen.prophylaxis));
        lines.push('');
    }
    if (regimen.prn.length > 0) {
        lines.push('### As-Needed (PRN)');
        lines.push(formatMedList(regimen.prn));
        lines.push('');
    }
    if (regimen.other.length > 0) {
        lines.push('### Other Active Medications');
        lines.push(formatMedList(regimen.other));
        lines.push('');
    }
    lines.push('_Always confirm with your care team before adjusting any medications._');
    return lines.join('\n');
}
//# sourceMappingURL=medication-regimen.js.map
import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getCareTeams, getPractitioner } from '../fhir/client.js';
import { parseCareTeam } from '../parsers/care-team.js';
export const careTeamInputSchema = z.object({});
export async function careTeamHandler() {
    const patientId = getPatientId();
    const careTeams = await getCareTeams(patientId);
    if (careTeams.length === 0) {
        return 'No care team information found. Your care team details may not yet be loaded into this system.';
    }
    // Collect unique practitioner IDs referenced across all care teams
    const practitionerIds = new Set();
    for (const team of careTeams) {
        for (const p of team.participant ?? []) {
            const ref = p.member?.reference ?? '';
            if (ref.startsWith('Practitioner/')) {
                practitionerIds.add(ref.split('/')[1]);
            }
        }
    }
    // Fetch practitioners in parallel
    const practitioners = [];
    await Promise.allSettled([...practitionerIds].map(async (id) => {
        try {
            const p = await getPractitioner(id);
            practitioners.push(p);
        }
        catch {
            // If we can't fetch a practitioner, skip gracefully
        }
    }));
    const members = parseCareTeam(careTeams, practitioners);
    const lines = ['## Your Care Team\n'];
    for (const m of members) {
        lines.push(`### ${m.role}`);
        lines.push(`**${m.name}**`);
        if (m.specialty)
            lines.push(`_${m.specialty}_`);
        if (m.phone)
            lines.push(`📞 ${m.phone}`);
        if (m.email)
            lines.push(`✉️ ${m.email}`);
        lines.push('');
    }
    if (members.length === 0) {
        lines.push('Care team members are listed but contact details are not yet available.');
    }
    return lines.join('\n');
}
//# sourceMappingURL=care-team.js.map
import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getProcedures } from '../fhir/client.js';
import { parseProcedures } from '../parsers/procedure.js';
export const treatmentHistoryInputSchema = z.object({
    startDate: z
        .string()
        .optional()
        .describe('Start date in ISO 8601 format (e.g. 2023-01-01). Defaults to 2 years ago.'),
    endDate: z
        .string()
        .optional()
        .describe('End date in ISO 8601 format. Defaults to today.'),
});
const TYPE_LABELS = {
    transplant: '🔬 Transplant / CAR-T',
    chemo_cycle: '💊 Chemotherapy',
    radiation: '⚡ Radiation',
    infusion: '💉 Infusion',
    surgery: '🏥 Surgery',
    procedure: '📋 Procedure',
    other: '📋 Other',
};
export async function treatmentHistoryHandler(input) {
    const patientId = getPatientId();
    const endDate = input.endDate ?? new Date().toISOString().split('T')[0];
    const startDate = input.startDate ?? new Date(Date.now() - 2 * 365 * 86400_000).toISOString().split('T')[0];
    const procedures = await getProcedures(patientId, { start: startDate, end: endDate });
    if (procedures.length === 0) {
        return `No procedures found between ${startDate} and ${endDate}.`;
    }
    const events = parseProcedures(procedures);
    const lines = [`## Treatment History (${startDate} to ${endDate})\n`];
    for (const ev of events) {
        const label = TYPE_LABELS[ev.type] ?? '📋 Procedure';
        const date = ev.date.slice(0, 10);
        const provider = ev.provider ? ` — ${ev.provider}` : '';
        const location = ev.location ? ` @ ${ev.location}` : '';
        lines.push(`- **${date}** ${label}: ${ev.description}${provider}${location}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=treatment-history.js.map
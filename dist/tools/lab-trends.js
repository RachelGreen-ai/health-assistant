import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getObservations } from '../fhir/client.js';
import { parseLabTrends } from '../parsers/observation.js';
import { PANEL_CODES } from '../constants/loinc.js';
import { NoDataError } from '../types/domain.js';
export const labTrendsInputSchema = z.object({
    panels: z
        .string()
        .describe('Comma-separated list of lab panels: CBC, CMP, TUMOR_MARKERS. Example: "CBC,CMP"'),
    startDate: z
        .string()
        .optional()
        .describe('Start date in ISO 8601 format (e.g. 2024-01-01). Defaults to 90 days ago.'),
    endDate: z
        .string()
        .optional()
        .describe('End date in ISO 8601 format. Defaults to today.'),
    maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('Maximum number of results per analyte'),
});
function interpretIcon(r) {
    switch (r.interpretation) {
        case 'critical-high': return '🔴 CRITICAL HIGH';
        case 'critical-low': return '🔴 CRITICAL LOW';
        case 'high': return '↑';
        case 'low': return '↓';
        case 'normal': return '✓';
        default: return '';
    }
}
export async function labTrendsHandler(raw) {
    const VALID = ['CBC', 'CMP', 'TUMOR_MARKERS'];
    const panels = raw.panels
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(p => VALID.includes(p));
    if (panels.length === 0) {
        return 'Please specify at least one panel: CBC, CMP, or TUMOR_MARKERS.';
    }
    const input = { ...raw, panels };
    const patientId = getPatientId();
    // Default date range: last 90 days
    const endDate = input.endDate ?? new Date().toISOString().split('T')[0];
    const startDate = input.startDate ?? new Date(Date.now() - 90 * 86400_000).toISOString().split('T')[0];
    const lines = [`## Lab Trends (${startDate} to ${endDate})\n`];
    for (const panel of input.panels) {
        const codes = PANEL_CODES[panel];
        let observations;
        try {
            observations = await getObservations(patientId, codes, { start: startDate, end: endDate }, input.maxResults * codes.length);
        }
        catch (err) {
            lines.push(`### ${panel}\n_Error fetching data: ${err instanceof Error ? err.message : 'unknown'}_\n`);
            continue;
        }
        let trends;
        try {
            trends = parseLabTrends(observations, panel);
        }
        catch (err) {
            if (err instanceof NoDataError) {
                lines.push(`### ${panel}\n_${err.message}_\n`);
                continue;
            }
            throw err;
        }
        lines.push(`### ${panel}`);
        const analyteNames = Object.keys(trends.results);
        if (analyteNames.length === 0) {
            lines.push('_No results in this period._\n');
            continue;
        }
        for (const analyte of analyteNames) {
            const series = trends.results[analyte].slice(0, input.maxResults);
            lines.push(`\n**${analyte}**`);
            const ref = series[0]?.referenceRange ? ` (ref: ${series[0].referenceRange})` : '';
            lines.push(`_Unit: ${series[0]?.unit || 'N/A'}${ref}_`);
            for (const r of series) {
                const icon = interpretIcon(r);
                const date = r.effectiveDate.slice(0, 10);
                const value = typeof r.value === 'number' ? r.value.toFixed(2) : r.value;
                lines.push(`  ${date}: **${value}** ${icon}`);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=lab-trends.js.map
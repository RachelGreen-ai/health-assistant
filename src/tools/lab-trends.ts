import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getObservations } from '../fhir/client.js';
import { parseLabTrends } from '../parsers/observation.js';
import { PANEL_CODES, type LabPanel } from '../constants/loinc.js';
import { NoDataError } from '../types/domain.js';
import type { LabResult } from '../types/domain.js';

export const labTrendsInputSchema = z.object({
  panels: z
    .array(z.enum(['CBC', 'CMP', 'TUMOR_MARKERS']))
    .min(1)
    .describe('Which lab panels to retrieve'),
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

type Input = z.infer<typeof labTrendsInputSchema>;

function interpretIcon(r: LabResult): string {
  switch (r.interpretation) {
    case 'critical-high': return '🔴 CRITICAL HIGH';
    case 'critical-low':  return '🔴 CRITICAL LOW';
    case 'high':          return '↑';
    case 'low':           return '↓';
    case 'normal':        return '✓';
    default:              return '';
  }
}

export async function labTrendsHandler(input: Input): Promise<string> {
  const patientId = getPatientId();

  // Default date range: last 90 days
  const endDate   = input.endDate   ?? new Date().toISOString().split('T')[0];
  const startDate = input.startDate ?? new Date(Date.now() - 90 * 86400_000).toISOString().split('T')[0];

  const lines: string[] = [`## Lab Trends (${startDate} to ${endDate})\n`];

  for (const panel of input.panels as LabPanel[]) {
    const codes = PANEL_CODES[panel];
    let observations;
    try {
      observations = await getObservations(patientId, codes, { start: startDate, end: endDate }, input.maxResults * codes.length);
    } catch (err) {
      lines.push(`### ${panel}\n_Error fetching data: ${err instanceof Error ? err.message : 'unknown'}_\n`);
      continue;
    }

    let trends;
    try {
      trends = parseLabTrends(observations, panel);
    } catch (err) {
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
        const icon  = interpretIcon(r);
        const date  = r.effectiveDate.slice(0, 10);
        const value = typeof r.value === 'number' ? r.value.toFixed(2) : r.value;
        lines.push(`  ${date}: **${value}** ${icon}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

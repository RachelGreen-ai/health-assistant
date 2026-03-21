import { LOINC_DISPLAY } from '../constants/loinc.js';
import { NoDataError } from '../types/domain.js';
function mapInterpretation(codes) {
    const c = codes.map(s => s.toUpperCase());
    if (c.some(s => s === 'HH' || s === 'LL' || s === 'AA'))
        return c.includes('HH') ? 'critical-high' : 'critical-low';
    if (c.some(s => s === 'H'))
        return 'high';
    if (c.some(s => s === 'L'))
        return 'low';
    if (c.some(s => s === 'N' || s === 'NORMAL'))
        return 'normal';
    return 'unknown';
}
export function parseLabTrends(observations, panelName) {
    if (!observations.length) {
        throw new NoDataError(`No ${panelName} lab results found for the requested period.`);
    }
    // Group by LOINC code
    const byCode = {};
    for (const obs of observations) {
        const coding = obs.code?.coding ?? [];
        // Find LOINC code (system contains 'loinc')
        const loincCoding = coding.find(c => c.system?.toLowerCase().includes('loinc')) ?? coding[0];
        const code = loincCoding?.code ?? 'unknown';
        const display = LOINC_DISPLAY[code] ?? loincCoding?.display ?? obs.code?.text ?? code;
        const effectiveDate = obs.effectiveDateTime
            ?? obs.effectivePeriod?.start
            ?? obs.issued
            ?? 'Unknown';
        // Value
        let value = 'N/A';
        let unit = '';
        if (obs.valueQuantity?.value !== undefined) {
            value = obs.valueQuantity.value;
            unit = obs.valueQuantity.unit ?? obs.valueQuantity.code ?? '';
        }
        else if (obs.valueString) {
            value = obs.valueString;
        }
        else if (obs.valueCodeableConcept?.text) {
            value = obs.valueCodeableConcept.text;
        }
        // Reference range
        const refRange = obs.referenceRange?.[0];
        let referenceRange;
        if (refRange?.text) {
            referenceRange = refRange.text;
        }
        else if (refRange?.low || refRange?.high) {
            const lo = refRange.low ? `${refRange.low.value} ${refRange.low.unit ?? ''}`.trim() : '';
            const hi = refRange.high ? `${refRange.high.value} ${refRange.high.unit ?? ''}`.trim() : '';
            if (lo && hi)
                referenceRange = `${lo} – ${hi}`;
            else if (lo)
                referenceRange = `≥ ${lo}`;
            else if (hi)
                referenceRange = `≤ ${hi}`;
        }
        // Interpretation
        const interpCodes = (obs.interpretation ?? [])
            .flatMap(i => i.coding ?? [])
            .map(c => c.code ?? '');
        const interpretation = mapInterpretation(interpCodes);
        const result = { loincCode: code, display, value, unit, referenceRange, interpretation, effectiveDate };
        if (!byCode[display])
            byCode[display] = [];
        byCode[display].push(result);
    }
    // Sort each series newest-first
    for (const key of Object.keys(byCode)) {
        byCode[key].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    }
    return { panel: panelName, results: byCode };
}
/** Return only the most recent result for each analyte (for the oncology summary). */
export function parseLatestLabs(observations) {
    if (!observations.length)
        return [];
    const trends = parseLabTrends(observations, 'recent');
    return Object.values(trends.results).map(series => series[0]).filter(Boolean);
}
//# sourceMappingURL=observation.js.map
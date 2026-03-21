const ACTIVE_STATUSES = new Set(['active', 'recurrence', 'relapse']);
export function parseConditions(conditions) {
    return conditions
        .filter(c => {
        const status = c.clinicalStatus?.coding?.[0]?.code
            ?? c.clinicalStatus?.text
            ?? 'active';
        return ACTIVE_STATUSES.has(status.toLowerCase());
    })
        .map(c => {
        const display = c.code?.text
            ?? c.code?.coding?.[0]?.display
            ?? 'Unknown condition';
        // ICD-10 code: system URL contains 'icd'
        const icdCoding = c.code?.coding?.find(cod => cod.system?.toLowerCase().includes('icd'));
        const icdCode = icdCoding?.code;
        const onsetDate = c.onsetDateTime ?? c.onsetPeriod?.start ?? c.recordedDate;
        const clinicalStatus = c.clinicalStatus?.coding?.[0]?.code
            ?? c.clinicalStatus?.text
            ?? 'active';
        return { display, icdCode, onsetDate, clinicalStatus };
    });
}
//# sourceMappingURL=condition.js.map
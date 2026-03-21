const SURGERY_KEYWORDS = ['surgery', 'resection', 'excision', 'transplant', 'biopsy', 'implant', 'repair', 'removal'];
const INFUSION_KEYWORDS = ['infusion', 'infuse', 'injection', 'administration', 'iv ', 'intravenous'];
const CHEMO_KEYWORDS = ['chemotherapy', 'chemo', 'cytotoxic', ...['cyclophosphamide', 'carboplatin', 'paclitaxel', 'rituximab', 'doxorubicin']];
const RADIATION_KEYWORDS = ['radiation', 'radiotherapy', 'radiosurgery', 'gamma knife', 'sbrt', 'imrt'];
const TRANSPLANT_KEYWORDS = ['transplant', 'car-t', 'cart', 'stem cell', 'bone marrow', 'hsct'];
function classifyProcedure(display) {
    const d = display.toLowerCase();
    if (TRANSPLANT_KEYWORDS.some(k => d.includes(k)))
        return 'transplant';
    if (CHEMO_KEYWORDS.some(k => d.includes(k)))
        return 'chemo_cycle';
    if (RADIATION_KEYWORDS.some(k => d.includes(k)))
        return 'radiation';
    if (INFUSION_KEYWORDS.some(k => d.includes(k)))
        return 'infusion';
    if (SURGERY_KEYWORDS.some(k => d.includes(k)))
        return 'surgery';
    return 'procedure';
}
export function parseProcedures(procedures) {
    const events = procedures.map(proc => {
        const description = proc.code?.text
            ?? proc.code?.coding?.[0]?.display
            ?? 'Procedure';
        const date = proc.performedDateTime
            ?? proc.performedPeriod?.start
            ?? 'Unknown date';
        const provider = proc.performer?.[0]?.actor?.display;
        const location = proc.location?.display;
        const eventType = classifyProcedure(description);
        return { type: eventType, description, date, provider, location };
    });
    // Sort descending by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
}
//# sourceMappingURL=procedure.js.map
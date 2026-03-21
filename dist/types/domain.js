/**
 * Clean domain objects returned by parsers and ultimately sent to the AI.
 * These are deliberately free of FHIR-isms — the AI works with these, not raw FHIR.
 */
// ── Errors ─────────────────────────────────────────────────────────────────────
export class NoDataError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoDataError';
    }
}
//# sourceMappingURL=domain.js.map
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { authorizeInputSchema, authorizeHandler } from './tools/authorize.js';
import { patientSummaryInputSchema, patientSummaryHandler } from './tools/patient-summary.js';
import { labTrendsInputSchema, labTrendsHandler } from './tools/lab-trends.js';
import { medicationRegimenInputSchema, medicationRegimenHandler } from './tools/medication-regimen.js';
import { appointmentsInputSchema, appointmentsHandler } from './tools/appointments.js';
import { careTeamInputSchema, careTeamHandler } from './tools/care-team.js';
import { clinicalNotesInputSchema, clinicalNotesHandler } from './tools/clinical-notes.js';
import { treatmentHistoryInputSchema, treatmentHistoryHandler } from './tools/treatment-history.js';
import { allergyProfileInputSchema, allergyProfileHandler } from './tools/allergy-profile.js';
export function createServer() {
    const server = new McpServer({
        name: 'epic-fhir-mcp',
        version: '0.1.0',
    });
    // ── Auth ──────────────────────────────────────────────────────────────────────
    server.tool('authorize', 'Connect to Epic MyChart via SMART-on-FHIR OAuth 2.0. Opens a browser window for the patient to log in. Must be run before any other tool.', authorizeInputSchema.shape, async () => ({
        content: [{ type: 'text', text: await wrapHandler(authorizeHandler) }],
    }));
    // ── Patient ───────────────────────────────────────────────────────────────────
    server.tool('get_patient_summary', 'Get patient demographics, active diagnoses (with ICD codes), known allergies, and emergency contacts.', patientSummaryInputSchema.shape, async () => ({
        content: [{ type: 'text', text: await wrapHandler(patientSummaryHandler) }],
    }));
    // ── Labs ──────────────────────────────────────────────────────────────────────
    server.tool('get_lab_trends', 'Get time-series lab results. Panels: CBC (WBC, ANC, Hgb, Platelets), CMP (metabolic panel), TUMOR_MARKERS (CEA, CA-125, PSA, AFP, etc.), or leave blank for all recent labs. Returns values newest-first with reference ranges.', labTrendsInputSchema.shape, async (input) => ({
        content: [{ type: 'text', text: await wrapHandler(() => labTrendsHandler(input)) }],
    }));
    // ── Medications ───────────────────────────────────────────────────────────────
    server.tool('get_medication_regimen', 'Get all active medications grouped by category: primary/specialty medications, supportive medications, preventive medications, as-needed (PRN), and other.', medicationRegimenInputSchema.shape, async () => ({
        content: [{ type: 'text', text: await wrapHandler(medicationRegimenHandler) }],
    }));
    // ── Appointments ──────────────────────────────────────────────────────────────
    server.tool('get_upcoming_appointments', 'Get upcoming scheduled appointments with date, time, provider, location, and a flag if the location may require significant travel (suggesting a phone/video option).', appointmentsInputSchema.shape, async (input) => ({
        content: [{ type: 'text', text: await wrapHandler(() => appointmentsHandler(input)) }],
    }));
    // ── Care Team ─────────────────────────────────────────────────────────────────
    server.tool('get_care_team', 'Get the patient\'s care team members with their roles, names, specialties, and contact information (phone, email).', careTeamInputSchema.shape, async () => ({
        content: [{ type: 'text', text: await wrapHandler(careTeamHandler) }],
    }));
    // ── Clinical Notes ────────────────────────────────────────────────────────────
    server.tool('get_clinical_notes', 'Get recent clinical notes (visit summaries, discharge summaries, procedure notes) with markup stripped. Use count to control how many notes are returned.', clinicalNotesInputSchema.shape, async (input) => ({
        content: [{ type: 'text', text: await wrapHandler(() => clinicalNotesHandler(input)) }],
    }));
    // ── Treatment History ─────────────────────────────────────────────────────────
    server.tool('get_treatment_history', 'Get past procedures and treatments: surgeries, infusions, therapies, and other procedures. Optionally filter by date range.', treatmentHistoryInputSchema.shape, async (input) => ({
        content: [{ type: 'text', text: await wrapHandler(() => treatmentHistoryHandler(input)) }],
    }));
    // ── Allergy Profile ───────────────────────────────────────────────────────────
    server.tool('get_allergy_profile', 'Get the patient\'s complete allergy profile grouped by category (drug, food, environmental) with reaction details and severity.', allergyProfileInputSchema.shape, async () => ({
        content: [{ type: 'text', text: await wrapHandler(allergyProfileHandler) }],
    }));
    return server;
}
/**
 * Wrap a tool handler so any error is converted to a user-readable message
 * rather than crashing the MCP server.
 */
async function wrapHandler(fn) {
    try {
        return await fn();
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[epic-fhir-mcp] Tool error:', msg);
        return `Error: ${msg}`;
    }
}
//# sourceMappingURL=server.js.map
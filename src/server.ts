import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { authorizeInputSchema, authorizeHandler }               from './tools/authorize.js';
import { patientSummaryInputSchema, patientSummaryHandler }     from './tools/patient-summary.js';
import { labTrendsInputSchema, labTrendsHandler }               from './tools/lab-trends.js';
import { medicationRegimenInputSchema, medicationRegimenHandler } from './tools/medication-regimen.js';
import { appointmentsInputSchema, appointmentsHandler }         from './tools/appointments.js';
import { careTeamInputSchema, careTeamHandler }                 from './tools/care-team.js';
import { clinicalNotesInputSchema, clinicalNotesHandler }       from './tools/clinical-notes.js';
import { treatmentHistoryInputSchema, treatmentHistoryHandler } from './tools/treatment-history.js';
import { allergyProfileInputSchema, allergyProfileHandler }     from './tools/allergy-profile.js';
import { oncologySummaryInputSchema, oncologySummaryHandler }   from './tools/oncology-summary.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name:    'epic-fhir-mcp',
    version: '0.1.0',
  });

  // ── Auth ──────────────────────────────────────────────────────────────────────
  server.tool(
    'authorize',
    'Connect to Epic MyChart via SMART-on-FHIR OAuth 2.0. Opens a browser window for the patient to log in. Must be run before any other tool.',
    authorizeInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(authorizeHandler) }],
    })
  );

  // ── Patient ───────────────────────────────────────────────────────────────────
  server.tool(
    'get_patient_summary',
    'Get patient demographics, active diagnoses (with ICD codes), known allergies, and emergency contacts.',
    patientSummaryInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(patientSummaryHandler) }],
    })
  );

  // ── Labs ──────────────────────────────────────────────────────────────────────
  server.tool(
    'get_lab_trends',
    'Get time-series lab results for one or more panels: CBC (WBC, ANC, Hgb, Platelets), CMP (metabolic panel), or TUMOR_MARKERS (CEA, CA-125, PSA, AFP, etc.). Returns values sorted newest-first with reference ranges and interpretation flags.',
    labTrendsInputSchema.shape,
    async (input) => ({
      content: [{ type: 'text', text: await wrapHandler(() => labTrendsHandler(input as Parameters<typeof labTrendsHandler>[0])) }],
    })
  );

  // ── Medications ───────────────────────────────────────────────────────────────
  server.tool(
    'get_medication_regimen',
    'Get all active medications grouped by category: chemotherapy/immunotherapy agents, supportive medications (antiemetics, growth factors), prophylaxis (antivirals, antifungals), PRN (as-needed), and other.',
    medicationRegimenInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(medicationRegimenHandler) }],
    })
  );

  // ── Appointments ──────────────────────────────────────────────────────────────
  server.tool(
    'get_upcoming_appointments',
    'Get upcoming scheduled appointments with date, time, provider, location, and a flag if the location may require significant travel (suggesting a phone/video option).',
    appointmentsInputSchema.shape,
    async (input) => ({
      content: [{ type: 'text', text: await wrapHandler(() => appointmentsHandler(input as Parameters<typeof appointmentsHandler>[0])) }],
    })
  );

  // ── Care Team ─────────────────────────────────────────────────────────────────
  server.tool(
    'get_care_team',
    'Get the patient\'s care team members with their roles, names, specialties, and contact information (phone, email).',
    careTeamInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(careTeamHandler) }],
    })
  );

  // ── Clinical Notes ────────────────────────────────────────────────────────────
  server.tool(
    'get_clinical_notes',
    'Get recent clinical notes (visit summaries, discharge summaries, procedure notes) with markup stripped. Use count to control how many notes are returned.',
    clinicalNotesInputSchema.shape,
    async (input) => ({
      content: [{ type: 'text', text: await wrapHandler(() => clinicalNotesHandler(input as Parameters<typeof clinicalNotesHandler>[0])) }],
    })
  );

  // ── Treatment History ─────────────────────────────────────────────────────────
  server.tool(
    'get_treatment_history',
    'Get past procedures and treatments: surgeries, chemotherapy cycles, CAR-T/stem cell transplants, radiation, and infusions. Optionally filter by date range.',
    treatmentHistoryInputSchema.shape,
    async (input) => ({
      content: [{ type: 'text', text: await wrapHandler(() => treatmentHistoryHandler(input as Parameters<typeof treatmentHistoryHandler>[0])) }],
    })
  );

  // ── Allergy Profile ───────────────────────────────────────────────────────────
  server.tool(
    'get_allergy_profile',
    'Get the patient\'s complete allergy profile grouped by category (drug, food, environmental) with reaction details and severity.',
    allergyProfileInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(allergyProfileHandler) }],
    })
  );

  // ── Oncology Summary ──────────────────────────────────────────────────────────
  server.tool(
    'get_oncology_summary',
    'Get a comprehensive one-call oncology overview: primary diagnosis, current treatment protocol, recent CBC and tumor marker labs (last 30 days), and next appointment. Ideal as the first call when starting a health conversation.',
    oncologySummaryInputSchema.shape,
    async () => ({
      content: [{ type: 'text', text: await wrapHandler(oncologySummaryHandler) }],
    })
  );

  return server;
}

/**
 * Wrap a tool handler so any error is converted to a user-readable message
 * rather than crashing the MCP server.
 */
async function wrapHandler(fn: () => Promise<string>): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[epic-fhir-mcp] Tool error:', msg);
    return `Error: ${msg}`;
  }
}

import { z } from 'zod';
import { authorize } from '../auth/auth-client.js';

export const authorizeInputSchema = z.object({});

export async function authorizeHandler(): Promise<string> {
  console.error('[authorize] Starting OAuth flow. If browser does not show a login page, paste the URL shown in logs into a private/incognito window and log in with fhircamila / epicepic1');
  const { patientId } = await authorize();
  return [
    'Authorization successful!',
    `Patient FHIR ID: ${patientId}`,
    '',
    'You can now use all health data tools:',
    '  • get_patient_summary — demographics, conditions, allergies',
    '  • get_lab_trends — CBC, CMP, tumor marker time series',
    '  • get_medication_regimen — current medications by category',
    '  • get_upcoming_appointments — next scheduled visits',
    '  • get_care_team — your care team members and contacts',
    '  • get_clinical_notes — recent visit and discharge summaries',
    '  • get_treatment_history — past procedures and infusions',
    '  • get_allergy_profile — drug, food, and environmental allergies',
    '  • get_oncology_summary — comprehensive one-call overview',
  ].join('\n');
}

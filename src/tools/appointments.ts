import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getAppointments } from '../fhir/client.js';
import { parseAppointments } from '../parsers/appointment.js';
import { config } from '../config.js';

export const appointmentsInputSchema = z.object({
  count: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Number of upcoming appointments to retrieve'),
});

type Input = z.infer<typeof appointmentsInputSchema>;

export async function appointmentsHandler(input: Input): Promise<string> {
  const patientId     = getPatientId();
  const fhirAppts     = await getAppointments(patientId, input.count);
  const appointments  = parseAppointments(fhirAppts, config.distanceThresholdMiles);

  if (appointments.length === 0) {
    return 'No upcoming appointments found. This may mean all appointments are already past, or none have been scheduled yet.';
  }

  const lines = [`## Upcoming Appointments (next ${appointments.length})\n`];

  for (const appt of appointments) {
    lines.push(`### ${appt.date} at ${appt.time}`);
    lines.push(`**Provider:** ${appt.provider}`);
    if (appt.specialty) lines.push(`**Specialty:** ${appt.specialty}`);
    lines.push(`**Location:** ${appt.location}`);
    lines.push(`**Status:** ${appt.status}`);

    if (appt.distanceFlag) {
      lines.push('');
      lines.push('> 📞 **This location may require travel.** Consider calling ahead to ask if this visit can be done by phone or video — especially if you\'re feeling unwell or transportation is difficult.');
    }

    lines.push('');
  }

  return lines.join('\n');
}

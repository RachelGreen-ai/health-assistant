import type { FhirAppointment } from '../types/fhir.js';
import type { AppointmentInfo } from '../types/domain.js';

export function parseAppointments(
  appointments: FhirAppointment[],
  distanceThresholdMiles: number
): AppointmentInfo[] {
  return appointments.map(appt => {
    const startIso = appt.start ?? '';
    const dateObj  = startIso ? new Date(startIso) : null;

    const date = dateObj
      ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Date unknown';
    const time = dateObj
      ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : 'Time unknown';

    // Provider: first participant that is a Practitioner
    const providerRef = appt.participant?.find(p =>
      p.actor?.reference?.startsWith('Practitioner')
    );
    const provider = providerRef?.actor?.display ?? 'Provider TBD';

    // Specialty
    const specialty = appt.serviceType?.[0]?.text
      ?? appt.specialty?.[0]?.text
      ?? appt.specialty?.[0]?.coding?.[0]?.display;

    // Location: look for a Location participant
    const locationRef = appt.participant?.find(p =>
      p.actor?.reference?.startsWith('Location')
    );
    const location = locationRef?.actor?.display ?? 'Location TBD';

    // Distance flag heuristic: if location display contains keywords suggesting it's far
    // (e.g. "Stanford" when patient is not near Palo Alto, or explicit distance data)
    // In production this would use geocoding. For now we flag locations that include
    // words like "Main Campus", "Palo Alto", "San Francisco" as potential travel locations.
    // The AI can ask the user to confirm. Real distance calculation needs patient address.
    const FAR_KEYWORDS = ['main campus', 'palo alto', 'san francisco', 'stanford hospital'];
    const distanceFlag = FAR_KEYWORDS.some(k => location.toLowerCase().includes(k));

    return {
      date,
      time,
      provider,
      specialty,
      location,
      distanceFlag,
      status: appt.status ?? 'booked',
    };
  });
}

import type { FhirAppointment } from '../types/fhir.js';
import type { AppointmentInfo } from '../types/domain.js';
export declare function parseAppointments(appointments: FhirAppointment[], distanceThresholdMiles: number): AppointmentInfo[];

import type { FhirCareTeam, FhirPractitioner } from '../types/fhir.js';
import type { CareTeamMember } from '../types/domain.js';
export declare function parseCareTeam(careTeams: FhirCareTeam[], practitioners: FhirPractitioner[]): CareTeamMember[];

import { z } from 'zod';
const ConfigSchema = z.object({
    clientId: z.string().min(1, 'EPIC_CLIENT_ID is required'),
    redirectUri: z.string().url('EPIC_REDIRECT_URI must be a valid URL'),
    baseUrl: z.string().url('EPIC_BASE_URL must be a valid URL'),
    authUrl: z.string().url('EPIC_AUTH_URL must be a valid URL'),
    tokenUrl: z.string().url('EPIC_TOKEN_URL must be a valid URL'),
    tokenFilePath: z.string().min(1),
    distanceThresholdMiles: z.number().int().positive(),
});
function loadConfig() {
    const raw = {
        clientId: process.env.EPIC_CLIENT_ID,
        redirectUri: process.env.EPIC_REDIRECT_URI ?? 'http://localhost:9090/callback',
        baseUrl: process.env.EPIC_BASE_URL ?? 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
        authUrl: process.env.EPIC_AUTH_URL ?? 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
        tokenUrl: process.env.EPIC_TOKEN_URL ?? 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
        tokenFilePath: process.env.TOKEN_FILE_PATH ?? '~/.epic-mcp-tokens.json',
        distanceThresholdMiles: parseInt(process.env.PATIENT_DISTANCE_THRESHOLD_MILES ?? '30', 10),
    };
    const result = ConfigSchema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
        throw new Error(`Configuration error:\n${issues}\n\nCopy .env.example to .env and fill in your values.`);
    }
    return result.data;
}
export const config = loadConfig();
//# sourceMappingURL=config.js.map
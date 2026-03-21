/**
 * Run the full SMART-on-FHIR standalone OAuth 2.0 PKCE flow.
 * Opens the user's browser, waits for the callback, exchanges code for tokens.
 */
export declare function authorize(): Promise<{
    patientId: string;
}>;
/**
 * Return a valid access token, refreshing if needed.
 * Throws if not authorized or refresh fails.
 */
export declare function getValidAccessToken(): Promise<string>;

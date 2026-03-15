import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import open from 'open';
import { generatePkce } from './pkce.js';
import { startCallbackServerWithPort } from './callback-server.js';
import { saveTokens, loadTokens, StoredTokens } from './token-store.js';
import { config } from '../config.js';

// Scopes requested from Epic
const SCOPES = [
  'openid',
  'profile',
  'offline_access',
  'launch/patient',
  'patient/Patient.read',
  'patient/Observation.read',
  'patient/MedicationRequest.read',
  'patient/Condition.read',
  'patient/AllergyIntolerance.read',
  'patient/Appointment.read',
  'patient/CarePlan.read',
  'patient/CareTeam.read',
  'patient/Procedure.read',
  'patient/DiagnosticReport.read',
  'patient/DocumentReference.read',
  'patient/Practitioner.read',
].join(' ');

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
  patient?: string;  // Epic includes the patient FHIR ID here
}

/**
 * Run the full SMART-on-FHIR standalone OAuth 2.0 PKCE flow.
 * Opens the user's browser, waits for the callback, exchanges code for tokens.
 */
export async function authorize(): Promise<{ patientId: string }> {
  const pkce  = generatePkce();
  const state = uuidv4();

  // Start callback server first so we know which port to put in redirect_uri
  const { port: portPromise, result: callbackPromise } = startCallbackServerWithPort(state);
  const port = await portPromise;
  const redirectUri = `http://localhost:${port}/callback`;

  // Build authorization URL
  const authParams = new URLSearchParams({
    response_type:         'code',
    client_id:             config.clientId,
    redirect_uri:          redirectUri,
    scope:                 SCOPES,
    state,
    aud:                   config.baseUrl,
    code_challenge:        pkce.codeChallenge,
    code_challenge_method: pkce.codeChallengeMethod,
  });
  const authUrl = `${config.authUrl}?${authParams.toString()}`;

  console.error('[auth] Opening browser for Epic login...');
  console.error(`[auth] If the browser does not open, visit:\n  ${authUrl}`);
  await open(authUrl);

  // Wait for the user to log in and Epic to redirect back
  const callback = await callbackPromise;

  // Exchange authorization code for tokens
  const tokenParams = new URLSearchParams({
    grant_type:    'authorization_code',
    code:          callback.code,
    redirect_uri:  redirectUri,
    client_id:     config.clientId,
    code_verifier: pkce.codeVerifier,
  });

  const tokenResponse = await axios.post<TokenResponse>(
    config.tokenUrl,
    tokenParams.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const data = tokenResponse.data;
  const expiresAt = Date.now() + data.expires_in * 1000 - 60_000; // 60s buffer

  const stored: StoredTokens = {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    idToken:      data.id_token,
    expiresAt,
    patientId:    data.patient,
    scope:        data.scope,
  };
  saveTokens(stored);

  const patientId = data.patient ?? '(unknown)';
  console.error(`[auth] Tokens saved. Patient ID: ${patientId}`);
  return { patientId };
}

/**
 * Return a valid access token, refreshing if needed.
 * Throws if not authorized or refresh fails.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = loadTokens();

  if (!tokens) {
    throw new Error('Not authorized. Run the authorize tool first.');
  }

  // Token is still valid
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Try to refresh
  if (!tokens.refreshToken) {
    throw new Error('Session expired and no refresh token available. Run authorize again.');
  }

  try {
    const refreshParams = new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id:     config.clientId,
    });

    const response = await axios.post<TokenResponse>(
      config.tokenUrl,
      refreshParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const data = response.data;
    const expiresAt = Date.now() + data.expires_in * 1000 - 60_000;

    saveTokens({
      accessToken:  data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      idToken:      data.id_token      ?? tokens.idToken,
      expiresAt,
      patientId:    tokens.patientId,
      scope:        data.scope,
    });

    return data.access_token;
  } catch (err) {
    throw new Error('Token refresh failed. Run the authorize tool to re-authenticate.');
  }
}

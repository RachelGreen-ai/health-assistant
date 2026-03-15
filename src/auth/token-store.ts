import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from '../config.js';

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;   // Unix timestamp ms — access token is invalid after this
  patientId?: string;  // Epic patient FHIR resource ID from token response
  scope: string;
}

function resolvePath(): string {
  const raw = config.tokenFilePath;
  return raw.startsWith('~')
    ? path.join(os.homedir(), raw.slice(1))
    : raw;
}

export function saveTokens(tokens: StoredTokens): void {
  const filePath = resolvePath();
  fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

export function loadTokens(): StoredTokens | null {
  const filePath = resolvePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  const filePath = resolvePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getPatientId(): string {
  const tokens = loadTokens();
  if (!tokens?.patientId) {
    throw new Error('Not authorized. Run the authorize tool first.');
  }
  return tokens.patientId;
}

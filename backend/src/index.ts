import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { chat, clearSession } from './agent.js';
import { transcribe, synthesize } from './voice.js';
import { getMcpClient, callMcpTool } from './mcp-client.js';

// ── PKCE helpers ─────────────────────────────────────────────────────────────
function generatePkce() {
  const codeVerifier  = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// In-memory store for pending OAuth sessions (state → codeVerifier)
const pendingAuth = new Map<string, { codeVerifier: string; expiresAt: number }>();

const SCOPES = [
  'openid', 'fhirUser', 'offline_access',
  'patient/Patient.read', 'patient/Observation.read',
  'patient/MedicationRequest.read', 'patient/Condition.read',
  'patient/AllergyIntolerance.read', 'patient/Appointment.read',
  'patient/CarePlan.read', 'patient/CareTeam.read',
  'patient/Procedure.read', 'patient/DiagnosticReport.read',
  'patient/DocumentReference.read', 'patient/Practitioner.read',
].join(' ');

// ── Token helpers ─────────────────────────────────────────────────────────────
function resolveTokenPath(): string {
  const raw = process.env.TOKEN_FILE_PATH ?? '~/.epic-mcp-tokens.json';
  return raw.startsWith('~') ? path.join(os.homedir(), raw.slice(1)) : raw;
}

interface StoredTokens {
  accessToken: string;
  expiresAt: number;
  patientId?: string;
  scope: string;
}

function loadTokens(): StoredTokens | null {
  const p = resolveTokenPath();
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as StoredTokens; }
  catch { return null; }
}

const app  = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ── Debug (temporary) ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const MCP_DEBUG_PATH = path.resolve(__dirname, '../../dist/index.js');

app.get('/debug', (_req, res) => {
  res.json({
    mcpPath:      MCP_DEBUG_PATH,
    mcpExists:    fs.existsSync(MCP_DEBUG_PATH),
    cwd:          process.cwd(),
    nodeVersion:  process.version,
    epicClientId: process.env.EPIC_CLIENT_ID ? 'set' : 'missing',
    epicTokenUrl: process.env.EPIC_TOKEN_URL  ?? 'missing',
    epicBaseUrl:  process.env.EPIC_BASE_URL   ?? 'missing',
  });
});

// ── Chat (streaming SSE) ────────────────────────────────────────────────────
// POST /chat  { message: string, sessionId?: string }
// Response: text/event-stream
// Each event: data: <chunk>\n\n
// Final event: data: [DONE]\n\n
app.post('/chat', async (req, res) => {
  const { message, sessionId = 'default', language = 'en' } = req.body as {
    message: string; sessionId?: string; language?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of chat(sessionId, message, language)) {
      const escaped = chunk.replace(/\n/g, '\\n');
      res.write(`data: ${escaped}\n\n`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/chat] error:', msg);
    res.write(`data: Error: ${msg}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

// ── Clear session ───────────────────────────────────────────────────────────
app.delete('/session/:sessionId', (req, res) => {
  clearSession(req.params.sessionId);
  res.json({ ok: true });
});

// ── Transcribe audio → text ─────────────────────────────────────────────────
// POST /transcribe  multipart: audio file in field "audio"
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'audio file is required' });
    return;
  }

  try {
    const lang = (req.body as { language?: string }).language ?? 'en';
    const text = await transcribe(req.file.buffer, req.file.originalname || 'audio.m4a', lang);
    res.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/transcribe] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// ── Synthesize text → speech ────────────────────────────────────────────────
// POST /speak  { text: string }
// Response: audio/mpeg (mp3)
app.post('/speak', async (req, res) => {
  const { text } = req.body as { text: string };

  if (!text?.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  try {
    const audio = await synthesize(text);
    res.setHeader('Content-Type',   'audio/mpeg');
    res.setHeader('Content-Length', audio.length.toString());
    res.send(audio);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/speak] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// ── Lab trends (direct FHIR tool call) ──────────────────────────────────────
// POST /fhir/lab-trends  { labName, startDate?, endDate? }
// Returns structured JSON: { observations: [{date, value, unit}...] }
app.post('/fhir/lab-trends', async (req, res) => {
  const { labName, startDate, endDate } = req.body as {
    labName: string; startDate?: string; endDate?: string;
  };
  if (!labName?.trim()) { res.status(400).json({ error: 'labName is required' }); return; }
  try {
    const raw = await callMcpTool('get_lab_trends', {
      lab_name: labName,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate   ? { end_date:   endDate   } : {}),
    });
    // The MCP tool returns a JSON string — parse and forward it
    try {
      res.json(JSON.parse(raw));
    } catch {
      res.json({ raw });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/fhir/lab-trends] error:', msg);
    res.status(500).json({ error: msg });
  }
});

// ── Epic OAuth ──────────────────────────────────────────────────────────────
// GET /auth/status — check whether valid Epic tokens are on disk
app.get('/auth/status', (_req, res) => {
  const tokens = loadTokens();
  if (!tokens?.accessToken) {
    res.json({ authorized: false });
    return;
  }
  if (tokens.expiresAt < Date.now() - 60_000) {
    res.json({ authorized: false, reason: 'expired' });
    return;
  }
  res.json({ authorized: true, patientId: tokens.patientId });
});

// POST /auth/start — returns the Epic OAuth URL for the mobile app to open
app.post('/auth/start', (_req, res) => {
  const pkce  = generatePkce();
  const state = crypto.randomUUID();

  // Store PKCE verifier for 10 minutes
  pendingAuth.set(state, { codeVerifier: pkce.codeVerifier, expiresAt: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             process.env.EPIC_CLIENT_ID ?? '',
    redirect_uri:          process.env.EPIC_REDIRECT_URI ?? '',
    scope:                 SCOPES,
    state,
    aud:                   process.env.EPIC_BASE_URL ?? 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    code_challenge:        pkce.codeChallenge,
    code_challenge_method: 'S256',
    prompt:                'login',
  });

  const epicAuthUrl = process.env.EPIC_AUTH_URL ?? 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize';
  const url = `${epicAuthUrl}?${params.toString()}`;
  res.json({ url });
});

// GET /callback — Epic redirects here after login; exchanges code for tokens
app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query as Record<string, string>;

  if (error) {
    res.status(400).send(`<h2>Authorization failed: ${error_description ?? error}</h2>`);
    return;
  }

  if (!code || !state) {
    res.status(400).send('<h2>Missing code or state parameter.</h2>');
    return;
  }

  const pending = pendingAuth.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingAuth.delete(state);
    res.status(400).send('<h2>Invalid or expired session. Please try again.</h2>');
    return;
  }
  pendingAuth.delete(state);

  try {
    const tokenParams = new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.EPIC_REDIRECT_URI ?? '',
      client_id:     process.env.EPIC_CLIENT_ID ?? '',
      code_verifier: pending.codeVerifier,
    });

    const tokenRes = await fetch(process.env.EPIC_TOKEN_URL ?? '', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('[/callback] token exchange failed:', text);
      res.status(500).send(`<h2>Token exchange failed.</h2><pre>${text}</pre>`);
      return;
    }

    const data = await tokenRes.json() as {
      access_token: string; expires_in: number; scope: string;
      refresh_token?: string; id_token?: string; patient?: string;
    };

    const tokens = {
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      idToken:      data.id_token,
      expiresAt:    Date.now() + data.expires_in * 1000 - 60_000,
      patientId:    data.patient,
      scope:        data.scope,
    };

    fs.writeFileSync(resolveTokenPath(), JSON.stringify(tokens, null, 2), { mode: 0o600 });
    console.log(`[/callback] Authorized. Patient ID: ${data.patient ?? 'unknown'}`);

    res.send(`<!DOCTYPE html><html><head><title>Authorized</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
.box{text-align:center;padding:2rem;border-radius:12px;background:white;box-shadow:0 2px 12px rgba(0,0,0,.1);}
h1{color:#16a34a;}</style></head>
<body><div class="box"><h1>&#10003; Authorization Successful</h1>
<p>You can close this tab and return to the app.</p></div></body></html>`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/callback] error:', msg);
    res.status(500).send(`<h2>Server error during token exchange.</h2>`);
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[backend] Listening on http://localhost:${PORT}`);
  console.log('[backend] Connecting to Epic FHIR MCP server…');
  try {
    await getMcpClient();
    console.log('[backend] MCP server connected ✓');
  } catch (err) {
    console.error('[backend] MCP connection failed:', err);
    console.error('[backend] Make sure the MCP server is built: cd .. && npm run build');
  }
});

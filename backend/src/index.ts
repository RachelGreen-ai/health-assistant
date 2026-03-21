import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import os from 'os';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { chat, clearSession } from './agent.js';
import { transcribe, synthesize } from './voice.js';
import { getMcpClient, callMcpTool } from './mcp-client.js';

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

// ── Chat (streaming SSE) ────────────────────────────────────────────────────
// POST /chat  { message: string, sessionId?: string }
// Response: text/event-stream
// Each event: data: <chunk>\n\n
// Final event: data: [DONE]\n\n
app.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body as { message: string; sessionId?: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of chat(sessionId, message)) {
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

// POST /auth/start — trigger the MCP authorize tool (opens browser on backend machine)
app.post('/auth/start', async (_req, res) => {
  try {
    const result = await callMcpTool('authorize', {});
    res.json({ ok: true, message: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/auth/start] error:', msg);
    res.status(500).json({ error: msg });
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

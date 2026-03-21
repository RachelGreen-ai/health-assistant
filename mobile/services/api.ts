import type { Language } from '@/constants/i18n';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Chat (SSE streaming) ─────────────────────────────────────────────────────

export async function streamChat(
  message: string,
  sessionId: string,
  language: Language,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  // React Native's fetch doesn't support ReadableStream — use XHR with onprogress instead
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    let processed = 0;
    let done = false;

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(processed);
      processed = xhr.responseText.length;
      for (const line of newText.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6); // no trim — preserves inter-word spaces from token chunks
        const trimmed = data.trim();
        if (trimmed === '[DONE]') { done = true; onDone(); resolve(); return; }
        if (trimmed.startsWith('Error:')) { onError(trimmed); resolve(); return; }
        if (trimmed) onChunk(data.replace(/\\n/g, '\n'));
      }
    };

    xhr.onload = () => {
      if (!done) {
        xhr.status === 200 ? onDone() : onError(`Server error: ${xhr.status}`);
      }
      resolve();
    };

    xhr.onerror = () => { onError('Network error — is the backend running?'); resolve(); };
    xhr.ontimeout = () => { onError('Request timed out'); resolve(); };
    xhr.timeout = 60000;

    xhr.send(JSON.stringify({ message, sessionId, language }));
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthStatus {
  authorized: boolean;
  patientId?: string;
  reason?: string;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch(`${API_BASE}/auth/status`);
    if (!res.ok) return { authorized: false };
    return res.json() as Promise<AuthStatus>;
  } catch {
    return { authorized: false };
  }
}

export async function startAuth(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/start`, { method: 'POST' });
  if (!res.ok) throw new Error(`Auth start failed: ${res.status}`);
  const json = await res.json() as { url: string };
  return json.url;
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' });
}

// ─── Lab Trends ───────────────────────────────────────────────────────────────

export interface LabObservation {
  date: string;
  value: number;
  unit: string;
}

export interface LabTrendsResult {
  observations?: LabObservation[];
  raw?: string;
  error?: string;
}

export async function getLabTrends(
  labName: string,
  startDate?: string,
  endDate?: string,
): Promise<LabTrendsResult> {
  const res = await fetch(`${API_BASE}/fhir/lab-trends`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labName, startDate, endDate }),
  });
  if (!res.ok) throw new Error(`Lab trends failed: ${res.status}`);
  return res.json() as Promise<LabTrendsResult>;
}

// ─── Voice ────────────────────────────────────────────────────────────────────

export async function transcribeAudio(
  fileUri: string,
  language: Language,
): Promise<string> {
  const form = new FormData();
  form.append('audio', {
    uri: fileUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);
  form.append('language', language);

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
  const json = await res.json() as { text: string };
  return json.text;
}

export async function speakText(text: string, language: Language): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return res.arrayBuffer();
}

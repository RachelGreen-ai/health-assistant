import http from 'http';
import { URL } from 'url';

export interface CallbackResult {
  code: string;
  state: string;
  port: number;
}

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const SUCCESS_HTML = `<!DOCTYPE html>
<html><head><title>Authorization Complete</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
.box{text-align:center;padding:2rem;border-radius:12px;background:white;box-shadow:0 2px 12px rgba(0,0,0,.1);}
h1{color:#16a34a;margin-bottom:.5rem;}p{color:#555;}</style></head>
<body><div class="box"><h1>&#10003; Authorization Successful</h1>
<p>You can close this tab and return to the app.</p></div></body></html>`;

const ERROR_HTML = (msg: string) => `<!DOCTYPE html>
<html><head><title>Authorization Failed</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fef2f2;}
.box{text-align:center;padding:2rem;border-radius:12px;background:white;box-shadow:0 2px 12px rgba(0,0,0,.1);}
h1{color:#dc2626;margin-bottom:.5rem;}p{color:#555;}</style></head>
<body><div class="box"><h1>&#10007; Authorization Failed</h1>
<p>${msg}</p><p>Please try again.</p></div></body></html>`;

/**
 * Start a one-shot local HTTP server on a random port.
 * Returns a Promise that resolves with the OAuth callback code + state,
 * or rejects after TIMEOUT_MS.
 *
 * The caller uses the resolved `port` to build the redirect_uri sent to Epic.
 */
export function startCallbackServer(expectedState: string): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', `http://localhost`);

      // Only handle the /callback path
      if (reqUrl.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code  = reqUrl.searchParams.get('code');
      const state = reqUrl.searchParams.get('state');
      const error = reqUrl.searchParams.get('error');

      if (error) {
        const desc = reqUrl.searchParams.get('error_description') ?? error;
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML(desc));
        cleanup();
        reject(new Error(`Epic authorization error: ${desc}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('Missing code or state parameter.'));
        cleanup();
        reject(new Error('OAuth callback missing code or state'));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('State mismatch — possible CSRF attack. Please try again.'));
        cleanup();
        reject(new Error('OAuth state mismatch'));
        return;
      }

      const port = (server.address() as { port: number }).port;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(SUCCESS_HTML);
      cleanup();
      resolve({ code, state, port });
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Authorization timed out after 5 minutes. Please try again.'));
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      server.close();
    }

    // Port 0 → OS picks a free port
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      // Expose the port so the caller can read it before the Promise resolves
      (server as unknown as { _assignedPort: number })._assignedPort = addr.port;
    });

    server.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Start the server and immediately return both the port and the promise.
 * This lets auth-client.ts read the port before awaiting the callback.
 */
export function startCallbackServerWithPort(expectedState: string): {
  port: Promise<number>;
  result: Promise<CallbackResult>;
} {
  let resolvePort!: (port: number) => void;
  const portPromise = new Promise<number>((res) => { resolvePort = res; });

  const resultPromise = new Promise<CallbackResult>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? '/', `http://localhost`);

      if (reqUrl.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code  = reqUrl.searchParams.get('code');
      const state = reqUrl.searchParams.get('state');
      const error = reqUrl.searchParams.get('error');

      if (error) {
        const desc = reqUrl.searchParams.get('error_description') ?? error;
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML(desc));
        cleanup();
        reject(new Error(`Epic authorization error: ${desc}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('Missing code or state parameter.'));
        cleanup();
        reject(new Error('OAuth callback missing code or state'));
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('State mismatch. Please try again.'));
        cleanup();
        reject(new Error('OAuth state mismatch'));
        return;
      }

      const port = (server.address() as { port: number }).port;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(SUCCESS_HTML);
      cleanup();
      resolve({ code, state, port });
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Authorization timed out after 5 minutes.'));
    }, TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      server.close();
    }

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolvePort(addr.port);
    });

    server.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });

  return { port: portPromise, result: resultPromise };
}

import http from 'http';
import { URL } from 'url';
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SUCCESS_HTML = `<!DOCTYPE html>
<html><head><title>Authorization Complete</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
.box{text-align:center;padding:2rem;border-radius:12px;background:white;box-shadow:0 2px 12px rgba(0,0,0,.1);}
h1{color:#16a34a;margin-bottom:.5rem;}p{color:#555;}</style></head>
<body><div class="box"><h1>&#10003; Authorization Successful</h1>
<p>You can close this tab and return to the app.</p></div></body></html>`;
const ERROR_HTML = (msg) => `<!DOCTYPE html>
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
export function startCallbackServer(expectedState) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const reqUrl = new URL(req.url ?? '/', `http://localhost`);
            // Only handle the /callback path
            if (reqUrl.pathname !== '/callback') {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const code = reqUrl.searchParams.get('code');
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
            const port = server.address().port;
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
        server.listen(9090, '127.0.0.1', () => {
            const addr = server.address();
            server._assignedPort = addr.port;
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
// Module-level server so we can close a stale one before starting fresh
let activeServer = null;
export function startCallbackServerWithPort(expectedState) {
    // Close any leftover server from a previous authorize call
    if (activeServer) {
        console.error('[callback] Closing stale callback server from previous call');
        activeServer.close();
        activeServer = null;
    }
    let resolvePort;
    let rejectPort;
    const portPromise = new Promise((res, rej) => { resolvePort = res; rejectPort = rej; });
    const resultPromise = new Promise((resolve, reject) => {
        const server = activeServer = http.createServer((req, res) => {
            const reqUrl = new URL(req.url ?? '/', `http://localhost`);
            // Debug: log everything Epic sends back
            console.error(`[callback] full URL: ${req.url}`);
            console.error(`[callback] params: ${reqUrl.searchParams.toString()}`);
            if (reqUrl.pathname !== '/callback') {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const code = reqUrl.searchParams.get('code');
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
                reject(new Error(`OAuth callback missing code or state. Received: ${reqUrl.searchParams.toString()}`));
                return;
            }
            if (state !== expectedState) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(ERROR_HTML('State mismatch. Please try again.'));
                cleanup();
                reject(new Error('OAuth state mismatch'));
                return;
            }
            const port = server.address().port;
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
            activeServer = null;
        }
        const tryListen = () => {
            server.listen(9090, '127.0.0.1', () => {
                const addr = server.address();
                resolvePort(addr.port);
            });
        };
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                // Port stuck from previous run — kill it and retry once
                console.error('[callback] Port 9090 in use, freeing it...');
                import('child_process').then(({ exec }) => {
                    exec('lsof -ti:9090 | xargs kill -9', () => {
                        server.removeAllListeners('error');
                        server.on('error', (e) => { cleanup(); rejectPort(e); reject(e); });
                        setTimeout(tryListen, 500);
                    });
                });
            }
            else {
                cleanup();
                rejectPort(err);
                reject(err);
            }
        });
        tryListen();
    });
    return { port: portPromise, result: resultPromise };
}
//# sourceMappingURL=callback-server.js.map
import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from '../config.js';
function resolvePath() {
    const raw = config.tokenFilePath;
    return raw.startsWith('~')
        ? path.join(os.homedir(), raw.slice(1))
        : raw;
}
export function saveTokens(tokens) {
    const filePath = resolvePath();
    fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}
export function loadTokens() {
    const filePath = resolvePath();
    if (!fs.existsSync(filePath))
        return null;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function clearTokens() {
    const filePath = resolvePath();
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
export function getPatientId() {
    const tokens = loadTokens();
    if (!tokens?.patientId) {
        throw new Error('Not authorized. Run the authorize tool first.');
    }
    return tokens.patientId;
}
//# sourceMappingURL=token-store.js.map
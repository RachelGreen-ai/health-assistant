import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type Anthropic from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The compiled MCP server lives two levels up: backend/src → backend → project root → dist/index.js
const MCP_SERVER_PATH = path.resolve(__dirname, '../../dist/index.js');

// Use the node binary that's running this process, not a hardcoded path.
const NODE_BIN = process.execPath;

let _client: Client | null = null;

async function connect(): Promise<Client> {
  const transport = new StdioClientTransport({
    command: NODE_BIN,
    args: [MCP_SERVER_PATH],
    env: {
      ...process.env,
      EPIC_CLIENT_ID:      process.env.EPIC_CLIENT_ID ?? '',
      EPIC_BASE_URL:       process.env.EPIC_BASE_URL ?? '',
      EPIC_AUTH_URL:       process.env.EPIC_AUTH_URL ?? '',
      EPIC_TOKEN_URL:      process.env.EPIC_TOKEN_URL ?? '',
      TOKEN_FILE_PATH:     process.env.TOKEN_FILE_PATH ?? '',
      EPIC_REDIRECT_URI:   process.env.EPIC_REDIRECT_URI ?? '',
      PATIENT_DISTANCE_THRESHOLD_MILES: process.env.PATIENT_DISTANCE_THRESHOLD_MILES ?? '30',
    },
  });

  const client = new Client({ name: 'health-assistant-backend', version: '0.1.0' });
  await client.connect(transport);
  return client;
}

export async function getMcpClient(): Promise<Client> {
  if (!_client) {
    _client = await connect();
  }
  return _client;
}

export async function getMcpTools(): Promise<Anthropic.Tool[]> {
  const client = await getMcpClient();
  const { tools } = await client.listTools();
  return tools.map(t => ({
    name:         t.name,
    description:  t.description ?? '',
    input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
  }));
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const client = await getMcpClient();
  const result = await client.callTool({ name, arguments: args });

  const r = result as Record<string, unknown>;
  if (!Array.isArray(r['content'])) {
    return 'Tool returned no content.';
  }

  return (r['content'] as Array<Record<string, unknown>>)
    .filter(c => c['type'] === 'text')
    .map(c => String(c['text'] ?? ''))
    .join('\n');
}

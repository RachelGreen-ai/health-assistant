import Anthropic from '@anthropic-ai/sdk';
import { getMcpTools, callMcpTool } from './mcp-client.js';
import { SYSTEM_PROMPT } from './system-prompt.js';

const anthropic = new Anthropic();

// In-memory session store: sessionId → message history
const sessions = new Map<string, Anthropic.MessageParam[]>();

export function getOrCreateSession(sessionId: string): Anthropic.MessageParam[] {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  return sessions.get(sessionId)!;
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Stream a response from Claude with Epic FHIR tools available.
 * Yields text chunks as they arrive; handles tool-use rounds internally.
 */
export async function* chat(
  sessionId: string,
  userMessage: string,
): AsyncGenerator<string> {
  const messages = getOrCreateSession(sessionId);
  messages.push({ role: 'user', content: userMessage });

  const tools = await getMcpTools();

  while (true) {
    const stream = anthropic.messages.stream({
      model:      process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Stream text deltas to the caller
    stream.on('text', (delta) => {
      // Handled by the for-await below via the generator
    });

    // Collect text deltas via the async iterator
    let fullText = '';
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text;
        yield event.delta.text;
      }
    }

    const message = await stream.finalMessage();
    messages.push({ role: 'assistant', content: message.content });

    if (message.stop_reason === 'end_turn') break;

    if (message.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of message.content) {
        if (block.type !== 'tool_use') continue;

        yield `\n\n_Checking your records (${block.name})…_\n\n`;

        let result: string;
        try {
          result = await callMcpTool(block.name, block.input as Record<string, unknown>);
        } catch (err) {
          result = `Error calling ${block.name}: ${err instanceof Error ? err.message : String(err)}`;
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: block.id,
          content:     result,
        });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // pause_turn or other — re-send to continue
    if (message.stop_reason === 'pause_turn') continue;

    break;
  }
}

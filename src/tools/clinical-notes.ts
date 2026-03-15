import { z } from 'zod';
import { getPatientId } from '../auth/token-store.js';
import { getDocumentReferences, getBinaryText } from '../fhir/client.js';
import { parseDocument } from '../parsers/document.js';

export const clinicalNotesInputSchema = z.object({
  count: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('Number of most recent clinical notes to retrieve'),
});

type Input = z.infer<typeof clinicalNotesInputSchema>;

export async function clinicalNotesHandler(input: Input): Promise<string> {
  const patientId = getPatientId();
  const docRefs   = await getDocumentReferences(patientId, input.count);

  if (docRefs.length === 0) {
    return 'No clinical notes found. Notes may not yet be available in this system or may require additional permissions.';
  }

  const lines = [`## Clinical Notes (${docRefs.length} most recent)\n`];

  for (const docRef of docRefs) {
    const attachment = docRef.content?.[0]?.attachment;
    let rawText = '';

    // Try fetching binary content
    if (attachment?.url) {
      try {
        rawText = await getBinaryText(attachment.url);
      } catch {
        rawText = attachment.data
          ? Buffer.from(attachment.data, 'base64').toString('utf-8')
          : '[Note content could not be retrieved]';
      }
    } else if (attachment?.data) {
      rawText = Buffer.from(attachment.data, 'base64').toString('utf-8');
    } else {
      rawText = docRef.description ?? '[No content available]';
    }

    const note = parseDocument(docRef, rawText);

    lines.push(`---`);
    lines.push(`### ${note.type}`);
    lines.push(`**Date:** ${note.date.slice(0, 10)}`);
    if (note.provider) lines.push(`**Author:** ${note.provider}`);
    lines.push('');
    lines.push(note.text);
    lines.push('');
  }

  return lines.join('\n');
}

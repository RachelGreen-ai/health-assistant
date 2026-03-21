import OpenAI, { toFile } from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

/**
 * Transcribe audio using Whisper.
 * @param buffer  Raw audio bytes (webm, mp4, m4a, mp3, wav, etc.)
 * @param filename  Filename with extension so Whisper knows the format
 */
export async function transcribe(buffer: Buffer, filename: string, language = 'en'): Promise<string> {
  const file = await toFile(buffer, filename);
  const result = await getOpenAI().audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language,
  });
  return result.text;
}

/**
 * Synthesize text to speech using OpenAI TTS (nova voice).
 * Returns the audio as a Buffer (mp3).
 */
export async function synthesize(text: string): Promise<Buffer> {
  const response = await getOpenAI().audio.speech.create({
    model:  'tts-1',
    voice:  'nova',
    input:  text,
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

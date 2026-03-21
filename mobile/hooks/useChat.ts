import { useState, useCallback, useRef } from 'react';
import { streamChat, clearSession } from '@/services/api';
import type { Language } from '@/constants/i18n';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

export function useChat(sessionId: string, language: Language) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', text: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    streamingIdRef.current = assistantId;

    await streamChat(
      text,
      sessionId,
      language,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + chunk } : m,
          ),
        );
      },
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m,
          ),
        );
        setIsStreaming(false);
        streamingIdRef.current = null;
      },
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: `Error: ${err}`, streaming: false }
              : m,
          ),
        );
        setIsStreaming(false);
      },
    );
  }, [isStreaming, sessionId, language]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    await clearSession(sessionId);
  }, [sessionId]);

  return { messages, isStreaming, sendMessage, clearChat };
}

import { useEffect, useRef } from 'react';
import { WA_SSE_URL } from '../api/leads';
import type { WhatsAppMessage } from '../types/lead';

export interface SsePayload {
  leadId: string;
  message: WhatsAppMessage;
}

export function useWhatsAppSSE(onMessage: (payload: SsePayload) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const sse = new EventSource(WA_SSE_URL);

    sse.onmessage = (e) => {
      try {
        const payload: SsePayload = JSON.parse(e.data);
        onMessageRef.current(payload);
      } catch {
        // ignore malformed events
      }
    };

    sse.onerror = () => {
      // Browser auto-reconnects EventSource on error
    };

    return () => sse.close();
  }, []);
}

"use client";

import { useEffect, useRef, useState } from "react";

type AdminEvent = { type: string; entity?: string };

export function useSSE(url: string, onEvent: (event: AdminEvent) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let source: EventSource | null = null;
    let closed = false;

    // Stagger the connection so it doesn't race the initial /api/admin/data fetch
    // on the middleware's Supabase token refresh (refresh-token rotation race → 401).
    const startTimer = setTimeout(() => {
      if (closed) return;
      source = new EventSource(url);

      source.onopen = () => setConnected(true);
      source.onerror = () => setConnected(false); // EventSource auto-reconnects
      source.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as AdminEvent;
          if (payload.type === "connected") { setConnected(true); return; }
          handlerRef.current(payload);
        } catch {
          // ignore malformed events
        }
      };
    }, 800);

    return () => {
      closed = true;
      clearTimeout(startTimer);
      source?.close();
    };
  }, [url]);

  return { connected };
}

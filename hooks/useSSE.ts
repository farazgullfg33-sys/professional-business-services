"use client";

import { useEffect, useRef, useState } from "react";

type AdminEvent = { type: string; entity?: string };

export function useSSE(url: string, onEvent: (event: AdminEvent) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data) as AdminEvent;
        if (payload.type === "connected") { setConnected(true); return; }
        handlerRef.current(payload);
      } catch {
        // ignore malformed events
      }
    };

    return () => source.close();
  }, [url]);

  return { connected };
}

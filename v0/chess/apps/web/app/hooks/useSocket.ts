"use client";
import { useRef, useState, useCallback, useEffect } from "react";

const WS_URL =
  process.env.NODE_ENV === "production"
    ? "wss://ws.chess.sarg.am"
    : "ws://localhost:8080";

type MessageHandler = (type: string, payload: Record<string, unknown>) => void;

export function useSocket(token: string | null, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        onMessageRef.current(type, payload);
      } catch {
        console.error("Failed to parse message:", event.data);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const send = useCallback(
    (type: string, payload?: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type, payload }));
      }
    },
    [],
  );

  return { connected, send };
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type SocketMessage = {
  type: string;
  [key: string]: any;
};

interface SocketContextType {
  connected: boolean;
  lastEvent: SocketMessage | null;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<SocketMessage | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, proxy handles /ws or connect to localhost:8000
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          if (data.type) {
            const handlers = listenersRef.current.get(data.type);
            if (handlers) {
              handlers.forEach((fn) => fn(data));
            }
          }
        } catch (e) {
          console.error('Socket message parse error', e);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        // Attempt reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const subscribe = (eventType: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    return () => {
      listenersRef.current.get(eventType)?.delete(callback);
    };
  };

  return (
    <SocketContext.Provider value={{ connected, lastEvent, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};


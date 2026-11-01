'use client';

import ioPkg from 'socket.io-client';

export type Socket = any;

const io: any = typeof ioPkg === 'function' ? ioPkg : (ioPkg as any)?.io || (ioPkg as any)?.default || ioPkg;

let socketInstance: any = null;

export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
}

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
}

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    const url = getSocketUrl();
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 8000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('[ORDRIVA Realtime] Connected to Socket Gateway at', url, 'Socket ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[ORDRIVA Realtime] Disconnected from Socket Gateway:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('[ORDRIVA Realtime] Connection error:', error.message);
    });
  }

  return socketInstance;
}

// apps/frontend/src/core/socket.client.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log(`📡 Connected to telemetry stream. Socket ID: ${socket.id}`);
  socket.emit('subscribe:dashboard');
});

socket.on('disconnect', (reason) => {
  console.warn(`🔴 Disconnected. Reason: ${reason}`);
});

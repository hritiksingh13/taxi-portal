// apps/backend/src/server.ts
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import app from './app';
import { env } from './config/env.config';
import { setIo as setTripIo } from './features/trips/trip.service';
import { setIo as setDriverIo } from './features/drivers/driver.service';

const httpServer = createServer(app);

// Initialize Socket.IO for real-time telemetry
export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

// Inject socket into services (avoids circular imports)
setTripIo(io);
setDriverIo(io);

let connectedClients = 0;

io.on('connection', (socket: Socket) => {
  connectedClients++;
  console.log(`🔌 Client connected: ${socket.id}. Total active: ${connectedClients}`);

  // Clients subscribe to the dashboard telemetry stream
  socket.on('subscribe:dashboard', () => {
    socket.join('dashboard_room');
    console.log(`📡 Client ${socket.id} joined 'dashboard_room'`);
  });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`🔴 Client disconnected: ${socket.id}. Total active: ${connectedClients}`);
  });
});

// Boot the HTTP and WebSocket server
httpServer.listen(env.PORT, () => {
  console.log(`🚀 Core backend operational on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  console.log(`📡 WebSocket server ready for real-time telemetry`);
  console.log(`🗄️  API available at http://localhost:${env.PORT}/api/v1`);
});

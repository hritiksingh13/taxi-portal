// apps/backend/src/app.ts
import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env.config';
import { globalErrorHandler, AppError } from './core/exceptions/global.exception';

// Route Imports
import carRoutes from './features/cars/car.route';
import driverRoutes from './features/drivers/driver.route';
import agentRoutes from './features/agents/agent.route';
import tripRoutes from './features/trips/trip.route';
import dashboardRoutes from './features/dashboard/dashboard.route';
import customerRoutes from './features/customers/customer.route';
import emailRoutes from './features/email/email.route';
import publicRoutes from './features/public/public.route';

const app: Application = express();

// Middleware Configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Versioning and Feature Routing
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/email', emailRoutes);

// Public routes (no auth — customer portal)
app.use('/api/v1/public', publicRoutes);

// Fallback for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// Global Exception Filter
app.use(globalErrorHandler);

export default app;

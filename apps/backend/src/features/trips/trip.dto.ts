// apps/backend/src/features/trips/trip.dto.ts
import { z } from 'zod';

export const initiateTripSchema = z.object({
  body: z.object({
    driverId: z.string().uuid('Invalid Driver ID'),
    agentId: z.string().uuid('Invalid Agent ID'),
    stops: z.array(z.string().min(2, 'Each stop must be at least 2 characters')).min(2, 'At least 2 stops required (origin and destination)'),
    estimatedDurationMinutes: z.number().positive('Duration must be a positive number').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    customerId: z.string().uuid('Invalid Customer ID').optional().or(z.literal('')),
    advancePaid: z.number().min(0).optional(),
    fuelExpense: z.number().min(0).optional(),
    pendingAmount: z.number().min(0).optional(),
  }),
});

export const updateTripSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Trip ID format') }),
  body: z.object({
    stops: z.array(z.string().min(2)).min(2).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    advancePaid: z.number().min(0).optional(),
    fuelExpense: z.number().min(0).optional(),
    pendingAmount: z.number().min(0).optional(),
    status: z.enum(['Scheduled', 'Active', 'Ended', 'Cancelled']).optional(),
    customerId: z.string().uuid().optional().or(z.literal('')).or(z.literal(null as any)),
  }),
});

export const getTripSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Trip ID format') }),
});

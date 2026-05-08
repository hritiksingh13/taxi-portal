// apps/backend/src/features/cars/car.dto.ts
import { z } from 'zod';

export const createCarSchema = z.object({
  body: z.object({
    brand: z.string().min(2, 'Brand name must be at least 2 characters long'),
    licensePlate: z.string().min(4, 'Invalid license plate format'),
    transmissionType: z.enum(['Automatic', 'Manual']),

    status: z.enum(['Active', 'Maintenance']).default('Active'),
  }),
});

export const updateCarSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Car ID format'),
  }),
  body: z.object({
    brand: z.string().optional(),
    licensePlate: z.string().optional(),
    transmissionType: z.enum(['Automatic', 'Manual']).optional(),

    status: z.enum(['Active', 'Maintenance']).optional(),
    nextMaintenanceDue: z.string().nullable().optional(),
  }),
});

export const getCarSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Car ID format'),
  }),
});

export const moveToMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Car ID format'),
  }),
  body: z.object({
    cost: z.number().min(0, 'Cost must be non-negative').default(0),
    details: z.string().min(1, 'Maintenance details are required'),
    startDate: z.string().optional(),
    endDate: z.string().min(1, 'Expected end date is required'),
  }),
});

export const moveToActiveSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Car ID format'),
  }),
  body: z.object({
    nextMaintenanceDue: z.string().optional(),
  }).optional().default({}),
});

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
  }),
});

export const getCarSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Car ID format'),
  }),
});

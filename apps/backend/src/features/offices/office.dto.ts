// apps/backend/src/features/offices/office.dto.ts
import { z } from 'zod';

export const createOfficeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Office name must be at least 2 characters'),
    location: z.string().min(2, 'Location is required'),
    monthlyRent: z.number().min(0, 'Rent must be non-negative').default(0),
  }),
});

export const updateOfficeSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Office ID') }),
  body: z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    monthlyRent: z.number().min(0).optional(),
  }),
});

export const getOfficeSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Office ID') }),
});

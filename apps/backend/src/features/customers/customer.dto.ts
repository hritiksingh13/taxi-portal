// apps/backend/src/features/customers/customer.dto.ts
import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name must be at least 2 characters'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string().min(7, 'Invalid phone number'),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Customer ID format') }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(7).optional(),
  }),
});

export const getCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Customer ID format') }),
});

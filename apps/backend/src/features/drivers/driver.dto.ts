// apps/backend/src/features/drivers/driver.dto.ts
import { z } from 'zod';

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Driver name must be at least 2 characters'),
    phoneNumber: z.string().min(7, 'Invalid phone number'),
    status: z.enum(['Free', 'Busy', 'Offline']).default('Offline'),
  }),
});

export const updateDriverSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID format') }),
  body: z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    status: z.enum(['Free', 'Busy', 'Offline']).optional(),
  }),
});

export const getDriverSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID format') }),
});

export const assignAgentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID format') }),
  body: z.object({ agentId: z.string().uuid('Invalid Agent ID format') }),
});

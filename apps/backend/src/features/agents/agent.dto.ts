// apps/backend/src/features/agents/agent.dto.ts
import { z } from 'zod';

export const createAgentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Agent name must be at least 2 characters'),
    contactDetails: z.string().min(5, 'Contact details are required'),
  }),
});

export const updateAgentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Agent ID format'),
  }),
  body: z.object({
    name: z.string().optional(),
    contactDetails: z.string().optional(),
  }),
});

export const getAgentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Agent ID format'),
  }),
});

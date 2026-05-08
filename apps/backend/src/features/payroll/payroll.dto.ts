// apps/backend/src/features/payroll/payroll.dto.ts
import { z } from 'zod';

// --- Leaves ---
export const addLeaveSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  body: z.object({
    date: z.string().min(1, 'Leave date is required'),
    reason: z.string().optional(),
  }),
});

export const deleteLeaveSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Driver ID'),
    leaveId: z.string().uuid('Invalid Leave ID'),
  }),
});

export const getLeaveSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  query: z.object({
    month: z.string().regex(/^\d{1,2}$/).optional(),
    year: z.string().regex(/^\d{4}$/).optional(),
  }).optional(),
});

// --- Advances ---
export const addAdvanceSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    date: z.string().optional(),
    note: z.string().optional(),
    deductFromSalary: z.boolean().default(true),
  }),
});

export const deleteAdvanceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Driver ID'),
    advanceId: z.string().uuid('Invalid Advance ID'),
  }),
});

export const getAdvanceSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  query: z.object({
    month: z.string().regex(/^\d{1,2}$/).optional(),
    year: z.string().regex(/^\d{4}$/).optional(),
  }).optional(),
});

// --- Salary Config ---
export const upsertSalaryConfigSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  body: z.object({
    baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  }),
});

// --- Salary Slip Generation ---
export const generateSalarySlipSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
  }),
});

// --- Get slips / download / email ---
export const getSlipsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid Driver ID') }),
});

export const slipActionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Driver ID'),
    slipId: z.string().uuid('Invalid Slip ID'),
  }),
});

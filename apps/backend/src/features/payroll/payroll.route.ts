// apps/backend/src/features/payroll/payroll.route.ts
import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  addLeaveSchema,
  deleteLeaveSchema,
  getLeaveSchema,
  addAdvanceSchema,
  deleteAdvanceSchema,
  getAdvanceSchema,
  upsertSalaryConfigSchema,
  generateSalarySlipSchema,
  getSlipsSchema,
  slipActionSchema,
} from './payroll.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const ctrl = new PayrollController();

// Leaves
router.get('/drivers/:id/leaves', validateRequest(getLeaveSchema), catchAsync(ctrl.getLeaves));
router.post('/drivers/:id/leaves', validateRequest(addLeaveSchema), catchAsync(ctrl.addLeave));
router.delete('/drivers/:id/leaves/:leaveId', validateRequest(deleteLeaveSchema), catchAsync(ctrl.deleteLeave));

// Advances
router.get('/drivers/:id/advances', validateRequest(getAdvanceSchema), catchAsync(ctrl.getAdvances));
router.post('/drivers/:id/advances', validateRequest(addAdvanceSchema), catchAsync(ctrl.addAdvance));
router.delete('/drivers/:id/advances/:advanceId', validateRequest(deleteAdvanceSchema), catchAsync(ctrl.deleteAdvance));

// Salary Config
router.get('/drivers/:id/salary-config', catchAsync(ctrl.getSalaryConfig));
router.put('/drivers/:id/salary-config', validateRequest(upsertSalaryConfigSchema), catchAsync(ctrl.upsertSalaryConfig));

// Live salary calculation (estimate)
router.get('/drivers/:id/salary/calculate', catchAsync(ctrl.calculateSalary));

// Generate salary slip
router.post('/drivers/:id/salary/generate', validateRequest(generateSalarySlipSchema), catchAsync(ctrl.generateSalarySlip));

// Get past salary slips
router.get('/drivers/:id/salary-slips', validateRequest(getSlipsSchema), catchAsync(ctrl.getSalarySlips));

// Download / Email a specific slip
router.get('/drivers/:id/salary-slips/:slipId/download', validateRequest(slipActionSchema), catchAsync(ctrl.downloadSalarySlip));
router.post('/drivers/:id/salary-slips/:slipId/send-email', validateRequest(slipActionSchema), catchAsync(ctrl.emailSalarySlip));

export default router;

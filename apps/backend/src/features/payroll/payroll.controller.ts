// apps/backend/src/features/payroll/payroll.controller.ts
import { Request, Response } from 'express';
import { PayrollService } from './payroll.service';

const payrollService = new PayrollService();

export class PayrollController {
  // ── Leaves ──────────────────────────────────────────────────────

  getLeaves = async (req: Request, res: Response) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const leaves = await payrollService.getLeaves(req.params.id, month, year);
    res.status(200).json({ status: 'success', data: { leaves } });
  };

  addLeave = async (req: Request, res: Response) => {
    const leave = await payrollService.addLeave(req.params.id, req.body);
    res.status(201).json({ status: 'success', data: { leave } });
  };

  deleteLeave = async (req: Request, res: Response) => {
    await payrollService.deleteLeave(req.params.id, req.params.leaveId);
    res.status(204).json({ status: 'success', data: null });
  };

  // ── Advances ────────────────────────────────────────────────────

  getAdvances = async (req: Request, res: Response) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const advances = await payrollService.getAdvances(req.params.id, month, year);
    res.status(200).json({ status: 'success', data: { advances } });
  };

  addAdvance = async (req: Request, res: Response) => {
    const advance = await payrollService.addAdvance(req.params.id, req.body);
    res.status(201).json({ status: 'success', data: { advance } });
  };

  deleteAdvance = async (req: Request, res: Response) => {
    await payrollService.deleteAdvance(req.params.id, req.params.advanceId);
    res.status(204).json({ status: 'success', data: null });
  };

  // ── Salary Config ───────────────────────────────────────────────

  getSalaryConfig = async (req: Request, res: Response) => {
    const config = await payrollService.getSalaryConfig(req.params.id);
    res.status(200).json({ status: 'success', data: { config } });
  };

  upsertSalaryConfig = async (req: Request, res: Response) => {
    const config = await payrollService.upsertSalaryConfig(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { config } });
  };

  // ── Salary Calculation (live estimate) ──────────────────────────

  calculateSalary = async (req: Request, res: Response) => {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!month || !year) {
      res.status(400).json({ status: 'fail', message: 'month and year query params required' });
      return;
    }
    const calculation = await payrollService.calculateSalary(req.params.id, month, year);
    res.status(200).json({ status: 'success', data: { calculation } });
  };

  // ── Generate Salary Slip ────────────────────────────────────────

  generateSalarySlip = async (req: Request, res: Response) => {
    const slip = await payrollService.generateSalarySlip(req.params.id, req.body.month, req.body.year);
    res.status(201).json({ status: 'success', data: { slip } });
  };

  // ── Get Past Salary Slips ───────────────────────────────────────

  getSalarySlips = async (req: Request, res: Response) => {
    const slips = await payrollService.getSalarySlips(req.params.id);
    res.status(200).json({ status: 'success', data: { slips } });
  };

  // ── Download Salary Slip HTML ───────────────────────────────────

  downloadSalarySlip = async (req: Request, res: Response) => {
    const html = await payrollService.getSalarySlipHtml(req.params.id, req.params.slipId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  };

  // ── Email Salary Slip ───────────────────────────────────────────

  emailSalarySlip = async (req: Request, res: Response) => {
    await payrollService.emailSalarySlip(req.params.id, req.params.slipId);
    res.status(200).json({ status: 'success', message: 'Salary slip emailed to driver.' });
  };
}

// apps/backend/src/features/payroll/payroll.service.ts
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';
import { EmailService } from '../email/email.service';

const prisma = new PrismaClient();
const emailService = new EmailService();

export class PayrollService {
  // ── Leaves ───────────────────────────────────────────────────────────────────

  async getLeaves(driverId: string, month?: number, year?: number) {
    await this.ensureDriver(driverId);
    const where: any = { driverId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.date = { gte: start, lt: end };
    }
    return prisma.driverLeave.findMany({ where, orderBy: { date: 'desc' } });
  }

  async addLeave(driverId: string, data: { date: string; reason?: string }) {
    await this.ensureDriver(driverId);
    return prisma.driverLeave.create({
      data: { driverId, date: new Date(data.date), reason: data.reason },
    });
  }

  async deleteLeave(driverId: string, leaveId: string) {
    const leave = await prisma.driverLeave.findUnique({ where: { id: leaveId } });
    if (!leave || leave.driverId !== driverId) throw new AppError('Leave not found', 404);
    await prisma.driverLeave.delete({ where: { id: leaveId } });
  }

  // ── Advances ─────────────────────────────────────────────────────────────────

  async getAdvances(driverId: string, month?: number, year?: number) {
    await this.ensureDriver(driverId);
    const where: any = { driverId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      where.date = { gte: start, lt: end };
    }
    return prisma.driverAdvance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async addAdvance(driverId: string, data: { amount: number; date?: string; note?: string; deductFromSalary?: boolean }) {
    await this.ensureDriver(driverId);
    return prisma.driverAdvance.create({
      data: {
        driverId,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note,
        deductFromSalary: data.deductFromSalary ?? true,
      },
    });
  }

  async deleteAdvance(driverId: string, advanceId: string) {
    const adv = await prisma.driverAdvance.findUnique({ where: { id: advanceId } });
    if (!adv || adv.driverId !== driverId) throw new AppError('Advance not found', 404);
    await prisma.driverAdvance.delete({ where: { id: advanceId } });
  }

  // ── Salary Config ────────────────────────────────────────────────────────────

  async getSalaryConfig(driverId: string) {
    await this.ensureDriver(driverId);
    return prisma.driverSalaryConfig.findUnique({ where: { driverId } });
  }

  async upsertSalaryConfig(driverId: string, data: { baseSalary: number }) {
    await this.ensureDriver(driverId);
    return prisma.driverSalaryConfig.upsert({
      where: { driverId },
      update: { baseSalary: data.baseSalary },
      create: { driverId, baseSalary: data.baseSalary },
    });
  }

  // ── Salary Calculation ───────────────────────────────────────────────────────

  async calculateSalary(driverId: string, month: number, year: number) {
    await this.ensureDriver(driverId);
    const config = await prisma.driverSalaryConfig.findUnique({ where: { driverId } });
    if (!config) throw new AppError('Salary config not set for this driver', 400);

    const baseSalary = config.baseSalary;
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const leaves = await prisma.driverLeave.findMany({
      where: { driverId, date: { gte: monthStart, lt: monthEnd } },
    });
    const totalLeaves = leaves.length;

    const advances = await prisma.driverAdvance.findMany({
      where: { driverId, date: { gte: monthStart, lt: monthEnd } },
    });
    const deductibleAdvances = advances
      .filter((a) => a.deductFromSalary)
      .reduce((sum, a) => sum + a.amount, 0);
    const totalAdvancesAmount = advances.reduce((sum, a) => sum + a.amount, 0);

    const leaveDeduction = totalLeaves > 0 ? (baseSalary / daysInMonth) * totalLeaves : 0;
    const netSalary = Math.max(0, baseSalary - leaveDeduction - deductibleAdvances);

    return {
      baseSalary,
      daysInMonth,
      totalLeaves,
      leaveDeduction: Math.round(leaveDeduction * 100) / 100,
      totalAdvances: Math.round(deductibleAdvances * 100) / 100,
      totalAdvancesAll: Math.round(totalAdvancesAmount * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
    };
  }

  // ── Generate & Persist Salary Slip ───────────────────────────────────────────

  async generateSalarySlip(driverId: string, month: number, year: number) {
    const calc = await this.calculateSalary(driverId, month, year);

    const slip = await prisma.salarySlip.upsert({
      where: { driverId_month_year: { driverId, month, year } },
      update: {
        baseSalary: calc.baseSalary,
        totalLeaves: calc.totalLeaves,
        leaveDeduction: calc.leaveDeduction,
        totalAdvances: calc.totalAdvances,
        netSalary: calc.netSalary,
        generatedAt: new Date(),
      },
      create: {
        driverId,
        month,
        year,
        baseSalary: calc.baseSalary,
        totalLeaves: calc.totalLeaves,
        leaveDeduction: calc.leaveDeduction,
        totalAdvances: calc.totalAdvances,
        netSalary: calc.netSalary,
      },
    });

    return slip;
  }

  // ── Get salary slips (past) ──────────────────────────────────────────────────

  async getSalarySlips(driverId: string) {
    await this.ensureDriver(driverId);
    return prisma.salarySlip.findMany({
      where: { driverId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // ── Get slip by ID ───────────────────────────────────────────────────────────

  async getSalarySlipById(driverId: string, slipId: string) {
    const slip = await prisma.salarySlip.findUnique({ where: { id: slipId } });
    if (!slip || slip.driverId !== driverId) throw new AppError('Salary slip not found', 404);
    return slip;
  }

  // ── Generate HTML for salary slip ────────────────────────────────────────────

  async getSalarySlipHtml(driverId: string, slipId: string) {
    const driver = await this.ensureDriver(driverId);
    const slip = await this.getSalarySlipById(driverId, slipId);
    const monthName = new Date(slip.year, slip.month - 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });

    return `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Salary Slip - ${driver.name} - ${monthName}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1e293b; }
  .header { text-align: center; border-bottom: 2px solid #2855ff; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; margin: 0; color: #2855ff; }
  .header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
  .info-row .label { color: #64748b; }
  .info-row .value { font-weight: 600; color: #1e293b; }
  .divider { border-top: 1px solid #e2e8f0; margin: 16px 0; }
  .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #2855ff; margin-top: 12px; padding-top: 12px; border-top: 2px solid #2855ff; }
  .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; }
  @media print { body { margin: 0; } }
</style>
</head><body>
<div class="header">
  <h1>Naina Travels</h1>
  <p>Salary Slip &mdash; ${monthName}</p>
</div>
<div class="info-row"><span class="label">Employee Name</span><span class="value">${driver.name}</span></div>
<div class="info-row"><span class="label">Phone</span><span class="value">${driver.phoneNumber}</span></div>
<div class="info-row"><span class="label">Period</span><span class="value">${monthName}</span></div>
<div class="divider"></div>
<div class="info-row"><span class="label">Base Salary</span><span class="value">&#8377;${slip.baseSalary.toLocaleString('en-IN')}</span></div>
<div class="info-row"><span class="label">Total Leaves</span><span class="value">${slip.totalLeaves} days</span></div>
<div class="info-row"><span class="label">Leave Deduction</span><span class="value" style="color:#ef4444">- &#8377;${slip.leaveDeduction.toLocaleString('en-IN')}</span></div>
<div class="info-row"><span class="label">Advances (Deducted)</span><span class="value" style="color:#ef4444">- &#8377;${slip.totalAdvances.toLocaleString('en-IN')}</span></div>
<div class="total-row"><span>Net Salary</span><span>&#8377;${slip.netSalary.toLocaleString('en-IN')}</span></div>
<div class="footer">
  <p>Generated on ${new Date(slip.generatedAt).toLocaleDateString('en-IN')}</p>
  <p>This is a computer-generated document.</p>
</div>
</body></html>`;
  }

  // ── Email salary slip to driver ──────────────────────────────────────────────

  async emailSalarySlip(driverId: string, slipId: string) {
    const driver = await this.ensureDriver(driverId);
    if (!driver.email) {
      throw new AppError('Driver does not have an email address on file.', 400);
    }
    const html = await this.getSalarySlipHtml(driverId, slipId);
    const slip = await this.getSalarySlipById(driverId, slipId);
    const monthName = new Date(slip.year, slip.month - 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });

    await emailService.sendEmail({
      to: driver.email,
      subject: `Salary Slip - ${monthName} | Naina Travels`,
      body: html,
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async ensureDriver(driverId: string) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new AppError('Driver not found', 404);
    return driver;
  }
}

// apps/backend/src/features/dashboard/dashboard.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalCars,
      activeCars,
      maintenanceCars,
      totalDrivers,
      freeDrivers,
      busyDrivers,
      offlineDrivers,
      totalAgents,
      activeTrips,
      scheduledTrips,
      totalTrips,
      totalCustomers,
      totalRevenue,
      totalFuelExpense,
      totalPending,
      upcomingMaintenance,
      overdueMaintenance,
      // Expense data
      currentMonthMaintCost,
      allMaintenanceRecords,
      allSalarySlips,
      totalOfficeRent,
    ] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'Active' } }),
      prisma.car.count({ where: { status: 'Maintenance' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'Free' } }),
      prisma.driver.count({ where: { status: 'Busy' } }),
      prisma.driver.count({ where: { status: 'Offline' } }),
      prisma.agent.count(),
      prisma.trip.count({ where: { status: 'Active' } }),
      prisma.trip.count({ where: { status: 'Scheduled' } }),
      prisma.trip.count(),
      prisma.customer.count(),
      prisma.trip.aggregate({ _sum: { advancePaid: true } }),
      prisma.trip.aggregate({ _sum: { fuelExpense: true } }),
      prisma.trip.aggregate({ _sum: { pendingAmount: true } }),
      // Cars with upcoming maintenance within next 7 days
      prisma.car.findMany({
        where: {
          nextMaintenanceDue: { gte: now, lte: sevenDaysFromNow },
          status: 'Active',
        },
        orderBy: { nextMaintenanceDue: 'asc' },
      }),
      // Cars with overdue maintenance (past due date but still active)
      prisma.car.findMany({
        where: {
          nextMaintenanceDue: { lt: now },
          status: 'Active',
        },
        orderBy: { nextMaintenanceDue: 'asc' },
      }),
      // Current month maintenance cost
      prisma.maintenanceRecord.aggregate({
        _sum: { cost: true },
        where: { startDate: { gte: currentMonthStart, lt: currentMonthEnd } },
      }),
      // All maintenance records for monthly breakdown
      prisma.maintenanceRecord.findMany({
        select: { cost: true, startDate: true },
      }),
      // All salary slips for monthly driver expense
      prisma.salarySlip.findMany({
        select: { month: true, year: true, netSalary: true },
      }),
      // Total office rent
      prisma.office.aggregate({ _sum: { monthlyRent: true } }),
    ]);

    // Group maintenance costs by month
    const maintByMonth = new Map<string, number>();
    allMaintenanceRecords.forEach((r) => {
      const d = new Date(r.startDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      maintByMonth.set(key, (maintByMonth.get(key) || 0) + r.cost);
    });
    const maintenanceCostByMonth = Array.from(maintByMonth.entries()).map(([key, cost]) => {
      const [year, month] = key.split('-').map(Number);
      return { month, year, cost: Math.round(cost * 100) / 100 };
    }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    // Group driver expenses by month
    const driverByMonth = new Map<string, number>();
    allSalarySlips.forEach((s) => {
      const key = `${s.year}-${s.month}`;
      driverByMonth.set(key, (driverByMonth.get(key) || 0) + s.netSalary);
    });
    const driverExpenseByMonth = Array.from(driverByMonth.entries()).map(([key, cost]) => {
      const [year, month] = key.split('-').map(Number);
      return { month, year, cost: Math.round(cost * 100) / 100 };
    }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    // Current month driver expense
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const driverExpenseCurrentMonth = driverExpenseByMonth
      .filter((d) => d.month === currentMonth && d.year === currentYear)
      .reduce((sum, d) => sum + d.cost, 0);

    const totalDriverExpenseValue = allSalarySlips.reduce((sum, s) => sum + s.netSalary, 0);
    const totalMaintExpenseValue = allMaintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
    const fuelExpenseValue = totalFuelExpense._sum.fuelExpense ?? 0;
    const officeRentValue = totalOfficeRent._sum.monthlyRent ?? 0;

    return {
      cars: { total: totalCars, active: activeCars, maintenance: maintenanceCars },
      drivers: { total: totalDrivers, free: freeDrivers, busy: busyDrivers, offline: offlineDrivers },
      agents: { total: totalAgents },
      trips: { active: activeTrips, scheduled: scheduledTrips, total: totalTrips },
      customers: { total: totalCustomers },
      financials: {
        totalRevenue: totalRevenue._sum.advancePaid ?? 0,
        totalFuelExpense: fuelExpenseValue,
        totalPending: totalPending._sum.pendingAmount ?? 0,
      },
      maintenance: {
        upcoming: upcomingMaintenance,
        overdue: overdueMaintenance,
      },
      expenses: {
        maintenanceCostCurrentMonth: currentMonthMaintCost._sum.cost ?? 0,
        maintenanceCostByMonth,
        driverExpenseCurrentMonth,
        driverExpenseByMonth,
        totalDriverExpense: Math.round(totalDriverExpenseValue * 100) / 100,
        totalOfficeRent: officeRentValue,
        totalExpense: Math.round((fuelExpenseValue + totalMaintExpenseValue + totalDriverExpenseValue + officeRentValue) * 100) / 100,
      },
    };
  }
}


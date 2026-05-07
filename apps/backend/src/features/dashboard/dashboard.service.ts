// apps/backend/src/features/dashboard/dashboard.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
    ]);

    return {
      cars: { total: totalCars, active: activeCars, maintenance: maintenanceCars },
      drivers: { total: totalDrivers, free: freeDrivers, busy: busyDrivers, offline: offlineDrivers },
      agents: { total: totalAgents },
      trips: { active: activeTrips, scheduled: scheduledTrips, total: totalTrips },
      customers: { total: totalCustomers },
      financials: {
        totalRevenue: totalRevenue._sum.advancePaid ?? 0,
        totalFuelExpense: totalFuelExpense._sum.fuelExpense ?? 0,
        totalPending: totalPending._sum.pendingAmount ?? 0,
      },
      maintenance: {
        upcoming: upcomingMaintenance,
        overdue: overdueMaintenance,
      },
    };
  }
}

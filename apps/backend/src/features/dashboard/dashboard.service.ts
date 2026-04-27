// apps/backend/src/features/dashboard/dashboard.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getStats() {
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
    ] = await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: 'Active' } }),
      prisma.car.count({ where: { status: 'Maintenance' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'Free' } }),
      prisma.driver.count({ where: { status: 'Busy' } }),
      prisma.driver.count({ where: { status: 'Offline' } }),
      prisma.agent.count(),
      prisma.trip.count({ where: { driver: { status: 'Busy' } } }),
    ]);

    return {
      cars: { total: totalCars, active: activeCars, maintenance: maintenanceCars },
      drivers: { total: totalDrivers, free: freeDrivers, busy: busyDrivers, offline: offlineDrivers },
      agents: { total: totalAgents },
      trips: { active: activeTrips },
    };
  }
}

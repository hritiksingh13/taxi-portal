// apps/backend/src/features/drivers/driver.service.ts
import { PrismaClient, Driver, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

// io is imported lazily to avoid circular dependency
let _io: any = null;
export const setIo = (io: any) => { _io = io; };

export class DriverService {
  async getAllDrivers(): Promise<Driver[]> {
    return await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        car: { select: { id: true, brand: true, licensePlate: true, status: true } },
        driverAgents: {
          include: { agent: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async getDriverById(id: string): Promise<Driver> {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        car: true,
        driverAgents: { include: { agent: true } },
        trips: { orderBy: { startTime: 'desc' }, take: 5 },
      },
    });

    if (!driver) throw new AppError('Driver not found', 404);
    return driver;
  }

  async getDriversByStatus() {
    const [free, busy, offline] = await Promise.all([
      prisma.driver.findMany({
        where: { status: 'Free' },
        include: { car: true, driverAgents: { include: { agent: true } } },
      }),
      prisma.driver.findMany({
        where: { status: 'Busy' },
        include: {
          car: true,
          driverAgents: { include: { agent: true } },
          trips: {
            orderBy: { startTime: 'desc' },
            take: 1,
            include: { agent: true },
          },
        },
      }),
      prisma.driver.findMany({
        where: { status: 'Offline' },
        include: { car: true },
      }),
    ]);

    return { free, busy, offline };
  }

  async createDriver(data: Prisma.DriverCreateInput): Promise<Driver> {
    const existing = await prisma.driver.findUnique({
      where: { phoneNumber: (data as any).phoneNumber },
    });
    if (existing) throw new AppError('A driver with this phone number already exists', 409);
    return await prisma.driver.create({ data });
  }

  async updateDriver(id: string, data: Prisma.DriverUpdateInput): Promise<Driver> {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new AppError('Driver not found', 404);
    return await prisma.driver.update({ where: { id }, data });
  }

  async deleteDriver(id: string): Promise<void> {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new AppError('Driver not found', 404);
    await prisma.driver.delete({ where: { id } });
  }

  async assignCar(driverId: string, carId: string): Promise<Driver> {
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car || car.status !== 'Active') {
      throw new AppError('Car is unavailable or in maintenance', 400);
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: { carId },
      include: { car: true, driverAgents: { include: { agent: true } } },
    });

    if (_io) _io.to('dashboard_room').emit('telemetry:driver_updated', updatedDriver);
    return updatedDriver;
  }

  async assignAgent(driverId: string, agentId: string): Promise<void> {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new AppError('Driver not found', 404);

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new AppError('Agent not found', 404);

    await prisma.driverAgent.upsert({
      where: { driverId_agentId: { driverId, agentId } },
      update: {},
      create: { driverId, agentId },
    });
  }

  async removeAgent(driverId: string, agentId: string): Promise<void> {
    const link = await prisma.driverAgent.findUnique({
      where: { driverId_agentId: { driverId, agentId } },
    });
    if (!link) throw new AppError('Assignment not found', 404);

    await prisma.driverAgent.delete({
      where: { driverId_agentId: { driverId, agentId } },
    });
  }
}

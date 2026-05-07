// apps/backend/src/features/cars/car.service.ts
import { PrismaClient, Car, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class CarService {
  async getAllCars(): Promise<any[]> {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        maintenanceRecords: {
          where: { endDate: null },
          take: 1,
          orderBy: { startDate: 'desc' },
        },
      },
    });

    // Determine which cars are currently on an active/scheduled trip
    const activeTripCarIds = await prisma.trip.findMany({
      where: { status: { in: ['Active', 'Scheduled'] } },
      select: { carId: true },
    });
    const onTripCarIdSet = new Set(activeTripCarIds.map((t) => t.carId));

    return cars.map((car) => ({
      ...car,
      activeMaintenanceRecord: car.maintenanceRecords[0] || null,
      isOnTrip: onTripCarIdSet.has(car.id),
      maintenanceRecords: undefined, // remove raw array from response
    }));
  }

  async getCarById(id: string): Promise<Car> {
    const car = await prisma.car.findUnique({
      where: { id },
    });

    if (!car) {
      throw new AppError('Car not found', 404);
    }
    return car;
  }

  async createCar(data: Prisma.CarCreateInput): Promise<Car> {
    const existing = await prisma.car.findUnique({
      where: { licensePlate: data.licensePlate },
    });
    if (existing) {
      throw new AppError('A car with this license plate already exists', 409);
    }

    return await prisma.car.create({ data });
  }

  async updateCar(id: string, data: any): Promise<Car> {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    const updateData: any = { ...data };
    if ('nextMaintenanceDue' in data) {
      updateData.nextMaintenanceDue = data.nextMaintenanceDue
        ? new Date(data.nextMaintenanceDue)
        : null;
    }

    return await prisma.car.update({ where: { id }, data: updateData });
  }

  async deleteCar(id: string): Promise<void> {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    // Check if car is on any active or scheduled trip
    const activeTrip = await prisma.trip.findFirst({
      where: {
        carId: id,
        status: { in: ['Active', 'Scheduled'] },
      },
    });

    if (activeTrip) {
      throw new AppError(
        'Cannot delete this vehicle: it is currently assigned to an active or scheduled trip. End or cancel the trip first.',
        400
      );
    }

    // Delete all trips that reference this car first (past ones), then delete car
    // Since Trip has onDelete: Restrict, we need to delete past trips first
    await prisma.trip.deleteMany({ where: { carId: id } });
    await prisma.car.delete({ where: { id } });
  }

  async moveToMaintenance(
    carId: string,
    data: { cost: number; details: string; startDate?: string; endDate: string }
  ) {
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new AppError('Car not found', 404);
    if (car.status === 'Maintenance') {
      throw new AppError('Car is already under maintenance', 400);
    }

    // Check if car is on an active/scheduled trip
    const activeTrip = await prisma.trip.findFirst({
      where: {
        carId,
        status: { in: ['Active', 'Scheduled'] },
      },
    });
    if (activeTrip) {
      throw new AppError(
        'Cannot move to maintenance: vehicle is currently assigned to an active or scheduled trip.',
        400
      );
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = new Date(data.endDate);

    return await prisma.$transaction(async (tx) => {
      // Create maintenance record
      await tx.maintenanceRecord.create({
        data: {
          carId,
          cost: data.cost,
          details: data.details,
          startDate,
          endDate,
        },
      });

      // Update car status
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          status: 'Maintenance',
          nextMaintenanceDue: null,
        },
        include: {
          maintenanceRecords: {
            where: { endDate: { not: null } },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      });

      // Re-fetch the active (current) maintenance record
      const activeRecord = await tx.maintenanceRecord.findFirst({
        where: { carId, endDate: { not: null } },
        orderBy: { startDate: 'desc' },
      });

      return {
        ...updatedCar,
        activeMaintenanceRecord: activeRecord,
        isOnTrip: false,
        maintenanceRecords: undefined,
      };
    });
  }

  async moveToActive(carId: string, data?: { nextMaintenanceDue?: string }) {
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new AppError('Car not found', 404);
    if (car.status === 'Active') {
      throw new AppError('Car is already active', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // Close the current open maintenance record
      const openRecord = await tx.maintenanceRecord.findFirst({
        where: { carId, endDate: null },
        orderBy: { startDate: 'desc' },
      });

      if (openRecord) {
        await tx.maintenanceRecord.update({
          where: { id: openRecord.id },
          data: { endDate: new Date() },
        });
      }

      // Update car status
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          status: 'Active',
          lastMaintenanceDate: new Date(),
          nextMaintenanceDue: data?.nextMaintenanceDue
            ? new Date(data.nextMaintenanceDue)
            : null,
        },
      });

      return {
        ...updatedCar,
        activeMaintenanceRecord: null,
        isOnTrip: false,
      };
    });
  }

  async getMaintenanceHistory(carId: string) {
    const car = await prisma.car.findUnique({ where: { id: carId } });
    if (!car) throw new AppError('Car not found', 404);

    const records = await prisma.maintenanceRecord.findMany({
      where: { carId, endDate: { not: null } },
      orderBy: { startDate: 'desc' },
    });

    return records;
  }
}

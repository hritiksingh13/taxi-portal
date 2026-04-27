// apps/backend/src/features/cars/car.service.ts
import { PrismaClient, Car, Prisma } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

export class CarService {
  async getAllCars(): Promise<Car[]> {
    return await prisma.car.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        drivers: {
          select: { id: true, name: true, status: true },
        },
      },
    });
  }

  async getCarById(id: string): Promise<Car> {
    const car = await prisma.car.findUnique({
      where: { id },
      include: { drivers: true },
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

  async updateCar(id: string, data: Prisma.CarUpdateInput): Promise<Car> {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    return await prisma.car.update({ where: { id }, data });
  }

  async deleteCar(id: string): Promise<void> {
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new AppError('Car not found', 404);
    }

    await prisma.car.delete({ where: { id } });
  }
}

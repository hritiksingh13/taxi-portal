// apps/backend/src/features/trips/trip.service.ts
import { PrismaClient, Trip } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';
import crypto from 'crypto';

const prisma = new PrismaClient();

// io is set by server.ts after initialization to avoid circular imports
let _io: any = null;
export const setIo = (io: any) => { _io = io; };

export class TripService {
  async initiateTrip(data: {
    driverId: string;
    carId: string;
    agentId: string;
    stops: string[];
    estimatedDurationMinutes?: number;
    startDate?: string;
    endDate?: string;
    customerId?: string;
    advancePaid?: number;
    fuelExpense?: number;
    pendingAmount?: number;
  }): Promise<Trip> {
    const trip = await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.findUnique({ where: { id: data.driverId } });

      if (!driver) throw new AppError('Driver not found', 404);
      if (driver.status !== 'Free') {
        throw new AppError(`Driver cannot accept a trip. Current status: ${driver.status}`, 400);
      }

      // Verify the agent exists
      const agentExists = await tx.agent.findUnique({ where: { id: data.agentId } });
      if (!agentExists) throw new AppError('Agent not found', 404);

      // Verify the car exists and is active
      const car = await tx.car.findUnique({ where: { id: data.carId } });
      if (!car) throw new AppError('Vehicle not found', 404);
      if (car.status !== 'Active') throw new AppError('Vehicle is not active (currently under maintenance)', 400);

      // Verify customer if provided
      if (data.customerId) {
        const customerExists = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!customerExists) throw new AppError('Customer not found', 404);
      }

      const estimatedCompletion = data.estimatedDurationMinutes 
        ? new Date(Date.now() + data.estimatedDurationMinutes * 60000) 
        : null;

      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      const endDate = data.endDate ? new Date(data.endDate) : estimatedCompletion;

      const shareToken = crypto.randomUUID();

      const newTrip = await tx.trip.create({
        data: {
          driverId: data.driverId,
          carId: data.carId,
          agentId: data.agentId,
          stops: data.stops,
          estimatedCompletion,
          startDate,
          endDate,
          customerId: data.customerId || null,
          advancePaid: data.advancePaid ?? 0,
          fuelExpense: data.fuelExpense ?? 0,
          pendingAmount: data.pendingAmount ?? 0,
          shareToken,
          status: 'Active',
        },
        include: { driver: true, car: true, agent: true, customer: true },
      });

      // Atomically mark driver as Busy
      await tx.driver.update({
        where: { id: data.driverId },
        data: { status: 'Busy' },
      });

      return newTrip;
    });

    // Broadcast the state change to the React dashboard
    if (_io) _io.to('dashboard_room').emit('telemetry:trip_started', trip);

    return trip;
  }

  async getActiveTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      where: { status: 'Active' },
      include: { driver: true, car: true, agent: true, customer: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      include: { driver: true, car: true, agent: true, customer: true, feedback: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getPastTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      where: { status: { in: ['Ended', 'Cancelled'] } },
      include: { driver: true, car: true, agent: true, customer: true, feedback: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getTripById(tripId: string): Promise<Trip> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, car: true, agent: true, customer: true, feedback: true },
    });
    if (!trip) throw new AppError('Trip not found', 404);
    return trip;
  }

  async updateTrip(tripId: string, data: any): Promise<Trip> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Trip not found', 404);

    const updateData: any = {};
    if (data.stops) updateData.stops = data.stops;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.estimatedDurationMinutes !== undefined) {
      updateData.estimatedCompletion = data.estimatedDurationMinutes 
        ? new Date(Date.now() + data.estimatedDurationMinutes * 60000) 
        : null;
    }
    if (data.advancePaid !== undefined) updateData.advancePaid = data.advancePaid;
    if (data.fuelExpense !== undefined) updateData.fuelExpense = data.fuelExpense;
    if (data.pendingAmount !== undefined) updateData.pendingAmount = data.pendingAmount;
    if (data.status) updateData.status = data.status;
    if (data.carId) updateData.carId = data.carId;
    if (data.customerId !== undefined) {
      updateData.customerId = data.customerId || null;
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: { driver: true, car: true, agent: true, customer: true, feedback: true },
    });

    return updatedTrip;
  }

  async completeTrip(tripId: string): Promise<Trip> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true },
    });
    if (!trip) throw new AppError('Trip not found', 404);

    // Mark trip as Ended and free up the driver
    await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: 'Ended' },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'Free' },
      });
    });

    const updatedTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, car: true, agent: true, customer: true },
    });

    if (_io) _io.to('dashboard_room').emit('telemetry:trip_completed', updatedTrip);

    return updatedTrip!;
  }

  async getTripByShareToken(shareToken: string): Promise<Trip> {
    const trip = await prisma.trip.findUnique({
      where: { shareToken },
      include: {
        driver: { select: { name: true, phoneNumber: true } },
        car: { select: { brand: true, licensePlate: true } },
        agent: { select: { name: true } },
        customer: true,
        feedback: true,
      },
    });
    if (!trip) throw new AppError('Trip not found. Invalid or expired link.', 404);
    return trip;
  }

  async deleteTrip(tripId: string): Promise<void> {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Trip not found', 404);
    
    if (trip.status === 'Active') {
      await prisma.$transaction(async (tx) => {
        await tx.trip.delete({ where: { id: tripId } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'Free' } });
      });
    } else {
      await prisma.trip.delete({ where: { id: tripId } });
    }
  }
}

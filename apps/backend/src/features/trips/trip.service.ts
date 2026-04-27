// apps/backend/src/features/trips/trip.service.ts
import { PrismaClient, Trip } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';

const prisma = new PrismaClient();

// io is set by server.ts after initialization to avoid circular imports
let _io: any = null;
export const setIo = (io: any) => { _io = io; };

export class TripService {
  async initiateTrip(data: {
    driverId: string;
    agentId: string;
    currentLocation: string;
    destination: string;
    estimatedDurationMinutes: number;
  }): Promise<Trip> {
    const trip = await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.findUnique({ where: { id: data.driverId } });

      if (!driver) throw new AppError('Driver not found', 404);
      if (driver.status !== 'Free') {
        throw new AppError(`Driver cannot accept a trip. Current status: ${driver.status}`, 400);
      }

      // Verify the agent-driver relationship exists
      const agentExists = await tx.agent.findUnique({ where: { id: data.agentId } });
      if (!agentExists) throw new AppError('Agent not found', 404);

      const estimatedCompletion = new Date(
        Date.now() + data.estimatedDurationMinutes * 60000
      );

      const newTrip = await tx.trip.create({
        data: {
          driverId: data.driverId,
          agentId: data.agentId,
          currentLocation: data.currentLocation,
          destination: data.destination,
          estimatedCompletion,
        },
        include: { driver: true, agent: true },
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
      where: { driver: { status: 'Busy' } },
      include: { driver: { include: { car: true } }, agent: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      include: { driver: true, agent: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async completeTrip(tripId: string): Promise<Trip> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true },
    });
    if (!trip) throw new AppError('Trip not found', 404);

    // Free up the driver
    await prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: 'Free' },
    });

    const updatedTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, agent: true },
    });

    if (_io) _io.to('dashboard_room').emit('telemetry:trip_completed', updatedTrip);

    return updatedTrip!;
  }
}

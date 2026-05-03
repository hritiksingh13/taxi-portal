// apps/backend/src/features/trips/trip.service.ts
import { PrismaClient, Trip } from '@prisma/client';
import { AppError } from '../../core/exceptions/global.exception';
import crypto from 'crypto';

const prisma = new PrismaClient();

// io is set by server.ts after initialization to avoid circular imports
let _io: any = null;
export const setIo = (io: any) => { _io = io; };

export class TripService {

  /**
   * Check if a driver has any existing trips that overlap with the given date range.
   * Overlap condition: existingStart < newEnd AND existingEnd > newStart
   */
  async checkScheduleConflict(
    driverId: string,
    startDate: Date,
    endDate: Date,
    excludeTripId?: string
  ): Promise<{ hasConflict: boolean; conflictingTrip?: any }> {
    const whereClause: any = {
      driverId,
      status: { notIn: ['Ended', 'Cancelled'] },
      // Overlap: existing trip starts before new trip ends AND existing trip ends after new trip starts
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    };

    if (excludeTripId) {
      whereClause.id = { not: excludeTripId };
    }

    const conflictingTrip = await prisma.trip.findFirst({
      where: whereClause,
      include: { driver: { select: { name: true } } },
      orderBy: { startDate: 'asc' },
    });

    return {
      hasConflict: !!conflictingTrip,
      conflictingTrip,
    };
  }

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
      if (driver.status === 'Offline') {
        throw new AppError('Driver is offline and cannot accept trips.', 400);
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

      const now = new Date();
      const startDate = data.startDate ? new Date(data.startDate) : new Date();

      const estimatedCompletion = data.estimatedDurationMinutes 
        ? new Date(startDate.getTime() + data.estimatedDurationMinutes * 60000) 
        : null;

      // endDate is required for conflict checking. Default to startDate + 1 day if not provided.
      let endDate: Date;
      if (data.endDate) {
        endDate = new Date(data.endDate);
      } else if (estimatedCompletion) {
        endDate = estimatedCompletion;
      } else {
        endDate = new Date(startDate.getTime() + 24 * 60 * 60000); // default: +1 day
      }

      if (endDate <= startDate) {
        throw new AppError('End date must be after start date.', 400);
      }

      // Check for schedule conflicts with this driver
      const { hasConflict, conflictingTrip } = await this.checkScheduleConflict(
        data.driverId, startDate, endDate
      );

      if (hasConflict) {
        const cStart = new Date(conflictingTrip.startDate).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const cEnd = new Date(conflictingTrip.endDate).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        throw new AppError(
          `Schedule conflict: Driver "${driver.name}" already has a trip from ${cStart} to ${cEnd} that overlaps with this time slot.`,
          409
        );
      }

      // Determine trip status based on dates
      const tripStatus = startDate > now ? 'Scheduled' : 'Active';

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
          status: tripStatus,
        },
        include: { driver: true, car: true, agent: true, customer: true },
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

  async getScheduledTrips(): Promise<Trip[]> {
    return await prisma.trip.findMany({
      where: { status: 'Scheduled' },
      include: { driver: true, car: true, agent: true, customer: true },
      orderBy: { startDate: 'asc' },
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

    // If dates are being changed, validate for schedule conflicts
    const newStartDate = updateData.startDate || trip.startDate;
    const newEndDate = updateData.endDate || trip.endDate;

    if ((data.startDate || data.endDate) && newEndDate) {
      if (newEndDate <= newStartDate) {
        throw new AppError('End date must be after start date.', 400);
      }

      const { hasConflict, conflictingTrip } = await this.checkScheduleConflict(
        trip.driverId, newStartDate, newEndDate, tripId
      );

      if (hasConflict) {
        const cStart = new Date(conflictingTrip.startDate).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const cEnd = new Date(conflictingTrip.endDate).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const driverInfo = await prisma.driver.findUnique({ where: { id: trip.driverId } });
        throw new AppError(
          `Schedule conflict: Driver "${driverInfo?.name}" already has a trip from ${cStart} to ${cEnd} that overlaps with the new time slot.`,
          409
        );
      }

      // Auto-update status based on new dates (only if not manually ended/cancelled)
      if (trip.status !== 'Ended' && trip.status !== 'Cancelled') {
        const now = new Date();
        if (newStartDate > now) {
          updateData.status = 'Scheduled';
        } else if (!newEndDate || newEndDate > now) {
          updateData.status = 'Active';
        }
      }
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

    // Mark trip as Ended (no longer changing driver status)
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'Ended' },
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
    await prisma.trip.delete({ where: { id: tripId } });
  }
}

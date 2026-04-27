// apps/backend/src/features/trips/trip.controller.ts
import { Request, Response } from 'express';
import { TripService } from './trip.service';

const tripService = new TripService();

export class TripController {
  initiateTrip = async (req: Request, res: Response) => {
    const trip = await tripService.initiateTrip(req.body);
    res.status(201).json({ status: 'success', data: { trip } });
  };

  getActiveTrips = async (req: Request, res: Response) => {
    const trips = await tripService.getActiveTrips();
    res.status(200).json({ status: 'success', results: trips.length, data: { trips } });
  };

  getAllTrips = async (req: Request, res: Response) => {
    const trips = await tripService.getAllTrips();
    res.status(200).json({ status: 'success', results: trips.length, data: { trips } });
  };

  completeTrip = async (req: Request, res: Response) => {
    const trip = await tripService.completeTrip(req.params.id);
    res.status(200).json({ status: 'success', data: { trip } });
  };
}

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

  getPastTrips = async (req: Request, res: Response) => {
    const trips = await tripService.getPastTrips();
    res.status(200).json({ status: 'success', results: trips.length, data: { trips } });
  };

  getTripById = async (req: Request, res: Response) => {
    const trip = await tripService.getTripById(req.params.id);
    res.status(200).json({ status: 'success', data: { trip } });
  };

  updateTrip = async (req: Request, res: Response) => {
    const trip = await tripService.updateTrip(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { trip } });
  };

  completeTrip = async (req: Request, res: Response) => {
    const trip = await tripService.completeTrip(req.params.id);
    res.status(200).json({ status: 'success', data: { trip } });
  };

  deleteTrip = async (req: Request, res: Response) => {
    await tripService.deleteTrip(req.params.id);
    res.status(204).send();
  };
}

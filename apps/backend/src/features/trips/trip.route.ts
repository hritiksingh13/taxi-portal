// apps/backend/src/features/trips/trip.route.ts
import { Router } from 'express';
import { TripController } from './trip.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { initiateTripSchema, getTripSchema } from './trip.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const tripController = new TripController();

router.get('/active', catchAsync(tripController.getActiveTrips));

router
  .route('/')
  .get(catchAsync(tripController.getAllTrips))
  .post(validateRequest(initiateTripSchema), catchAsync(tripController.initiateTrip));

router.patch('/:id/complete', validateRequest(getTripSchema), catchAsync(tripController.completeTrip));

export default router;

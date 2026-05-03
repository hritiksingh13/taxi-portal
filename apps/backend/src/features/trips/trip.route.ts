// apps/backend/src/features/trips/trip.route.ts
import { Router } from 'express';
import { TripController } from './trip.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { initiateTripSchema, updateTripSchema, getTripSchema } from './trip.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const tripController = new TripController();

router.get('/active', catchAsync(tripController.getActiveTrips));
router.get('/scheduled', catchAsync(tripController.getScheduledTrips));
router.get('/past', catchAsync(tripController.getPastTrips));

router
  .route('/')
  .get(catchAsync(tripController.getAllTrips))
  .post(validateRequest(initiateTripSchema), catchAsync(tripController.initiateTrip));

router
  .route('/:id')
  .get(validateRequest(getTripSchema), catchAsync(tripController.getTripById))
  .patch(validateRequest(updateTripSchema), catchAsync(tripController.updateTrip))
  .delete(validateRequest(getTripSchema), catchAsync(tripController.deleteTrip));

router.patch('/:id/complete', validateRequest(getTripSchema), catchAsync(tripController.completeTrip));

export default router;

// apps/backend/src/features/cars/car.route.ts
import { Router } from 'express';
import { CarController } from './car.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  createCarSchema,
  updateCarSchema,
  getCarSchema,
  moveToMaintenanceSchema,
  moveToActiveSchema,
} from './car.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const carController = new CarController();

router
  .route('/')
  .get(catchAsync(carController.getAllCars))
  .post(validateRequest(createCarSchema), catchAsync(carController.createCar));

router
  .route('/:id')
  .get(validateRequest(getCarSchema), catchAsync(carController.getCarById))
  .patch(validateRequest(updateCarSchema), catchAsync(carController.updateCar))
  .delete(validateRequest(getCarSchema), catchAsync(carController.deleteCar));

// Maintenance lifecycle routes
router.patch(
  '/:id/maintenance',
  validateRequest(moveToMaintenanceSchema),
  catchAsync(carController.moveToMaintenance)
);

router.patch(
  '/:id/activate',
  validateRequest(moveToActiveSchema),
  catchAsync(carController.moveToActive)
);

router.get(
  '/:id/maintenance-history',
  validateRequest(getCarSchema),
  catchAsync(carController.getMaintenanceHistory)
);

export default router;

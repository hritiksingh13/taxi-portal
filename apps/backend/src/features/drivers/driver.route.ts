// apps/backend/src/features/drivers/driver.route.ts
import { Router } from 'express';
import { DriverController } from './driver.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import {
  createDriverSchema,
  updateDriverSchema,
  getDriverSchema,
  assignCarSchema,
  assignAgentSchema,
} from './driver.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const driverController = new DriverController();

// Status feed endpoint
router.get('/status-feed', catchAsync(driverController.getDriversByStatus));

router
  .route('/')
  .get(catchAsync(driverController.getAllDrivers))
  .post(validateRequest(createDriverSchema), catchAsync(driverController.createDriver));

router
  .route('/:id')
  .get(validateRequest(getDriverSchema), catchAsync(driverController.getDriverById))
  .patch(validateRequest(updateDriverSchema), catchAsync(driverController.updateDriver))
  .delete(validateRequest(getDriverSchema), catchAsync(driverController.deleteDriver));

// Assignment endpoints
router.post('/:id/assign-car', validateRequest(assignCarSchema), catchAsync(driverController.assignCar));
router.post('/:id/assign-agent', validateRequest(assignAgentSchema), catchAsync(driverController.assignAgent));
router.delete('/:id/remove-agent', validateRequest(assignAgentSchema), catchAsync(driverController.removeAgent));

export default router;

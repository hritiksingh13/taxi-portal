// apps/backend/src/features/offices/office.route.ts
import { Router } from 'express';
import { OfficeController } from './office.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { createOfficeSchema, updateOfficeSchema, getOfficeSchema } from './office.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const ctrl = new OfficeController();

router
  .route('/')
  .get(catchAsync(ctrl.getAll))
  .post(validateRequest(createOfficeSchema), catchAsync(ctrl.create));

router
  .route('/:id')
  .patch(validateRequest(updateOfficeSchema), catchAsync(ctrl.update))
  .delete(validateRequest(getOfficeSchema), catchAsync(ctrl.delete));

export default router;

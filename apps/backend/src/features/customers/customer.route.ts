// apps/backend/src/features/customers/customer.route.ts
import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { createCustomerSchema, updateCustomerSchema, getCustomerSchema } from './customer.dto';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const customerController = new CustomerController();

router
  .route('/')
  .get(catchAsync(customerController.getAllCustomers))
  .post(validateRequest(createCustomerSchema), catchAsync(customerController.createCustomer));

router
  .route('/:id')
  .get(validateRequest(getCustomerSchema), catchAsync(customerController.getCustomerById))
  .patch(validateRequest(updateCustomerSchema), catchAsync(customerController.updateCustomer))
  .delete(validateRequest(getCustomerSchema), catchAsync(customerController.deleteCustomer));

export default router;

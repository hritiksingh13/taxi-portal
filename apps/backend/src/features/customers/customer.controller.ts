// apps/backend/src/features/customers/customer.controller.ts
import { Request, Response } from 'express';
import { CustomerService } from './customer.service';

const customerService = new CustomerService();

export class CustomerController {
  createCustomer = async (req: Request, res: Response) => {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ status: 'success', data: { customer } });
  };

  getAllCustomers = async (req: Request, res: Response) => {
    const customers = await customerService.getAllCustomers();
    res.status(200).json({ status: 'success', results: customers.length, data: { customers } });
  };

  getCustomerById = async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerById(req.params.id);
    res.status(200).json({ status: 'success', data: { customer } });
  };

  updateCustomer = async (req: Request, res: Response) => {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { customer } });
  };

  deleteCustomer = async (req: Request, res: Response) => {
    await customerService.deleteCustomer(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  };
}

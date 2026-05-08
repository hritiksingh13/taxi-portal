// apps/backend/src/features/offices/office.controller.ts
import { Request, Response } from 'express';
import { OfficeService } from './office.service';

const officeService = new OfficeService();

export class OfficeController {
  getAll = async (_req: Request, res: Response) => {
    const offices = await officeService.getAll();
    res.status(200).json({ status: 'success', data: { offices } });
  };

  create = async (req: Request, res: Response) => {
    const office = await officeService.create(req.body);
    res.status(201).json({ status: 'success', data: { office } });
  };

  update = async (req: Request, res: Response) => {
    const office = await officeService.update(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { office } });
  };

  delete = async (req: Request, res: Response) => {
    await officeService.delete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  };
}

// apps/backend/src/features/drivers/driver.controller.ts
import { Request, Response } from 'express';
import { DriverService } from './driver.service';

const driverService = new DriverService();

export class DriverController {
  createDriver = async (req: Request, res: Response) => {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json({ status: 'success', data: { driver } });
  };

  getAllDrivers = async (req: Request, res: Response) => {
    const drivers = await driverService.getAllDrivers();
    res.status(200).json({ status: 'success', results: drivers.length, data: { drivers } });
  };

  getDriversByStatus = async (req: Request, res: Response) => {
    const statusFeed = await driverService.getDriversByStatus();
    res.status(200).json({ status: 'success', data: statusFeed });
  };

  getDriverById = async (req: Request, res: Response) => {
    const driver = await driverService.getDriverById(req.params.id);
    res.status(200).json({ status: 'success', data: { driver } });
  };

  updateDriver = async (req: Request, res: Response) => {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { driver } });
  };

  deleteDriver = async (req: Request, res: Response) => {
    await driverService.deleteDriver(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  };

  assignCar = async (req: Request, res: Response) => {
    const driver = await driverService.assignCar(req.params.id, req.body.carId);
    res.status(200).json({ status: 'success', data: { driver } });
  };

  assignAgent = async (req: Request, res: Response) => {
    await driverService.assignAgent(req.params.id, req.body.agentId);
    res.status(200).json({ status: 'success', message: 'Driver linked to platform successfully' });
  };

  removeAgent = async (req: Request, res: Response) => {
    await driverService.removeAgent(req.params.id, req.body.agentId);
    res.status(200).json({ status: 'success', message: 'Driver unlinked from platform' });
  };
}

// apps/backend/src/features/cars/car.controller.ts
import { Request, Response } from 'express';
import { CarService } from './car.service';

const carService = new CarService();

export class CarController {
  createCar = async (req: Request, res: Response) => {
    const car = await carService.createCar(req.body);
    res.status(201).json({ status: 'success', data: { car } });
  };

  getAllCars = async (req: Request, res: Response) => {
    const cars = await carService.getAllCars();
    res.status(200).json({
      status: 'success',
      results: cars.length,
      data: { cars },
    });
  };

  getCarById = async (req: Request, res: Response) => {
    const car = await carService.getCarById(req.params.id);
    res.status(200).json({ status: 'success', data: { car } });
  };

  updateCar = async (req: Request, res: Response) => {
    const car = await carService.updateCar(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { car } });
  };

  deleteCar = async (req: Request, res: Response) => {
    await carService.deleteCar(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  };
}

// apps/backend/src/features/dashboard/dashboard.controller.ts
import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  getStats = async (req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    res.status(200).json({ status: 'success', data: stats });
  };
}

// apps/backend/src/features/dashboard/dashboard.route.ts
import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { catchAsync } from '../../core/exceptions/catchAsync.util';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', catchAsync(dashboardController.getStats));

export default router;

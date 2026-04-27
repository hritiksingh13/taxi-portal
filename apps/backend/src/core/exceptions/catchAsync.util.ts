// apps/backend/src/core/exceptions/catchAsync.util.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Wraps asynchronous controller functions to ensure rejected promises
 * are caught and passed to the Express global error handler.
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

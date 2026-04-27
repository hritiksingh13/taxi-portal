// apps/backend/src/core/exceptions/global.exception.ts
import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.config';

export interface IHTTPError extends Error {
  statusCode?: number;
}

export class AppError extends Error implements IHTTPError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized global exception filter intercepting all unhandled errors.
 */
export const globalErrorHandler = (
  err: IHTTPError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl} >> Status: ${statusCode}, Message: ${message}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

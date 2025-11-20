import { Response } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: unknown, res: Response) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode,
    });
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };
    
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with this value already exists',
        statusCode: 409,
      });
    }
    
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        statusCode: 404,
      });
    }
  }

  // Unknown error
  console.error('Unhandled error:', error);
  return res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};


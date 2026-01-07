import { Response } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errors?: any[];
}

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  error: string,
  statusCode: number = 500,
  errors?: any[]
): Response => {
  const response: ErrorResponse = {
    success: false,
    error,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};


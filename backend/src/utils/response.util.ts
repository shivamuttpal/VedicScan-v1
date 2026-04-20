import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Resource created successfully'
): Response => {
  return successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

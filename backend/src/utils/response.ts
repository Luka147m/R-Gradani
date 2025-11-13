import { Response } from 'express';

/**
 * Sends a standardized success response.
 * @param statusCode The HTTP status code.
 * @param message A descriptive message for the response.
 * @param data The payload to be sent in the 'result' field.
 */
export const sendSuccess = <T>(res: Response, statusCode: number, message: string, data: T) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    result: data,
  });
};

/**
 * Sends a standardized error response.
 * @param statusCode The HTTP status code.
 * @param message A descriptive error message.
 */
export const sendError = (res: Response, statusCode: number, message: string) => {
  res.status(statusCode).json({
    status: 'error',
    message,
    result: null,
  });
};
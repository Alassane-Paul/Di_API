import { Request, Response, NextFunction } from 'express';
import { responses } from '../data/responses';

export function successResponse(res: Response, messageKey: keyof typeof responses.CALL_BACK_MESSAGES, data: any = [], httpCode?: number) {
  const message = responses.CALL_BACK_MESSAGES[messageKey] || responses.CALL_BACK_MESSAGES.SUCCESS;
  return res.status(httpCode || responses.HTTP_CODES.RESULT_OK).json({
    responseCode: message.CODE,
    responseMessage: message.MESSAGE,
    data: Array.isArray(data) ? data : [data],
  });
}

export function errorResponse(res: Response, error: any, serviceName: string) {
  console.error(`[${serviceName} Error]:`, error);
  return res.status(responses.HTTP_CODES.SERVER_ERROR).json({
    responseCode: responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
    responseMessage: responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
    error: error?.message || responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
    data: [],
  });
}

export function notFoundResponse(res: Response, messageKey: keyof typeof responses.CALL_BACK_MESSAGES = 'RECORD_NOT_FOUND') {
  const message = responses.CALL_BACK_MESSAGES[messageKey];
  return res.status(responses.HTTP_CODES.NOT_FOUND).json({
    responseCode: message.CODE,
    responseMessage: message.MESSAGE,
    error: message.MESSAGE,
    data: [],
  });
}

export function forbiddenResponse(res: Response, messageKey: keyof typeof responses.CALL_BACK_MESSAGES = 'FORBIDDEN_PERMISSION') {
  const message = responses.CALL_BACK_MESSAGES[messageKey];
  return res.status(responses.HTTP_CODES.FORBIDDEN).json({
    responseCode: message.CODE,
    responseMessage: message.MESSAGE,
    error: message.MESSAGE,
    data: [],
  });
}

export function validationError(res: Response, messageKey: keyof typeof responses.CALL_BACK_MESSAGES, data: any = []) {
  const message = responses.CALL_BACK_MESSAGES[messageKey];
  return res.status(responses.HTTP_CODES.VALIDATION_ERROR).json({
    responseCode: message.CODE,
    responseMessage: message.MESSAGE,
    error: message.MESSAGE,
    data,
  });
}

export function paginationResponse(
  res: Response,
  messageKey: keyof typeof responses.CALL_BACK_MESSAGES,
  rows: any[],
  count: number,
  page: number,
  limit: number
) {
  const message = responses.CALL_BACK_MESSAGES[messageKey] || responses.CALL_BACK_MESSAGES.LIST_RETRIEVED;
  return res.status(responses.HTTP_CODES.RESULT_OK).json({
    responseCode: message.CODE,
    responseMessage: message.MESSAGE,
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasNext: page * limit < count,
      hasPrevious: page > 1,
    },
  });
}

/** Async wrapper to avoid try/catch boilerplate */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Parse boolean from query/body */
export const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/** Sanitize user object (remove sensitive fields) */
export const sanitizeUser = (user: any) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.deviceId;
  return obj;
};

import { Request, Response, NextFunction } from 'express';
import { responses } from '../data/responses';

export function bodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow multipart/form-data (files)
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(responses.HTTP_CODES.VALIDATION_ERROR).json({
      responseCode: responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.MESSAGE,
      error: responses.CALL_BACK_MESSAGES.ALL_FIELDS_EMPTY.MESSAGE,
      data: [],
    });
    return;
  }
  next();
}

export default bodyMiddleware;

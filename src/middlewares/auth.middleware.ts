import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../configs/app.config';
import { responses } from '../data/responses';
import { User } from '../data/models';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
      responseCode: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
      error: 'No token provided',
      data: [],
    });
    return;
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];

  if (!token) {
    res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
      responseCode: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
      error: 'No token provided',
      data: [],
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.userId = decoded.userId ?? decoded.id;

    // Optionally enrich req.user with DB data (can be skipped for perf)
    const user = await User.findByPk(req.userId as number, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
        responseCode: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.UNAUTHORIZED_USER.MESSAGE,
        error: 'User not found',
        data: [],
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
      responseCode: responses.CALL_BACK_MESSAGES.EXPIRED_SESSION.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.EXPIRED_SESSION.MESSAGE,
      error: 'Invalid or expired token',
      data: [],
    });
  }
}

export default authenticate;

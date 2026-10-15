import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../configs/app.config';
import { responses } from '../data/responses';

export function spyAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Check custom spy headers
  const spyTokenHeader = req.headers['x-spy-token'] as string | undefined;
  if (spyTokenHeader && (spyTokenHeader === config.spy.secretToken || spyTokenHeader === config.spy.adminPassword)) {
    req.isAdmin = true;
    return next();
  }

  // 2. Check query param token (useful for ZIP download links and <img>/<video> tags)
  const queryToken = req.query.token as string | undefined;
  if (queryToken) {
    if (queryToken === config.spy.secretToken || queryToken === config.spy.adminPassword) {
      req.isAdmin = true;
      return next();
    }
    try {
      const decoded = jwt.verify(queryToken, config.jwt.secret) as any;
      req.userId = decoded.userId ?? decoded.id;
      return next();
    } catch (_) {
      // Query token invalid, continue to header checks
    }
  }

  // 3. Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (token === config.spy.secretToken || token === config.spy.adminPassword) {
      req.isAdmin = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      req.userId = decoded.userId ?? decoded.id;
      return next();
    } catch (_) {
      res.status(responses.HTTP_CODES.FORBIDDEN).json({
        success: false,
        responseCode: responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
        responseMessage: 'Token de session invalide ou expiré',
        error: 'Token de session invalide ou expiré',
      });
      return;
    }
  }

  res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
    success: false,
    responseCode: responses.CALL_BACK_MESSAGES.SPY_ACCESS_DENIED.CODE,
    responseMessage: 'Accès restreint : Authentification requise pour accéder au module Spy',
    error: 'Authentification requise',
  });
}

export default spyAuth;

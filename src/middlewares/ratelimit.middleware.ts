import rateLimit from 'express-rate-limit';
import { responses } from '../data/responses';

const msg = (message: string) => ({
  responseCode: responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
  responseMessage: message,
  error: message,
  data: [],
});

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Trop de requêtes. Veuillez réessayer plus tard.'),
  keyGenerator: (req) => (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: msg("Trop de tentatives d'authentification. Réessayez dans 15 minutes."),
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.MESSAGE_RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Trop de messages envoyés. Réessayez dans une minute.'),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: msg('Trop de fichiers envoyés. Réessayez plus tard.'),
});

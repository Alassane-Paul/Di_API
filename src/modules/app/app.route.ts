import { Router, Request, Response } from 'express';
import { authRouter } from './auth/auth.route';
import { conversationsRouter } from './conversations/conversations.route';
import { messagesRouter } from './messages/messages.route';
import { callsRouter } from './calls/calls.route';
import { storiesRouter } from './stories/stories.route';
import { spyRouter } from './spy/spy.route';
import { authLimiter } from '../../middlewares/ratelimit.middleware';

const appRouter = Router();

// Health check
appRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// API routes
appRouter.use('/auth', authLimiter, authRouter);
appRouter.use('/conversations', conversationsRouter);
appRouter.use('/messages', messagesRouter);
appRouter.use('/calls', callsRouter);
appRouter.use('/stories', storiesRouter);
appRouter.use('/spy', spyRouter);

export { appRouter };
export default appRouter;

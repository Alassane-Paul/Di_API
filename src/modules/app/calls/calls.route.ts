import { Router } from 'express';
import { createController } from '../../../utils/controller.helper';
import { authenticate } from '../../../middlewares/auth.middleware';
import { bodyMiddleware } from '../../../middlewares/body.middleware';
import { initiateCallService, updateCallStatusService, getCallHistoryService } from './calls.service';

const callsRouter = Router();

callsRouter.post('/', authenticate, bodyMiddleware, createController(null, initiateCallService, 'InitiateCallController'));
callsRouter.put('/:callId/status', authenticate, bodyMiddleware, createController(null, updateCallStatusService, 'UpdateCallStatusController'));
callsRouter.get('/', authenticate, createController(null, getCallHistoryService, 'GetCallHistoryController'));
callsRouter.get('/history', authenticate, createController(null, getCallHistoryService, 'GetCallHistoryController'));

export { callsRouter };
export default callsRouter;

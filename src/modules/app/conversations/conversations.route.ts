import { Router } from 'express';
import { createController } from '../../../utils/controller.helper';
import { authenticate } from '../../../middlewares/auth.middleware';
import { bodyMiddleware } from '../../../middlewares/body.middleware';
import {
  getConversationsService,
  createConversationService,
  getConversationService,
  updateConversationService,
  addParticipantService,
  removeParticipantService,
  archiveConversationService,
  pinConversationService,
  muteConversationService,
} from './conversations.service';

const conversationsRouter = Router();

conversationsRouter.get('/', authenticate, createController(null, getConversationsService, 'GetConversationsController'));
conversationsRouter.post('/', authenticate, bodyMiddleware, createController(null, createConversationService, 'CreateConversationController'));
conversationsRouter.get('/:conversationId', authenticate, createController(null, getConversationService, 'GetConversationController'));
conversationsRouter.put('/:conversationId', authenticate, bodyMiddleware, createController(null, updateConversationService, 'UpdateConversationController'));
conversationsRouter.post('/:conversationId/participants', authenticate, bodyMiddleware, createController(null, addParticipantService, 'AddParticipantController'));
conversationsRouter.delete('/:conversationId/participants/:userId', authenticate, createController(null, removeParticipantService, 'RemoveParticipantController'));
conversationsRouter.put('/:conversationId/archive', authenticate, bodyMiddleware, createController(null, archiveConversationService, 'ArchiveConversationController'));
conversationsRouter.put('/:conversationId/pin', authenticate, bodyMiddleware, createController(null, pinConversationService, 'PinConversationController'));
conversationsRouter.put('/:conversationId/mute', authenticate, bodyMiddleware, createController(null, muteConversationService, 'MuteConversationController'));

export { conversationsRouter };
export default conversationsRouter;

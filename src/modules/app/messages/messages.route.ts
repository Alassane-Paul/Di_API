import { Router } from 'express';
import { createController } from '../../../utils/controller.helper';
import { authenticate } from '../../../middlewares/auth.middleware';
import { bodyMiddleware } from '../../../middlewares/body.middleware';
import { messageLimiter } from '../../../middlewares/ratelimit.middleware';
import {
  getMessagesService,
  createMessageService,
  editMessageService,
  deleteMessageService,
  markAsReadService,
  addReactionService,
  searchMessagesService,
} from './messages.service';

const messagesRouter = Router();

messagesRouter.get('/search', authenticate, createController(null, searchMessagesService, 'SearchMessagesController'));
messagesRouter.get('/conversation/:conversationId', authenticate, createController(null, getMessagesService, 'GetMessagesController'));
messagesRouter.post('/', authenticate, bodyMiddleware, messageLimiter, createController(null, createMessageService, 'CreateMessageController'));
messagesRouter.put('/:messageId', authenticate, bodyMiddleware, createController(null, editMessageService, 'EditMessageController'));
messagesRouter.delete('/:messageId', authenticate, createController(null, deleteMessageService, 'DeleteMessageController'));
messagesRouter.put('/conversation/:conversationId/read', authenticate, bodyMiddleware, createController(null, markAsReadService, 'MarkAsReadController'));
messagesRouter.post('/:messageId/reaction', authenticate, bodyMiddleware, createController(null, addReactionService, 'AddReactionController'));

export { messagesRouter };
export default messagesRouter;

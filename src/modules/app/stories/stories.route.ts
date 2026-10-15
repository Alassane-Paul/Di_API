import { Router } from 'express';
import { createController } from '../../../utils/controller.helper';
import { authenticate } from '../../../middlewares/auth.middleware';
import { bodyMiddleware } from '../../../middlewares/body.middleware';
import { getStoriesService, createStoryService, viewStoryService, deleteStoryService } from './stories.service';

const storiesRouter = Router();

storiesRouter.get('/', authenticate, createController(null, getStoriesService, 'GetStoriesController'));
storiesRouter.post('/', authenticate, bodyMiddleware, createController(null, createStoryService, 'CreateStoryController'));
storiesRouter.post('/:storyId/view', authenticate, createController(null, viewStoryService, 'ViewStoryController'));
storiesRouter.delete('/:storyId', authenticate, createController(null, deleteStoryService, 'DeleteStoryController'));

export { storiesRouter };
export default storiesRouter;

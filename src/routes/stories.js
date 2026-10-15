const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, storyController.getStories.bind(storyController));
router.post('/', authenticate, storyController.createStory.bind(storyController));
router.post('/:storyId/view', authenticate, storyController.viewStory.bind(storyController));
router.delete('/:storyId', authenticate, storyController.deleteStory.bind(storyController));

module.exports = router;

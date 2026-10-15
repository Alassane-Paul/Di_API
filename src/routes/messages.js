const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authenticate = require('../middleware/auth');

router.get('/conversation/:conversationId', authenticate, messageController.getMessages.bind(messageController));
router.post('/', authenticate, messageController.createMessage.bind(messageController));
router.put('/:messageId', authenticate, messageController.editMessage.bind(messageController));
router.delete('/:messageId', authenticate, messageController.deleteMessage.bind(messageController));
router.put('/conversation/:conversationId/read', authenticate, messageController.markAsRead.bind(messageController));
router.post('/:messageId/reaction', authenticate, messageController.addReaction.bind(messageController));
router.get('/search', authenticate, messageController.searchMessages.bind(messageController));

module.exports = router;

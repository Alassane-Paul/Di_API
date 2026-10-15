const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, conversationController.getConversations.bind(conversationController));
router.post('/', authenticate, conversationController.createConversation.bind(conversationController));
router.get('/:conversationId', authenticate, conversationController.getConversation.bind(conversationController));
router.put('/:conversationId', authenticate, conversationController.updateConversation.bind(conversationController));
router.post('/:conversationId/participants', authenticate, conversationController.addParticipant.bind(conversationController));
router.delete('/:conversationId/participants/:userId', authenticate, conversationController.removeParticipant.bind(conversationController));
router.put('/:conversationId/archive', authenticate, conversationController.archiveConversation.bind(conversationController));
router.put('/:conversationId/pin', authenticate, conversationController.pinConversation.bind(conversationController));
router.put('/:conversationId/mute', authenticate, conversationController.muteConversation.bind(conversationController));

module.exports = router;

const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, callController.initiateCall.bind(callController));
router.put('/:callId/status', authenticate, callController.updateCallStatus.bind(callController));
router.get('/history', authenticate, callController.getCallHistory.bind(callController));

module.exports = router;

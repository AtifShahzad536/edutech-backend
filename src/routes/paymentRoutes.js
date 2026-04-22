const express = require('express');
const { createCheckoutSession, handleWebhook, getPaymentHistory, getUploadSignature, getSessionDetails, verifyCheckoutSession } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate.middleware');
const { createCheckoutSchema } = require('../validators/payment.validator');

const router = express.Router();

router.post('/checkout', protect, validate(createCheckoutSchema), createCheckoutSession);
router.get('/session/:sessionId', protect, getSessionDetails);
router.get('/history', protect, getPaymentHistory);
router.get('/verify/:sessionId', protect, verifyCheckoutSession);
router.get('/upload-signature', protect, getUploadSignature);

module.exports = router;

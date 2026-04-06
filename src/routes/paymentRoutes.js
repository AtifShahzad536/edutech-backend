const express = require('express');
const { createCheckoutSession, handleWebhook, getPaymentHistory, getUploadSignature, getSessionDetails } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Stripe webhook handled in server.js

// Protected payment routes
router.post('/checkout', protect, createCheckoutSession);
router.get('/session/:sessionId', protect, getSessionDetails);
router.get('/history', protect, getPaymentHistory);
router.get('/upload-signature', protect, getUploadSignature);

module.exports = router;

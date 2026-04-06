const stripeService = require('../services/stripeService');
const Course = require('../models/Course');

// ─────────────────────────────────────────────
// @desc    Create Stripe Checkout Session for cart purchase
// @route   POST /api/payments/checkout
// @access  Private
// ─────────────────────────────────────────────
const createCheckoutSession = async (req, res, next) => {
  try {
    const { courseIds } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one course ID' });
    }

    const courses = await Course.find({ _id: { $in: courseIds } });

    if (courses.length === 0) {
      return res.status(404).json({ success: false, message: 'No courses found' });
    }

    // Filter out free courses (price === 0) — those should use /enroll-free
    const paidCourses = courses.filter(c => c.price > 0);
    if (paidCourses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected courses are free. Use the enroll-free endpoint.'
      });
    }

    const session = await stripeService.createCheckoutSession(paidCourses, req.user);

    res.status(200).json({ success: true, data: session.url });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Handle Stripe Webhooks
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls directly)
// ─────────────────────────────────────────────
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody || req.body;
    const result = await stripeService.handleWebhook(payload, signature);
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook Controller Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// ─────────────────────────────────────────────
// @desc    Get Stripe session details (real amount for success screen)
// @route   GET /api/payments/session/:sessionId
// @access  Private
// ─────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      success: true,
      data: {
        amountTotal: session.amount_total / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
      }
    });
  } catch (error) {
    console.error('Session Retrieve Error:', error.message);
    res.status(400).json({ success: false, message: 'Could not retrieve session details' });
  }
};

// ─────────────────────────────────────────────
// @desc    Get student payment history from Stripe
// @route   GET /api/payments/history
// @access  Private
// ─────────────────────────────────────────────
const getPaymentHistory = async (req, res, next) => {
  try {
    const history = await stripeService.getPaymentHistory(req.user.email);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Get Cloudinary Signature for Secure Uploads
// @route   GET /api/payments/upload-signature
// @access  Private
// ─────────────────────────────────────────────
const cloudinaryService = require('../services/cloudinaryService');
const getUploadSignature = async (req, res, next) => {
  try {
    const { folder } = req.query;
    const signatureData = cloudinaryService.generateSignature(folder);
    res.status(200).json({ success: true, data: signatureData });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Verify Stripe session after redirect
// @route   GET /api/payments/verify/:sessionId
// @access  Private
// ─────────────────────────────────────────────
const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await stripeService.verifySession(sessionId);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Payment verified and courses enrolled successfully',
        data: result
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: `Payment status: ${result.status}`,
        data: result
      });
    }
  } catch (error) {
    console.error('Session Verification Controller Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  verifyCheckoutSession,
  getSessionDetails,
  getPaymentHistory,
  getUploadSignature
};

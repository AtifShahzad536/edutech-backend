const stripeService = require('../services/stripeService');
const cloudinaryService = require('../services/cloudinaryService');
const courseRepository = require('../repositories/course.repository');
const { successResponse } = require('../utils/response.util');
const AppError = require('../utils/appError');

const createCheckoutSession = async (req, res, next) => {
  try {
    const { courseIds } = req.body;
    const courses = await courseRepository.findCoursesByIds(courseIds);

    if (courses.length === 0) {
      throw new AppError('No courses found', 404);
    }

    const paidCourses = courses.filter(c => c.price > 0);
    if (paidCourses.length === 0) {
      throw new AppError('All selected courses are free. Use the enroll-free endpoint.', 400);
    }

    const session = await stripeService.createCheckoutSession(paidCourses, req.user);
    return res.status(200).json(successResponse(session.url));
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody || req.body;
    const result = await stripeService.handleWebhook(payload, signature);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Webhook Controller Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

const getSessionDetails = async (req, res, next) => {
  try {
    const stripe = require('stripe')(require('../config/env').STRIPE.SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    return res.json(successResponse({
      amountTotal: session.amount_total / 100,
      currency: session.currency?.toUpperCase() || 'USD',
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
    }));
  } catch (error) {
    console.error('Session Retrieve Error:', error.message);
    next(new AppError('Could not retrieve session details', 400));
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const history = await stripeService.getPaymentHistory(req.user.email);
    return res.status(200).json(successResponse(history));
  } catch (error) {
    next(error);
  }
};

const getUploadSignature = async (req, res, next) => {
  try {
    const signatureData = cloudinaryService.generateSignature(req.query.folder);
    return res.status(200).json(successResponse(signatureData));
  } catch (error) {
    next(error);
  }
};

const verifyCheckoutSession = async (req, res, next) => {
  try {
    const result = await stripeService.verifySession(req.params.sessionId);
    if (result.success) {
      return res.status(200).json(successResponse(result, 'Payment verified and courses enrolled successfully'));
    }
    throw new AppError(`Payment status: ${result.status}`, 400);
  } catch (error) {
    console.error('Session Verification Controller Error:', error.message);
    next(error);
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

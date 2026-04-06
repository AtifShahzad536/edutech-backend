const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Notification = require('../models/Notification');
const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');

const stripeService = {

  // ── Create a Stripe Checkout Session for multiple courses ──────────────────
  createCheckoutSession: async (courses, user) => {
    try {
      const line_items = courses.map(course => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description?.substring(0, 200) || course.title,
            images: course.thumbnail ? [course.thumbnail] : [],
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/checkout?canceled=true`,
        customer_email: user.email,
        metadata: {
          courseIds: JSON.stringify(courses.map(c => c._id.toString())),
          userId: user._id.toString(),
        },
      });

      return session;
    } catch (error) {
      console.error('❌ Stripe Session Error:', error);
      throw error;
    }
  },

  // ── Handle Stripe Webhook Events ────────────────────────────────────────────
  handleWebhook: async (body, signature) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`❌ Webhook verification failed: ${err.message}`);
      throw new Error('Webhook signature verification failed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { courseIds, userId } = session.metadata;
      const ids = JSON.parse(courseIds);
      await stripeService.enrollUser(userId, ids);
      console.log(`✅ Enrolled User ${userId} in: ${ids.join(', ')}`);
    }

    return { received: true };
  },

  // ── Reusable Enrollment Helper ──────────────────────────────────────────────
  enrollUser: async (userId, courseIds) => {
    try {
      // 1. Enroll student in all purchased courses
      await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: { $each: courseIds } }
      });

      // 2. Create CourseProgress records for each course
      const progressOps = courseIds.map(courseId =>
        CourseProgress.findOneAndUpdate(
          { student: userId, course: courseId },
          { student: userId, course: courseId, lastAccessedAt: new Date() },
          { upsert: true, new: true }
        )
      );
      await Promise.all(progressOps);

      // 3. Increment students count on each course
      await Course.updateMany(
        { _id: { $in: courseIds } },
        { $inc: { studentsCount: 1 } }
      );

      // 4. Create enrollment notifications
      const courses = await Course.find({ _id: { $in: courseIds } });
      const notifOps = courses.map(course =>
        Notification.create({
          user: userId,
          title: 'Course Enrolled',
          message: `You've successfully enrolled in "${course.title}". Happy learning!`,
          type: 'enrollment'
        })
      );
      await Promise.all(notifOps);
      return true;
    } catch (error) {
      console.error('❌ Enrollment Helper Error:', error);
      throw error;
    }
  },

  // ── Verify session status (Manual Fallback) ─────────────────────────────────
  verifySession: async (sessionId) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        const { courseIds, userId } = session.metadata;
        const ids = JSON.parse(courseIds);
        await stripeService.enrollUser(userId, ids);
        return { success: true, userId, courseIds: ids };
      }
      return { success: false, status: session.payment_status };
    } catch (error) {
      console.error('❌ Session Verification Error:', error);
      throw error;
    }
  },

  // ── Get payment history for a user from Stripe ────────────────────────────
  getPaymentHistory: async (userEmail) => {
    try {
      // Look up customer by email
      const customers = await stripe.customers.list({ email: userEmail, limit: 5 });
      if (!customers.data.length) return [];

      const customerId = customers.data[0].id;

      const charges = await stripe.charges.list({
        customer: customerId,
        limit: 20
      });

      return charges.data.map(charge => ({
        id: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency.toUpperCase(),
        status: charge.status,
        description: charge.description,
        date: new Date(charge.created * 1000).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        }),
        receiptUrl: charge.receipt_url
      }));
    } catch (error) {
      console.error('❌ Stripe History Error:', error.message);
      return [];
    }
  }
};

module.exports = stripeService;

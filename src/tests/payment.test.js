const request = require('supertest');
const app = require('../app');
const Course = require('../models/Course');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

describe('Payment Integration Tests', () => {
  let studentToken;
  let studentId;
  let courseId;

  beforeEach(async () => {
    // 1. Create student
    const student = await User.create({
      firstName: 'Student',
      lastName: 'One',
      email: 'student@example.com',
      password: 'password123',
      role: 'student'
    });
    studentId = student._id;
    studentToken = generateToken(studentId);

    // 2. Create instructor and course
    const instructor = await User.create({
      firstName: 'Instr',
      lastName: 'One',
      email: 'instr@payload.com',
      password: 'password123',
      role: 'instructor'
    });
    
    const course = await Course.create({
      title: 'Stripe Course',
      description: 'Desc',
      thumbnail: 'thumb.jpg',
      price: 50,
      category: 'Development',
      instructorId: instructor._id,
      isPublished: true
    });
    courseId = course._id;
  });

  it('SHOULD create a checkout session', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseIds: [courseId] });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe('string');
  });

  it('SHOULD return error for empty checkout session', async () => {
    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseIds: [] });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('SHOULD verify a successful session', async () => {
    const res = await request(app)
      .get('/api/payments/verify/test_session_id')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('SHOULD handle webhook event', async () => {
    // Simulated stripe webhook payload
    const payload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'test_session_id',
          metadata: {
            userId: studentId.toString(),
            courseIds: JSON.stringify([courseId.toString()])
          }
        }
      }
    };

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'test_sig')
      .send(payload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.received).toBe(true);

    // Verify side effect: User should be enrolled
    const user = await User.findById(studentId);
    expect(user.enrolledCourses.map(id => id.toString())).toContain(courseId.toString());
  });
});

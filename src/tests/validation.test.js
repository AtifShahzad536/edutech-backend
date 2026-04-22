const request = require('supertest');
const express = require('express');
const validate = require('../middleware/validate.middleware');
const { registerSchema } = require('../validators/auth.validator');
const { createAssignmentSchema } = require('../validators/assignment.validator');

describe('Validation Middleware Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Dummy routes for testing validation
    app.post('/test/register', validate(registerSchema), (req, res) => {
      res.status(200).json({ success: true, message: 'Validated' });
    });

    app.post('/test/assignment', validate(createAssignmentSchema), (req, res) => {
      res.status(200).json({ success: true, message: 'Validated' });
    });
  });

  describe('Auth Registration Validation', () => {
    it('SHOULD fail if email is invalid', async () => {
      const res = await request(app)
        .post('/test/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
      expect(res.body.errors[0].path).toBe('body.email');
    });

    it('SHOULD fail if password is too short', async () => {
      const res = await request(app)
        .post('/test/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: '123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.some(e => e.path === 'body.password')).toBe(true);
    });

    it('SHOULD pass if all data is correct', async () => {
      const res = await request(app)
        .post('/test/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Assignment Creation Validation', () => {
    it('SHOULD fail if title is too short', async () => {
      const res = await request(app)
        .post('/test/assignment')
        .send({
          title: 'AB', // too short
          description: 'Valid description longer than 10 chars',
          course: '507f1f77bcf86cd799439011',
          dueDate: new Date().toISOString()
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.some(e => e.path === 'body.title')).toBe(true);
    });

    it('SHOULD fail if course ID is invalid format', async () => {
      const res = await request(app)
        .post('/test/assignment')
        .send({
          title: 'Physics 101',
          description: 'Valid description longer than 10 chars',
          course: 'invalid-id',
          dueDate: new Date().toISOString()
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.some(e => e.path === 'body.course')).toBe(true);
    });
  });
});

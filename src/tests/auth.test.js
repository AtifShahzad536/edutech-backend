const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Integration Tests', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };

  it('SHOULD register a new student user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();

    const user = await User.findOne({ email: testUser.email });
    expect(user).toBeTruthy();
  });

  it('SHOULD NOT register an existing user', async () => {
    await User.create({
      firstName: 'Existing',
      lastName: 'User',
      email: testUser.email,
      password: 'password123'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(400); // Or whatever error code you use for duplicates
    expect(res.body.success).toBe(false);
  });

  it('SHOULD login an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('SHOULD NOT login with wrong credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('SHOULD return error for invalid registration data (Zod)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'T',
        lastName: 'U',
        email: 'invalid-email',
        password: '123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});

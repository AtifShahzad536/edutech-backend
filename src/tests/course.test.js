const request = require('supertest');
const app = require('../app');
const Course = require('../models/Course');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

describe('Course Integration Tests', () => {
  let instructorToken;
  let instructorId;

  beforeAll(async () => {
    const instructor = await User.create({
      firstName: 'Instructor',
      lastName: 'One',
      email: 'instructor@example.com',
      password: 'password123',
      role: 'instructor'
    });
    instructorId = instructor._id;
    instructorToken = generateToken(instructorId);
  });

  it('SHOULD create a new course as instructor', async () => {
    const courseData = {
      title: 'New Course',
      description: 'Test Description',
      thumbnail: 'http://test.com/img.jpg',
      price: 49.99,
      category: 'Development',
      level: 'beginner'
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(courseData.title);
  });

  it('SHOULD get all published courses', async () => {
    await Course.create({
      title: 'Published Course',
      description: 'Desc',
      thumbnail: 'thumb.jpg',
      price: 10,
      category: 'Design',
      instructorId,
      isPublished: true
    });

    const res = await request(app).get('/api/courses');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].isPublished).toBe(true);
  });

  it('SHOULD NOT get unpublished courses in public feed', async () => {
    await Course.create({
      title: 'Draft Course',
      description: 'Desc',
      thumbnail: 'thumb.jpg',
      price: 10,
      category: 'Business',
      instructorId,
      isPublished: false
    });

    const res = await request(app).get('/api/courses');
    const draft = res.body.data.find(c => c.title === 'Draft Course');
    expect(draft).toBeUndefined();
  });

  it('SHOULD get a course by ID', async () => {
    const course = await Course.create({
      title: 'Single Course',
      description: 'Desc',
      thumbnail: 'thumb.jpg',
      price: 10,
      category: 'Marketing',
      instructorId,
      isPublished: true
    });

    const res = await request(app).get(`/api/courses/${course._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Single Course');
  });
});

const request = require('supertest');
const app = require('../app');
const Course = require('../models/Course');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { generateToken } = require('../utils/token');

describe('Assignment Integration Tests', () => {
  let instructorToken, studentToken;
  let instructorId, studentId, courseId;

  beforeEach(async () => {
    // 1. Setup Users
    const instructor = await User.create({
      firstName: 'Teacher',
      lastName: 'One',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'instructor'
    });
    instructorId = instructor._id;
    instructorToken = generateToken(instructorId);

    const student = await User.create({
      firstName: 'Pupil',
      lastName: 'One',
      email: 'pupil@example.com',
      password: 'password123',
      role: 'student',
      enrolledCourses: [] // To be updated
    });
    studentId = student._id;
    studentToken = generateToken(studentId);

    // 2. Setup Course
    const course = await Course.create({
      title: 'Math 101',
      description: 'Intro to Math',
      thumbnail: 'math.jpg',
      price: 0,
      category: 'Development',
      instructorId: instructorId,
      isPublished: true
    });
    courseId = course._id;

    // Enroll student
    await User.findByIdAndUpdate(studentId, { $push: { enrolledCourses: courseId } });
  });

  it('SHOULD create an assignment as instructor', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Equations 1',
        description: 'Solve all problems',
        course: courseId,
        dueDate: new Date(Date.now() + 86400000)
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Equations 1');
  });

  it('SHOULD submit an assignment as student', async () => {
    const assignment = await Assignment.create({
      title: 'Homework',
      description: 'Do it',
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .post(`/api/assignments/${assignment._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        content: 'My solution is 42',
        attachments: ['link_to_pdf']
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it('SHOULD get student assignments', async () => {
    await Assignment.create({
      title: 'Task A',
      description: 'A',
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .get('/api/assignments/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('SHOULD grade a submission as instructor', async () => {
    const assignment = await Assignment.create({
      title: 'Gradable Task',
      description: 'Proof of work',
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(Date.now() + 86400000)
    });

    // Create a submission manually first
    const submission = await request(app)
      .post(`/api/assignments/${assignment._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'I did it' });
    
    const submissionId = submission.body.data._id;

    const res = await request(app)
      .patch(`/api/assignments/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        grade: 95,
        feedback: 'Excellent work!'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grade).toBe(95);
    expect(res.body.data.status).toBe('graded');
  });

  it('SHOULD get assignments for instructor', async () => {
    await Assignment.create({
      title: 'Instructor view test',
      description: 'Test descriptions',
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .get('/api/assignments/instructor')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('SHOULD handle student with NO courses gracefully', async () => {
    const freshStudent = await User.create({
      firstName: 'No',
      lastName: 'Enroll',
      email: 'no@example.com',
      password: 'password123',
      role: 'student'
    });
    const token = generateToken(freshStudent._id);

    const res = await request(app)
      .get('/api/assignments/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.stats.avgGrade).toBe(null);
  });

  it('SHOULD handle assignments with 0 totalPoints without crashing', async () => {
    // 1. Create assignment with 0 totalPoints
    const assignment = await Assignment.create({
      title: 'Zero Point Task',
      description: 'Free task',
      course: courseId,
      instructor: instructorId,
      dueDate: new Date(Date.now() + 86400000),
      totalPoints: 0
    });

    // 2. Submit it
    await request(app)
      .post(`/api/assignments/${assignment._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'I am done' });

    // 3. Grade it
    const submissions = await request(app)
      .get(`/api/assignments/${assignment._id}/submissions`)
      .set('Authorization', `Bearer ${instructorToken}`);
    
    const submissionId = submissions.body.data[0]._id;

    await request(app)
      .patch(`/api/assignments/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ grade: 0 });

    // 4. Get stats
    const res = await request(app)
      .get('/api/assignments/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    // avgGrade might be NaN or Infinity if not handled, let's see what happens
  });
});

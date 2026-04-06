const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Assignment = require('./src/models/Assignment');
const Submission = require('./src/models/Submission');

dotenv.config();

const users = [
  { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'password123', role: 'admin' },
  { firstName: 'Instructor', lastName: 'John', email: 'instructor@example.com', password: 'password123', role: 'instructor' },
  { firstName: 'Jane', lastName: 'Doe', email: 'student@example.com', password: 'password123', role: 'student' },
  { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: 'password123', role: 'student' },
  { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', password: 'password123', role: 'student' },
  { firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', password: 'password123', role: 'instructor' }
];

const courseTemplates = [
  { title: 'Complete Web Development Bootcamp', description: 'HTML, CSS, JS, React, Node.', thumbnail: '/course-1.jpg', price: 89.99, category: 'Web Development', level: 'beginner' },
  { title: 'Data Science with Python', description: 'Pandas, NumPy, Scikit-Learn.', thumbnail: '/course-2.jpg', price: 99.99, category: 'Data Science', level: 'intermediate' },
  { title: 'UI/UX Design Masterclass', description: 'Figma, Design Systems, UX Research.', thumbnail: '/course-3.jpg', price: 79.99, category: 'Design', level: 'beginner' },
  { title: 'Advanced React Patterns', description: 'HOCs, Render Props, Hooks.', thumbnail: '/course-4.jpg', price: 129.99, category: 'Web Development', level: 'advanced' },
  { title: 'Digital Marketing 2024', description: 'SEO, SEM, Social Media.', thumbnail: '/course-5.jpg', price: 49.99, category: 'Marketing', level: 'beginner' }
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔄 Cleaning database...');
    await Promise.all([
      User.deleteMany(),
      Course.deleteMany(),
      Assignment.deleteMany(),
      Submission.deleteMany()
    ]);

    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    const instructors = createdUsers.filter(u => u.role === 'instructor');
    const students = createdUsers.filter(u => u.role === 'student');

    console.log('📚 Creating courses...');
    const courses = courseTemplates.map((c, i) => ({
      ...c,
      instructorId: instructors[i % instructors.length]._id,
      isPublished: true,
      studentsCount: Math.floor(Math.random() * 500) + 50,
      rating: 4.5 + Math.random() * 0.5,
      lessonsCount: 20 + i * 5
    }));
    const createdCourses = await Course.create(courses);

    console.log('🔗 Enrolling students...');
    for (const student of students) {
        // Enroll each student in 2 random courses
        const shuffled = [...createdCourses].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        student.enrolledCourses = selected.map(c => c._id);
        await student.save();
    }

    console.log('📝 Creating assignments...');
    const assignments = [];
    for (const course of createdCourses) {
        assignments.push({
            title: `Introduction to ${course.category} Task`,
            description: `Complete the first module of ${course.title}. Show your work in a PDF or Repo link.`,
            course: course._id,
            instructor: course.instructorId,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            totalPoints: 100
        });
    }
    const createdAssignments = await Assignment.create(assignments);

    console.log('📤 Mocking submissions...');
    for (const student of students) {
        for (const courseId of student.enrolledCourses) {
            const assignment = createdAssignments.find(a => a.course.toString() === courseId.toString());
            if (assignment && Math.random() > 0.3) {
                await Submission.create({
                    assignment: assignment._id,
                    student: student._id,
                    content: 'I have completed the task. Here is my work.',
                    status: 'submitted',
                    submittedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
                });
            }
        }
    }

    console.log('✅ Seeding Complete!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error seeding: ${error.message}`);
    process.exit(1);
  }
};

importData();

/**
 * EduTech Platform Database Seeder
 * Run: npm run seed
 * This will DELETE existing data and insert fresh seed data.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../..', '.env') });

const User = require('../models/User');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Discussion = require('../models/Discussion');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Edutech';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📡 MongoDB Connected for seeding...');

    // Clear all existing data
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      LiveClass.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Discussion.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // ── 1. USERS ────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const usersData = [
      // Admin
      {
        firstName: 'Super', lastName: 'Admin',
        email: 'admin@edutech.com', password: hashedPassword,
        role: 'admin', bio: 'Platform administrator',
        avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff'
      },
      // Instructors
      {
        firstName: 'Sarah', lastName: 'Wilson',
        email: 'sarah@edutech.com', password: hashedPassword,
        role: 'instructor',
        bio: 'Full-stack developer and educator with 10+ years of experience.',
        location: 'San Francisco, CA',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=8b5cf6&color=fff'
      },
      {
        firstName: 'Dr. Mike', lastName: 'Chen',
        email: 'mike@edutech.com', password: hashedPassword,
        role: 'instructor',
        bio: 'Data Scientist at Google, PhD Stanford. Passionate about ML education.',
        location: 'Mountain View, CA',
        avatar: 'https://ui-avatars.com/api/?name=Mike+Chen&background=06b6d4&color=fff'
      },
      // Students
      {
        firstName: 'John', lastName: 'Doe',
        email: 'john@student.com', password: hashedPassword,
        role: 'student', bio: 'Aspiring web developer.',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=10b981&color=fff'
      },
      {
        firstName: 'Emily', lastName: 'Clark',
        email: 'emily@student.com', password: hashedPassword,
        role: 'student', bio: 'UX enthusiast turning into a full-stack dev.',
        avatar: 'https://ui-avatars.com/api/?name=Emily+Clark&background=f59e0b&color=fff'
      },
      {
        firstName: 'Ahmed', lastName: 'Khan',
        email: 'ahmed@student.com', password: hashedPassword,
        role: 'student', bio: 'Data science student at university.',
        avatar: 'https://ui-avatars.com/api/?name=Ahmed+Khan&background=ef4444&color=fff'
      },
      {
        firstName: 'Lisa', lastName: 'Park',
        email: 'lisa@student.com', password: hashedPassword,
        role: 'student', bio: 'Marketing professional learning tech skills.',
        avatar: 'https://ui-avatars.com/api/?name=Lisa+Park&background=ec4899&color=fff'
      },
      {
        firstName: 'Alex', lastName: 'Thompson',
        email: 'alex@student.com', password: hashedPassword,
        role: 'student', bio: 'Software engineer upskilling in React.',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=3b82f6&color=fff'
      },
    ];

    const users = await User.insertMany(usersData);
    const [admin, sarah, mike, john, emily, ahmed, lisa, alex] = users;
    console.log(`✅ Seeded ${users.length} users`);

    // ── 2. COURSES ────────────────────────────────────────────────
    const coursesData = [
      {
        title: 'Complete Web Development Bootcamp 2025',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, MongoDB and more. The ultimate full-stack course for beginners to professionals.',
        thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&auto=format&fit=crop',
        price: 89.99, originalPrice: 149.99,
        instructorId: sarah._id,
        category: 'Development', level: 'beginner',
        rating: 4.8, studentsCount: 12400, reviewsCount: 3200,
        duration: 42, lessonsCount: 185, isPublished: true,
        sections: [
          {
            title: 'Getting Started with Web Development',
            description: 'Introduction to web development concepts',
            order: 0,
            lessons: [
              { title: 'Course Overview & Setup', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 8, isFree: true },
              { title: 'How the Web Works', videoUrl: '', duration: 12, isFree: true },
              { title: 'Setting Up Your Dev Environment', videoUrl: '', duration: 15, isFree: false },
            ]
          },
          {
            title: 'HTML5 Fundamentals',
            description: 'Master the building blocks of the web',
            order: 1,
            lessons: [
              { title: 'HTML Structure & Semantics', videoUrl: '', duration: 20, isFree: false },
              { title: 'Forms & Input Elements', videoUrl: '', duration: 18, isFree: false },
              { title: 'HTML5 New Features', videoUrl: '', duration: 22, isFree: false },
            ]
          },
          {
            title: 'CSS3 & Modern Layouts',
            description: 'Style beautiful, responsive websites',
            order: 2,
            lessons: [
              { title: 'CSS Selectors & Properties', videoUrl: '', duration: 25, isFree: false },
              { title: 'Flexbox Mastery', videoUrl: '', duration: 30, isFree: false },
              { title: 'CSS Grid Layout', videoUrl: '', duration: 28, isFree: false },
              { title: 'Responsive Design', videoUrl: '', duration: 35, isFree: false },
            ]
          }
        ]
      },
      {
        title: 'Python for Data Science & Machine Learning',
        description: 'Master Python, Pandas, NumPy, Matplotlib, Scikit-learn, TensorFlow, and build real ML projects.',
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop',
        price: 94.99, originalPrice: 179.99,
        instructorId: mike._id,
        category: 'Data Science', level: 'intermediate',
        rating: 4.9, studentsCount: 18200, reviewsCount: 5100,
        duration: 58, lessonsCount: 240, isPublished: true,
        sections: [
          {
            title: 'Python Foundations for Data Science',
            description: 'Core Python skills for data work',
            order: 0,
            lessons: [
              { title: 'Python Setup & Jupyter Notebooks', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 10, isFree: true },
              { title: 'NumPy Fundamentals', videoUrl: '', duration: 25, isFree: false },
              { title: 'Pandas DataFrames', videoUrl: '', duration: 30, isFree: false },
            ]
          },
          {
            title: 'Machine Learning Algorithms',
            description: 'Build and evaluate ML models',
            order: 1,
            lessons: [
              { title: 'Linear & Logistic Regression', videoUrl: '', duration: 35, isFree: false },
              { title: 'Decision Trees & Random Forest', videoUrl: '', duration: 40, isFree: false },
              { title: 'Neural Networks Intro', videoUrl: '', duration: 45, isFree: false },
            ]
          }
        ]
      },
      {
        title: 'UI/UX Design: From Zero to Hero',
        description: 'Master Figma, design systems, user research, prototyping, and build a stunning portfolio of real projects.',
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
        price: 79.99, originalPrice: 129.99,
        instructorId: sarah._id,
        category: 'Design', level: 'beginner',
        rating: 4.7, studentsCount: 8600, reviewsCount: 2100,
        duration: 35, lessonsCount: 142, isPublished: true,
        sections: [
          {
            title: 'Design Fundamentals',
            description: 'Core principles of great design',
            order: 0,
            lessons: [
              { title: 'Design Thinking Overview', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 12, isFree: true },
              { title: 'Color Theory & Typography', videoUrl: '', duration: 20, isFree: false },
            ]
          }
        ]
      },
      {
        title: 'Advanced React & TypeScript Patterns',
        description: 'Master React hooks, Context API, TypeScript generics, custom hooks, performance optimization, and enterprise patterns.',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
        price: 99.99, originalPrice: 199.99,
        instructorId: sarah._id,
        category: 'Development', level: 'advanced',
        rating: 4.9, studentsCount: 5300, reviewsCount: 1800,
        duration: 28, lessonsCount: 112, isPublished: true,
        sections: [
          {
            title: 'TypeScript Deep Dive',
            description: 'Advanced TypeScript for React developers',
            order: 0,
            lessons: [
              { title: 'Generics & Conditional Types', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 30, isFree: true },
              { title: 'React + TypeScript Best Practices', videoUrl: '', duration: 35, isFree: false },
            ]
          }
        ]
      },
      {
        title: 'Digital Marketing Masterclass 2025',
        description: 'SEO, Google Ads, Facebook Ads, email marketing, content strategy and analytics. Launch your digital marketing career.',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
        price: 69.99, originalPrice: 119.99,
        instructorId: mike._id,
        category: 'Marketing', level: 'all',
        rating: 4.6, studentsCount: 21000, reviewsCount: 4800,
        duration: 47, lessonsCount: 198, isPublished: true,
        sections: [
          {
            title: 'SEO Fundamentals',
            description: 'Rank higher on Google',
            order: 0,
            lessons: [
              { title: 'How Search Engines Work', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 15, isFree: true },
              { title: 'Keyword Research Mastery', videoUrl: '', duration: 25, isFree: false },
            ]
          }
        ]
      },
      {
        title: 'Business Strategy & Entrepreneurship',
        description: 'Learn business model canvas, competitive analysis, financial planning, and how to launch a successful startup.',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop',
        price: 59.99, originalPrice: 99.99,
        instructorId: mike._id,
        category: 'Business', level: 'all',
        rating: 4.5, studentsCount: 9800, reviewsCount: 2200,
        duration: 32, lessonsCount: 128, isPublished: true,
        sections: [
          {
            title: 'Business Foundations',
            description: 'Core business strategy concepts',
            order: 0,
            lessons: [
              { title: 'Business Model Canvas', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: 20, isFree: true },
              { title: 'Market Research Methods', videoUrl: '', duration: 25, isFree: false },
            ]
          }
        ]
      }
    ];

    const courses = await Course.insertMany(coursesData);
    const [webDev, dataSci, uiux, react, marketing, business] = courses;
    console.log(`✅ Seeded ${courses.length} courses`);

    // ── 3. ENROLL STUDENTS ────────────────────────────────────────
    john.enrolledCourses = [webDev._id, react._id];
    emily.enrolledCourses = [webDev._id, uiux._id];
    ahmed.enrolledCourses = [dataSci._id, webDev._id];
    lisa.enrolledCourses = [marketing._id, business._id];
    alex.enrolledCourses = [react._id, webDev._id];

    await Promise.all([john.save(), emily.save(), ahmed.save(), lisa.save(), alex.save()]);
    console.log('✅ Enrolled students in courses');

    // ── 4. LIVE CLASSES ────────────────────────────────────────────
    const crypto = require('crypto');

    const liveClassesData = [
      {
        title: 'React Hooks Deep Dive - Live Coding',
        description: 'We will build a real-time todo app using React hooks, Context, and useReducer.',
        instructor: sarah._id,
        course: react._id,
        module: 'React Advanced Patterns',
        status: 'upcoming',
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        roomId: crypto.randomUUID()
      },
      {
        title: 'ML Model Deployment Workshop',
        description: 'Learn how to deploy your ML models to production using Flask and Docker.',
        instructor: mike._id,
        course: dataSci._id,
        module: 'Machine Learning in Production',
        status: 'live',
        scheduledFor: new Date(),
        startedAt: new Date(Date.now() - 20 * 60 * 1000),
        roomId: crypto.randomUUID()
      },
      {
        title: 'CSS Grid Masterclass - Recorded',
        description: 'Full walkthrough of CSS Grid with real project builds.',
        instructor: sarah._id,
        course: webDev._id,
        module: 'CSS3 & Modern Layouts',
        status: 'ended',
        scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        duration: '90 min',
        recordingUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        addedToCurriculum: true,
        roomId: crypto.randomUUID()
      }
    ];

    const liveClasses = await LiveClass.insertMany(liveClassesData);
    console.log(`✅ Seeded ${liveClasses.length} live classes`);

    // ── 5. ASSIGNMENTS ────────────────────────────────────────────
    const assignmentsData = [
      {
        title: 'Build a Responsive Landing Page',
        description: 'Create a fully responsive landing page using HTML5 and CSS3. Include a navbar, hero section, features section, and footer.',
        course: webDev._id,
        instructor: sarah._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        status: 'active'
      },
      {
        title: 'JavaScript DOM Manipulation Project',
        description: 'Build an interactive quiz app that dynamically renders questions and tracks the user\'s score using vanilla JS DOM manipulation.',
        course: webDev._id,
        instructor: sarah._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        status: 'active'
      },
      {
        title: 'Custom React Hooks Library',
        description: 'Create a library of 5 custom React hooks (useLocalStorage, useDebounce, useFetch, useToggle, useClickOutside) with full TypeScript types.',
        course: react._id,
        instructor: sarah._id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        totalPoints: 150,
        status: 'active'
      },
      {
        title: 'Exploratory Data Analysis Report',
        description: 'Perform EDA on the Titanic dataset. Create visualizations, identify patterns, and write a report of your findings.',
        course: dataSci._id,
        instructor: mike._id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        status: 'active'
      },
      {
        title: 'SEO Audit for a Real Website',
        description: 'Pick any website and perform a full SEO audit. Use tools like Google Search Console, Ahrefs, or SEMrush.',
        course: marketing._id,
        instructor: mike._id,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        totalPoints: 80,
        status: 'active'
      }
    ];

    const assignments = await Assignment.insertMany(assignmentsData);
    console.log(`✅ Seeded ${assignments.length} assignments`);

    // ── 6. SUBMISSIONS ────────────────────────────────────────────
    const submissionsData = [
      {
        assignment: assignments[0]._id,
        student: john._id,
        content: 'Here is my responsive landing page: https://github.com/johndoe/landing-page',
        status: 'graded',
        grade: 88,
        feedback: 'Great work! The layout is clean. Consider improving mobile breakpoints.',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        assignment: assignments[2]._id,
        student: alex._id,
        content: 'My custom hooks library: https://github.com/alex/react-hooks-lib',
        status: 'submitted',
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];

    await Submission.insertMany(submissionsData);
    console.log(`✅ Seeded ${submissionsData.length} submissions`);

    // ── 7. DISCUSSIONS ────────────────────────────────────────────
    const discussionsData = [
      {
        course: webDev._id,
        user: john._id,
        title: 'CSS Grid vs Flexbox - When to use which?',
        content: 'I\'ve been confused about when to use CSS Grid vs Flexbox. Can someone explain the key differences and use cases?'
      },
      {
        course: webDev._id,
        user: emily._id,
        title: 'Best practices for React component organization',
        content: 'How do you all organize your React components? Feature-based or type-based folder structure?'
      },
      {
        course: dataSci._id,
        user: ahmed._id,
        title: 'Handling missing data in pandas',
        content: 'What\'s the best strategy for handling missing data? Should I always use mean imputation?'
      },
      {
        course: react._id,
        user: alex._id,
        title: 'TypeScript strict mode - worth it?',
        content: 'Is enabling strict mode in TypeScript worth the extra effort? I\'ve been getting a lot of errors after enabling it.'
      }
    ];

    await Discussion.insertMany(discussionsData);
    console.log(`✅ Seeded ${discussionsData.length} discussions`);

    // ── 8. NOTIFICATIONS ─────────────────────────────────────────
    const notificationsData = [
      {
        user: john._id,
        title: 'New Assignment Posted',
        message: 'A new assignment "Build a Responsive Landing Page" has been posted in Web Development Bootcamp.',
        type: 'assignment',
        isRead: false
      },
      {
        user: john._id,
        title: 'Assignment Graded',
        message: 'Your assignment has been graded. You scored 88/100. Check your feedback!',
        type: 'grade',
        isRead: false
      },
      {
        user: emily._id,
        title: 'Live Class Starting Soon',
        message: 'A live class "React Hooks Deep Dive" starts in 30 minutes. Click to join.',
        type: 'live',
        isRead: false
      },
      {
        user: ahmed._id,
        title: 'New Discussion Reply',
        message: 'Someone replied to your discussion "Handling missing data in pandas".',
        type: 'discussion',
        isRead: true
      }
    ];

    const notifs = await Notification.insertMany(notificationsData);

    // Link notifications to users
    john.notifications = [notifs[0]._id, notifs[1]._id];
    emily.notifications = [notifs[2]._id];
    ahmed.notifications = [notifs[3]._id];
    await Promise.all([john.save(), emily.save(), ahmed.save()]);
    console.log(`✅ Seeded ${notificationsData.length} notifications`);

    console.log('\n🎉 Seeding Complete! Here are your test credentials:');
    console.log('─────────────────────────────────────────');
    console.log('ADMIN:      admin@edutech.com / Password123!');
    console.log('INSTRUCTOR: sarah@edutech.com / Password123!');
    console.log('INSTRUCTOR: mike@edutech.com  / Password123!');
    console.log('STUDENT:    john@student.com  / Password123!');
    console.log('STUDENT:    emily@student.com / Password123!');
    console.log('STUDENT:    ahmed@student.com / Password123!');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

const courseRepository = require('../repositories/course.repository');
const userRepository = require('../repositories/user.repository');

class HomeService {
  async getHomeStats() {
    const [totalCourses, totalStudents, totalInstructors] = await Promise.all([
      courseRepository.countCourses({ isPublished: true }),
      userRepository.countUsers({ role: 'student' }),
      userRepository.countUsers({ role: 'instructor' })
    ]);

    return {
      totalCourses,
      totalStudents,
      totalInstructors,
      totalCertificates: totalStudents * 2, // Simulated
    };
  }

  async getFeaturedCourses() {
    const courses = await courseRepository.findCourses(
      { isPublished: true },
      { rating: -1, studentsCount: -1 },
      0,
      8
    );

    return courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      originalPrice: course.originalPrice,
      category: course.category,
      level: course.level,
      rating: course.rating,
      studentsCount: course.studentsCount,
      reviewsCount: course.reviewsCount,
      lessonsCount: course.lessonsCount,
      duration: course.duration,
      instructor: course.instructorId ? `${course.instructorId.firstName} ${course.instructorId.lastName}` : 'Expert Instructor',
      instructorAvatar: course.instructorId?.avatar || '',
    }));
  }

  async getLatestCourses() {
    const courses = await courseRepository.findCourses(
      { isPublished: true },
      { createdAt: -1 },
      0,
      6
    );

    return courses.map(course => ({
      id: course._id,
      title: course.title,
      thumbnail: course.thumbnail,
      price: course.price,
      rating: course.rating,
      studentsCount: course.studentsCount,
      category: course.category,
      level: course.level,
      instructor: course.instructorId ? `${course.instructorId.firstName} ${course.instructorId.lastName}` : 'Expert Instructor',
    }));
  }
}

module.exports = new HomeService();

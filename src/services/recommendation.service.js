const courseRepository = require('../repositories/course.repository');
const userRepository = require('../repositories/user.repository');

class RecommendationService {
  async getRecommendations(userId) {
    const user = await userRepository.findUserById(userId);
    await user.populate('enrolledCourses', 'category title instructorId');

    const enrolledIds = user.enrolledCourses.map(c => c._id.toString());
    const enrolledCategories = [...new Set(user.enrolledCourses.map(c => c.category))];

    let recommendedCourses = [];

    if (enrolledCategories.length > 0) {
      recommendedCourses = await courseRepository.findCourses(
        { _id: { $nin: enrolledIds }, category: { $in: enrolledCategories }, isPublished: true },
        { populate: 'instructorId firstName lastName avatar', sort: { rating: -1, studentsCount: -1 }, limit: 6 }
      );
    }

    if (recommendedCourses.length < 4) {
      const extraCourses = await courseRepository.findCourses(
        { _id: { $nin: [...enrolledIds, ...recommendedCourses.map(c => c._id.toString())] }, isPublished: true },
        { populate: 'instructorId firstName lastName avatar', sort: { rating: -1, studentsCount: -1 }, limit: 6 - recommendedCourses.length }
      );
      recommendedCourses = [...recommendedCourses, ...extraCourses];
    }

    let aiMessage = "Start your learning journey! Here are our top-rated courses to get you going.";
    if (enrolledCategories.length > 0) {
      const recentCourse = user.enrolledCourses[user.enrolledCourses.length - 1];
      aiMessage = `I've noticed you're studying ${enrolledCategories[0]}. Based on your learning journey in "${recentCourse?.title || 'your recent course'}", these courses will complement your skills perfectly.`;
    }

    return {
      aiMessage,
      enrolledCategories,
      recommendations: recommendedCourses.map(course => ({
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
        instructor: course.instructorId ? `${course.instructorId.firstName} ${course.instructorId.lastName}` : 'Expert Instructor',
        instructorAvatar: course.instructorId?.avatar || '',
        matchScore: enrolledCategories.includes(course.category) ? Math.floor(Math.random() * 10 + 90) : Math.floor(Math.random() * 15 + 75)
      }))
    };
  }

  async aiGuideChat(message, userId) {
    const user = await userRepository.findUserById(userId);
    await user.populate('enrolledCourses', 'title category');

    const enrolledTitles = user.enrolledCourses.map(c => c.title).join(', ');
    const categories = [...new Set(user.enrolledCourses.map(c => c.category))];

    let reply = '';
    const lowerMsg = message?.toLowerCase() || '';

    if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest')) {
      reply = `Based on your interest in ${categories.join(' and ') || 'learning'}, I recommend exploring advanced topics in ${categories[0] || 'Development'}. Would you like me to show you the top-rated courses right now?`;
    } else if (lowerMsg.includes('progress') || lowerMsg.includes('how am i doing')) {
      reply = `You're enrolled in ${user.enrolledCourses.length} course(s): ${enrolledTitles || 'none yet'}. Keep up the great work! Consistency is the key to mastery.`;
    } else if (lowerMsg.includes('help') || lowerMsg.includes('how')) {
      reply = `I can help you find the right courses, track your progress, and suggest what to learn next. What specific topic are you working on?`;
    } else {
      reply = `Great question! Based on your learning history in ${categories.join(' and ') || 'various topics'}, I suggest staying consistent with your current studies. You're on the right track! Is there a specific concept you'd like resources for?`;
    }

    return reply;
  }
}

module.exports = new RecommendationService();

const discussionRepository = require('../repositories/discussion.repository');
const AppError = require('../utils/appError');

class DiscussionService {
  async getDiscussions(courseId) {
    return discussionRepository.findDiscussions(
      { course: courseId },
      [{ path: 'user', select: 'firstName lastName avatar' }],
      { createdAt: -1 }
    );
  }

  async createDiscussion(data, userId) {
    return discussionRepository.createDiscussion({
      course: data.courseId,
      user: userId,
      title: data.title,
      content: data.content
    });
  }

  async getAllDiscussions() {
    return discussionRepository.findDiscussions(
      {},
      [
        { path: 'user', select: 'firstName lastName avatar role' },
        { path: 'course', select: 'title' }
      ],
      { createdAt: -1 }
    );
  }

  async getDiscussionById(id) {
    const discussion = await discussionRepository.findDiscussionById(id, [
      { path: 'user', select: 'firstName lastName avatar role' },
      { path: 'course', select: 'title' },
      { path: 'replies.user', select: 'firstName lastName avatar role' }
    ]);

    if (!discussion) throw new AppError('Discussion not found', 404);

    discussion.views += 1;
    await discussion.save();
    return discussion;
  }

  async addReply(id, content, userId) {
    const discussion = await discussionRepository.findDiscussionById(id);
    if (!discussion) throw new AppError('Discussion not found', 404);

    discussion.replies.push({
      user: userId,
      content,
      createdAt: Date.now()
    });

    await discussion.save();

    const updated = await discussionRepository.findDiscussionById(id, [
      { path: 'replies.user', select: 'firstName lastName avatar role' }
    ]);
    return updated.replies;
  }

  async toggleLike(id, userId) {
    const discussion = await discussionRepository.findDiscussionById(id);
    if (!discussion) throw new AppError('Discussion not found', 404);

    const likeIndex = discussion.likes.indexOf(userId);
    if (likeIndex > -1) {
      discussion.likes.splice(likeIndex, 1);
    } else {
      discussion.likes.push(userId);
    }

    await discussion.save();
    return discussion.likes;
  }

  async toggleReplyLike(discussionId, replyId, userId) {
    const discussion = await discussionRepository.findDiscussionById(discussionId);
    if (!discussion) throw new AppError('Discussion not found', 404);

    const reply = discussion.replies.id(replyId);
    if (!reply) throw new AppError('Reply not found', 404);

    const likeIndex = reply.likes.indexOf(userId);
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(userId);
    }

    await discussion.save();

    const updated = await discussionRepository.findDiscussionById(discussionId, [
      { path: 'replies.user', select: 'firstName lastName avatar role' }
    ]);
    return updated.replies;
  }
}

module.exports = new DiscussionService();

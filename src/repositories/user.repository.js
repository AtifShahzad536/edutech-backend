const User = require('../models/User');

const findUserByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });
  if (includePassword) {
    query.select('+password');
  }
  return query.populate({
    path: 'enrolledCourses',
    populate: { path: 'instructorId', select: 'firstName lastName avatar', strictPopulate: false }
  });
};

const findUserById = async (id) => {
  return User.findById(id).populate({
    path: 'enrolledCourses',
    populate: { path: 'instructorId', select: 'firstName lastName avatar', strictPopulate: false }
  });
};

const createUser = async (data) => {
  return User.create(data);
};

const updateUser = async (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
};

const countUsers = async (query = {}) => {
  return User.countDocuments(query);
};

const findUsers = async (query = {}, options = {}) => {
  const q = User.find(query).select(options.select || '-password');
  if (options.sort) q.sort(options.sort);
  if (options.limit) q.limit(options.limit);
  return q.lean();
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  countUsers,
  findUsers,
};

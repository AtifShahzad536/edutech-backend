const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const formatAuthPayload = (user) => {
  const token = generateToken(user._id.toString());
  
  const userData = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    enrolledCourses: user.enrolledCourses || [],
  };

  return { token, user: userData };
};

module.exports = { generateToken, formatAuthPayload };

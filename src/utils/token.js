const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
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

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

module.exports = { generateToken, sendTokenResponse };

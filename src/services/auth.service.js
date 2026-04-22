const userRepository = require('../repositories/user.repository');
const emailService = require('./emailService');
const AppError = require('../utils/appError');
const { formatAuthPayload } = require('../utils/token');

const registerUser = async (data) => {
  const { firstName, lastName, email, password, role } = data;

  const userExists = await userRepository.findUserByEmail(email);
  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  const user = await userRepository.createUser({
    firstName,
    lastName,
    email,
    password,
    role
  });

  // Non-blocking email
  emailService.sendWelcomeEmail(user).catch(err => console.error('Welcome Email Failed:', err.message));

  return formatAuthPayload(user);
};

const loginUser = async (email, password) => {
  const user = await userRepository.findUserByEmail(email, true);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  return formatAuthPayload(user);
};

const getMe = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

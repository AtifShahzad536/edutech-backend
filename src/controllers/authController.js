const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response.util');

const register = async (req, res, next) => {
  try {
    const payload = await authService.registerUser(req.body);
    return res.status(201).json(successResponse(payload, 'Registration successful'));
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = await authService.loginUser(req.body.email, req.body.password);
    return res.status(200).json(successResponse(payload, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};

const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/response.util');

const getPlatformStats = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformStats();
    return res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    return res.json(successResponse({ users }, undefined, { count: users.length }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers
};

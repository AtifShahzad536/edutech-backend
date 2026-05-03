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

const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    return res.json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    return res.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await adminService.getSettings();
    return res.json(successResponse(settings));
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await adminService.updateSettings(req.body);
    return res.json(successResponse(settings, 'Settings updated successfully'));
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const payments = await adminService.getPayments(req.query);
    return res.json(successResponse(payments));
  } catch (error) {
    next(error);
  }
};

const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPaymentStats();
    return res.json(successResponse(stats));
  } catch (error) {
    next(error);
  }
};

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getPlatformAnalytics();
    return res.json(successResponse(analytics));
  } catch (error) {
    next(error);
  }
};

const getLiveClasses = async (req, res, next) => {
  try {
    const data = await adminService.getAllLiveClasses();
    return res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

const getAdminCourses = async (req, res, next) => {
  try {
    const courses = await adminService.getAllCourses();
    return res.json(successResponse(courses));
  } catch (error) {
    next(error);
  }
};

const getAdminAssignments = async (req, res, next) => {
  try {
    const data = await adminService.getAllAssignments();
    return res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  getPayments,
  getPaymentStats,
  getPlatformAnalytics,
  getLiveClasses,
  getAdminCourses,
  getAdminAssignments
};

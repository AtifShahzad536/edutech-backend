const Assignment = require('../models/Assignment');

const findAssignments = async (query = {}, options = {}) => {
  const req = Assignment.find(query);
  if (options.populate) req.populate(options.populate);
  if (options.sort) req.sort(options.sort);
  return req.lean();
};

const findAssignmentById = async (id, populateOptions) => {
  const req = Assignment.findById(id);
  if (populateOptions) req.populate(populateOptions);
  return req.lean();
};

const createAssignment = async (data) => {
  return Assignment.create(data);
};

const updateAssignment = async (id, data) => {
  return Assignment.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

const deleteAssignment = async (id) => {
  return Assignment.findByIdAndDelete(id);
};

module.exports = {
  findAssignments,
  findAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};

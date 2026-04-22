const Submission = require('../models/Submission');

const findSubmissions = async (query = {}, options = {}) => {
  const req = Submission.find(query);
  if (options.populate) req.populate(options.populate);
  if (options.sort) req.sort(options.sort);
  return req.lean();
};

const findSubmissionById = async (id) => {
  return Submission.findById(id).lean();
};

const findOneSubmission = async (query) => {
  return Submission.findOne(query);
};

const createSubmission = async (data) => {
  return Submission.create(data);
};

const updateSubmission = async (id, data) => {
  return Submission.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

const deleteSubmissionsByAssignment = async (assignmentId) => {
  return Submission.deleteMany({ assignment: assignmentId });
};

const aggregateSubmissions = async (pipeline) => {
  return Submission.aggregate(pipeline);
};

module.exports = {
  findSubmissions,
  findSubmissionById,
  findOneSubmission,
  createSubmission,
  updateSubmission,
  deleteSubmissionsByAssignment,
  aggregateSubmissions
};

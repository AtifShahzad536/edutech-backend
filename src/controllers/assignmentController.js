const assignmentService = require('../services/assignmentService');
const { successResponse } = require('../utils/response.util');

const getMyAssignments = async (req, res, next) => {
  try {
    const { assignments, stats } = await assignmentService.getStudentAssignmentsWithStats(req.user.id);
    return res.status(200).json(successResponse(assignments, undefined, { count: assignments.length, stats }));
  } catch (error) { next(error); }
};

const createAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body, req.user.id);
    return res.status(201).json(successResponse(assignment));
  } catch (error) { next(error); }
};

const getCourseAssignments = async (req, res, next) => {
  try {
    const assignments = await assignmentService.getCourseAssignments(req.params.courseId);
    return res.status(200).json(successResponse(assignments, undefined, { count: assignments.length }));
  } catch (error) { next(error); }
};

const submitAssignment = async (req, res, next) => {
  try {
    const submission = await assignmentService.submitAssignment(req.params.id, req.user.id, req.body, req.user.role);
    return res.status(201).json(successResponse(submission));
  } catch (error) { next(error); }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const submission = await assignmentService.gradeSubmission(req.params.id, req.body);
    return res.status(200).json(successResponse(submission));
  } catch (error) { next(error); }
};

const getStudentSubmissions = async (req, res, next) => {
  try {
    const submissions = await assignmentService.getStudentSubmissions(req.user.id);
    return res.status(200).json(successResponse(submissions, undefined, { count: submissions.length }));
  } catch (error) { next(error); }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);
    return res.status(200).json(successResponse(assignment));
  } catch (error) { next(error); }
};

const getInstructorAssignments = async (req, res, next) => {
  try {
    const data = await assignmentService.getInstructorAssignmentsWithMetrics(req.user.id);
    return res.status(200).json(successResponse(data, undefined, { count: data.length }));
  } catch (error) { next(error); }
};

const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const submissions = await assignmentService.getAssignmentSubmissions(req.params.id);
    return res.status(200).json(successResponse(submissions, undefined, { count: submissions.length }));
  } catch (error) { next(error); }
};

const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.user.id, req.user.role, req.body);
    return res.status(200).json(successResponse(assignment));
  } catch (error) { next(error); }
};

const deleteAssignment = async (req, res, next) => {
  try {
    await assignmentService.deleteAssignment(req.params.id, req.user.id, req.user.role);
    return res.status(204).send();
  } catch (error) { next(error); }
};

module.exports = {
  getMyAssignments,
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  gradeSubmission,
  getStudentSubmissions,
  getAssignmentById,
  getInstructorAssignments,
  getAssignmentSubmissions,
  updateAssignment,
  deleteAssignment
};

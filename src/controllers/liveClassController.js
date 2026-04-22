const liveClassService = require('../services/liveClass.service');
const { successResponse } = require('../utils/response.util');

const startLiveClass = async (req, res, next) => {
  try {
    const liveClass = await liveClassService.startLiveClass(req.body, req.user.id);
    return res.status(201).json(successResponse(liveClass));
  } catch (error) { next(error); }
};

const endLiveClass = async (req, res, next) => {
  try {
    const liveClass = await liveClassService.endLiveClass(req.params.id, req.body.recordingUrl, req.user.id);
    return res.json(successResponse(liveClass, 'Live class ended and recording archived.'));
  } catch (error) { next(error); }
};

const getLiveClassesByCourse = async (req, res, next) => {
  try {
    const liveClasses = await liveClassService.getLiveClassesByCourse(req.params.courseId, req.user.id);
    return res.json(successResponse(liveClasses, undefined, { count: liveClasses.length }));
  } catch (error) { next(error); }
};

const getLiveClasses = async (req, res, next) => {
  try {
    const liveClasses = await liveClassService.getLiveClasses(req.user);
    return res.json(successResponse(liveClasses, undefined, { count: liveClasses.length }));
  } catch (error) { next(error); }
};

const getLiveClassById = async (req, res, next) => {
  try {
    const liveClass = await liveClassService.getLiveClassById(req.params.id);
    return res.json(successResponse(liveClass));
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const liveClass = await liveClassService.updateStatus(req.params.id, req.body.status);
    return res.json(successResponse(liveClass));
  } catch (error) { next(error); }
};

const scheduleLiveClass = async (req, res, next) => {
  try {
    const liveClass = await liveClassService.scheduleLiveClass(req.body, req.user.id);
    return res.status(201).json(successResponse(liveClass));
  } catch (error) { next(error); }
};

const pusherTrigger = async (req, res, next) => {
  try {
    await liveClassService.triggerPusher(req.app, req.body.event, req.body.channel, req.body.data);
    return res.json(successResponse(null, 'Event triggered'));
  } catch (error) { next(error); }
};

module.exports = {
  startLiveClass,
  endLiveClass,
  getLiveClassesByCourse,
  getLiveClasses,
  getLiveClassById,
  updateStatus,
  scheduleLiveClass,
  pusherTrigger
};

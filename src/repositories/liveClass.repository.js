const LiveClass = require('../models/LiveClass');
const mongoose = require('mongoose');

const createLiveClass = async (data) => {
  return LiveClass.create(data);
};

const findLiveClassByIdOrRoomId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const lc = await LiveClass.findById(id);
    if (lc) return lc;
  }
  return LiveClass.findOne({ roomId: id });
};

const findLiveClasses = async (query = {}, options = {}) => {
  const req = LiveClass.find(query);
  if (options.populate) req.populate(options.populate);
  if (options.sort) req.sort(options.sort);
  return req.lean ? req.lean() : req; // if we want Mongoose docs, omit lean in some cases, but sticking to standard
};

const getPopulatedLiveClass = async (id, populations) => {
  const req = LiveClass.findById(id);
  if (populations) req.populate(populations);
  return req;
};

module.exports = {
  createLiveClass,
  findLiveClassByIdOrRoomId,
  findLiveClasses,
  getPopulatedLiveClass
};

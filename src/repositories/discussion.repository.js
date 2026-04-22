const Discussion = require('../models/Discussion');

const findDiscussions = async (query = {}, populateOptions = [], sortOptions = {}) => {
  const req = Discussion.find(query);
  populateOptions.forEach(pop => req.populate(pop));
  if (sortOptions) req.sort(sortOptions);
  return req; // Keep as Mongoose document for easier array mutation if needed, but lean() is better. We need mongoose array methods for likes though.
};

const findDiscussionById = async (id, populateOptions = []) => {
  const req = Discussion.findById(id);
  populateOptions.forEach(pop => req.populate(pop));
  return req;
};

const createDiscussion = async (data) => {
  return Discussion.create(data);
};

module.exports = {
  findDiscussions,
  findDiscussionById,
  createDiscussion,
};

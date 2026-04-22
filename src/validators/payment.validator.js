const { z } = require('zod');

const createCheckoutSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID')).min(1, 'Please provide at least one course ID'),
  })
});

module.exports = {
  createCheckoutSchema,
};

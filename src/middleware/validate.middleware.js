const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, message: 'Validation Error', errors });
    }
    console.error('Validation Middleware Error:', error);
    next(error);
  }
};

module.exports = validate;

const { z } = require('zod');

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is too short'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    thumbnail: z.string().url('Invalid thumbnail URL'),
    price: z.number().min(0, 'Price cannot be negative'),
    originalPrice: z.number().min(0).optional(),
    category: z.enum(['Development', 'Design', 'Data Science', 'Business', 'Marketing']),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    duration: z.number().optional(),
    isPublished: z.boolean().optional(),
    sections: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        order: z.number().optional(),
        lessons: z.array(
          z.object({
            title: z.string(),
            videoUrl: z.string().optional(),
            duration: z.number().optional(),
            isFree: z.boolean().optional(),
            resources: z.array(
              z.object({
                title: z.string(),
                url: z.string(),
                fileType: z.string().optional(),
              })
            ).optional(),
          })
        ).optional(),
      })
    ).optional(),
  })
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    thumbnail: z.string().url().optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    category: z.enum(['Development', 'Design', 'Data Science', 'Business', 'Marketing']).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    isPublished: z.boolean().optional(),
  }).strict() // ensure no other unexpected fields
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
};

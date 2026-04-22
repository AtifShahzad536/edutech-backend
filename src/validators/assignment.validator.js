const { z } = require('zod');

const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    course: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID'),
    dueDate: z.string().datetime().optional().or(z.date().optional()),
    totalPoints: z.number().min(0).default(100),
    attachments: z.array(z.any()).optional(),
  })
});

const submitAssignmentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Submission content is required'),
    attachments: z.array(z.any()).optional(),
  })
});

const gradeSubmissionSchema = z.object({
  body: z.object({
    grade: z.number().min(0),
    feedback: z.string().optional(),
  })
});

module.exports = {
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
};

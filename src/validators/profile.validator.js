const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.any()).optional(), // Can be strictly typed later if needed
    education: z.array(z.any()).optional(),
  })
});

module.exports = {
  updateProfileSchema,
};

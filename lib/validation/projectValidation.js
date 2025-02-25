// lib/validation/projectValidation.js
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().optional()
});

export function validateProject(data) {
  return projectSchema.safeParse(data);
}
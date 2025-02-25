// lib/validation/bidValidation.js
import { z } from 'zod';

const bidSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required"),
  bidder: z.string().min(1, "Bidder name is required"),
  totalCost: z.number().optional(),
  keyComponents: z.object({
    materials: z.number().optional(),
    labor: z.number().optional(),
    overhead: z.number().optional()
  }).optional()
});

export function validateBid(data) {
  return bidSchema.safeParse(data);
}
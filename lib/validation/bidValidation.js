// lib/validation/bidValidation.js
import { z } from 'zod';

// Bid validation schema
export const bidSchema = z.object({
  name: z.string().min(1, 'Bid name is required'),
  bidder: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  status: z.enum(['pending', 'processing', 'analyzed']).optional(),
  totalCost: z.number().positive().optional(),
  keyComponents: z.object({
    materials: z.number().positive().optional(),
    labor: z.number().positive().optional(),
    overhead: z.number().positive().optional()
  }).optional(),
  analysisResults: z.any().optional()
});

// Helper function to validate bid data
export function validateBid(data) {
  try {
    const result = bidSchema.safeParse(data);
    return result;
  } catch (error) {
    console.error('Bid validation error:', error);
    return {
      success: false,
      error: {
        format: () => ({ message: error.message })
      }
    };
  }
}
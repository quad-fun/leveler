// lib/validation/projectValidation.js
import { z } from 'zod';

// Project validation schema
export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  totalBudget: z.number().positive().optional().nullable(),
  bidCount: z.number().int().min(0).optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional()
});

// Helper function to validate project data
export function validateProject(data) {
  try {
    // Ensure numeric values are properly converted from strings
    let processedData = { ...data };
    
    if (data.totalBudget && typeof data.totalBudget === 'string') {
      const budgetNum = parseFloat(data.totalBudget);
      processedData.totalBudget = isNaN(budgetNum) ? null : budgetNum;
    }
    
    const result = projectSchema.safeParse(processedData);
    return result;
  } catch (error) {
    console.error('Project validation error:', error);
    return {
      success: false,
      error: {
        format: () => ({ message: error.message })
      }
    };
  }
}
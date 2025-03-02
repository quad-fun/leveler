// lib/validation/projectValidation.js
import { z } from 'zod';

// Create a simple schema for project validation
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  totalBudget: z.number().nullable().optional()
});

export function validateProject(data) {
  try {
    // Handle totalBudget special case - convert string to number if needed
    let processedData = { ...data };
    
    if (typeof data.totalBudget === 'string' && data.totalBudget.trim() !== '') {
      const parsedBudget = parseFloat(data.totalBudget);
      if (!isNaN(parsedBudget)) {
        processedData.totalBudget = parsedBudget;
      }
    }
    
    // Apply validation
    const result = projectSchema.safeParse(processedData);
    return result;
  } catch (error) {
    console.error('Error during project validation:', error);
    return {
      success: false,
      error: {
        format: () => ({ general: 'Validation failed: ' + error.message })
      }
    };
  }
}
// app/api/test-preprocessing/route.js
import { preprocessBidDocuments } from '../../utils/bidPreprocessor';

export async function POST(request) {
  try {
    const { fileContents } = await request.json();
    
    if (!fileContents || !Array.isArray(fileContents)) {
      return Response.json({ 
        error: 'Invalid input', 
        message: 'fileContents must be a non-empty array' 
      }, { status: 400 });
    }
    
    // Process the files
    const preprocessed = preprocessBidDocuments(fileContents);
    
    // Return the processed results
    return Response.json({
      success: true,
      results: preprocessed
    });
  } catch (error) {
    console.error('Preprocessing test error:', error);
    return Response.json({ 
      error: 'Failed to preprocess files',
      message: error.message 
    }, { status: 500 });
  }
}
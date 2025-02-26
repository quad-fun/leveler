// app/api/projects/[id]/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { validateProject } from '@/lib/validation/projectValidation';
import { getProjectById } from '@/lib/mockDataService';

// Flag to force using mock data for testing
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

export async function GET(request, { params }) {
  const { id } = params;
  
  // Special handling for 'new' - this is a client route, not an actual project ID
  if (id === 'new') {
    return Response.json({ error: 'Invalid project ID: "new" is a client-side route' }, { status: 400 });
  }
  
  // If mock data is forced, return mock project
  if (FORCE_MOCK_DATA) {
    console.log(`Using mock project data for ID: ${id} (forced)`);
    const project = getProjectById(id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    return Response.json(project);
  }
  
  try {
    // For MongoDB, validate ObjectId format
    if (!ObjectId.isValid(id)) {
      // If invalid ObjectId format, check if it might be a mock ID
      if (id && id.startsWith('mock-')) {
        const mockProject = getProjectById(id);
        if (mockProject) {
          console.log(`Returning mock project for ID: ${id}`);
          return Response.json(mockProject);
        }
      }
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    
    if (!project) {
      // If not found in MongoDB, check mock data as fallback
      const mockProject = getProjectById(id);
      if (mockProject) {
        console.log(`Falling back to mock project for ID: ${id}`);
        return Response.json(mockProject);
      }
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return Response.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    
    // Try mock data as fallback
    const mockProject = getProjectById(id);
    if (mockProject) {
      console.log(`Falling back to mock project for ID: ${id}`);
      return Response.json(mockProject);
    }
    
    return Response.json({ 
      error: 'Failed to fetch project',
      message: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  // Similar pattern with mock data fallback
  // Implementation omitted for brevity
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Delete the project
    const result = await db.collection("projects").deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    if (result.deletedCount === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Delete all associated bids
    await db.collection("bids").deleteMany({ 
      projectId: id 
    });
    
    return Response.json({ message: 'Project and associated bids deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ 
      error: 'Failed to delete project',
      message: error.message 
    }, { status: 500 });
  }
}
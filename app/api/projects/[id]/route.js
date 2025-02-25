// app/api/projects/[id]/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { validateProject } from '@/lib/validation/projectValidation';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return Response.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return Response.json({ 
      error: 'Failed to fetch project',
      message: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Validate the update data
    const validation = validateProject(data);
    if (!validation.success) {
      return Response.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }
    
    const validData = validation.data;
    
    // Add updated timestamp
    const updateData = {
      ...validData,
      updatedAt: new Date()
    };
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Return the updated project
    const updatedProject = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    return Response.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return Response.json({ 
      error: 'Failed to update project',
      message: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // First check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Delete the project
    await db.collection("projects").deleteOne({ _id: new ObjectId(id) });
    
    // Also delete associated bids
    await db.collection("bids").deleteMany({ projectId: id });
    
    return Response.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ 
      error: 'Failed to delete project',
      message: error.message 
    }, { status: 500 });
  }
}
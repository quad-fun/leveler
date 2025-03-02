// app/api/projects/[id]/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    console.log(`Fetching project with ID: ${params.id}`);
    
    const { id } = params;
    
    // Special handling for 'new' - this is a client route, not an actual project ID
    if (id === 'new') {
      console.log("Invalid project ID: 'new' is a client-side route");
      return Response.json({ error: 'Invalid project ID: "new" is a client-side route' }, { status: 400 });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid project ID format: ${id}`);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Find the project
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    console.log(`Successfully fetched project: ${project.name}`);
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
    console.log(`Updating project with ID: ${params.id}`);
    
    const { id } = params;
    const data = await request.json();
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid project ID format: ${id}`);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Update the project
    const result = await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...data,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log(`Project not found with ID: ${id}`);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Fetch the updated project
    const updatedProject = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    
    console.log(`Successfully updated project: ${updatedProject.name}`);
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
    console.log(`Deleting project with ID: ${params.id}`);
    
    const { id } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid project ID format: ${id}`);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Delete the project
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      console.log(`Project not found with ID: ${id}`);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    console.log(`Successfully deleted project with ID: ${id}`);
    return Response.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ 
      error: 'Failed to delete project',
      message: error.message 
    }, { status: 500 });
  }
}
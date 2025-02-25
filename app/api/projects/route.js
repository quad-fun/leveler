// app/api/projects/route.js
import clientPromise from '@/lib/mongodb';
import { validateProject } from '@/lib/validation/projectValidation';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    const projects = await db.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return Response.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ 
      error: 'Failed to fetch projects',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate the incoming data
    const validation = validateProject(data);
    if (!validation.success) {
      return Response.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }
    
    const validData = validation.data;
    
    // Add timestamp and initialize bid count
    const newProject = {
      ...validData,
      createdAt: new Date(),
      updatedAt: new Date(),
      bidCount: 0,
      totalBudget: null
    };
    
    // Insert into database
    const client = await clientPromise;
    const db = client.db("bidleveling");
    const result = await db.collection("projects").insertOne(newProject);
    
    // Return the created project with its ID
    return Response.json({
      ...newProject,
      _id: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ 
      error: 'Failed to create project',
      message: error.message 
    }, { status: 500 });
  }
}
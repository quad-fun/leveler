// app/api/projects/route.js
import clientPromise from '@/lib/mongodb';
import { validateProject } from '@/lib/validation/projectValidation';
import { getAllProjects, createProject } from '@/lib/mockDataService';

export async function GET() {
  try {
    console.log('Fetching all projects from MongoDB...');
    
    // Get the MongoDB client
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Fetch projects
    const projects = await db.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Successfully fetched ${projects.length} projects`);
    return Response.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    // Return mock data as a fallback
    console.log('Falling back to mock projects data');
    return Response.json(getAllProjects());
  }
}

export async function POST(request) {
  try {
    console.log('Creating new project...');
    
    // Parse request data
    const data = await request.json();
    console.log('Received project data:', data);
    
    // Validate the data
    const validation = validateProject(data);
    if (!validation.success) {
      console.log('Validation failed:', validation.error.format());
      return Response.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }
    
    const validData = validation.data;
    console.log('Data validated successfully');
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Add timestamp and initialize bid count
    const newProject = {
      ...validData,
      createdAt: new Date(),
      updatedAt: new Date(),
      bidCount: 0,
      totalBudget: validData.totalBudget || null
    };
    
    // Insert project into database
    const result = await db.collection("projects").insertOne(newProject);
    console.log('Project created with ID:', result.insertedId);
    
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
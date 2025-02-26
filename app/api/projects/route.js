// app/api/projects/route.js
import clientPromise from '@/lib/mongodb';
import { validateProject } from '@/lib/validation/projectValidation';
import { getAllProjects, createProject } from '@/lib/mockDataService';

// Flag to force using mock data for testing
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

export async function GET() {
  // If mock data is forced, return it immediately
  if (FORCE_MOCK_DATA) {
    console.log('Using mock projects data (forced)');
    return Response.json(getAllProjects());
  }

  try {
    // Set a short timeout for MongoDB connection attempt
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
    );
    
    // Try to connect to MongoDB with a timeout
    const client = await Promise.race([
      clientPromise,
      timeoutPromise
    ]);
    
    const db = client.db("bidleveling");
    
    const projects = await db.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log('Successfully fetched projects from MongoDB');
    return Response.json(projects);
  } catch (error) {
    console.error('Error fetching projects from MongoDB:', error);
    
    // Return mock data as a fallback
    console.log('Falling back to mock projects data');
    return Response.json(getAllProjects());
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
    
    // If using mock data, use the mock service
    if (FORCE_MOCK_DATA) {
      console.log('Creating mock project (forced)');
      const newProject = createProject(validData);
      return Response.json(newProject, { status: 201 });
    }
    
    try {
      // Add timestamp and initialize bid count
      const newProject = {
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
        bidCount: 0,
        totalBudget: validData.totalBudget || null
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
    } catch (dbError) {
      console.error('MongoDB error when creating project:', dbError);
      
      // Fall back to mock data
      console.log('Falling back to mock data for project creation');
      const newProject = createProject(validData);
      return Response.json(newProject, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ 
      error: 'Failed to create project',
      message: error.message 
    }, { status: 500 });
  }
}
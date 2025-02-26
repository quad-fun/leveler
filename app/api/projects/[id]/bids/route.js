// app/api/projects/[id]/bids/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { validateBid } from '@/lib/validation/bidValidation';
import { getProjectById, getBidsByProjectId, createBid } from '@/lib/mockDataService';

// Flag to force using mock data for testing
const FORCE_MOCK_DATA = process.env.FORCE_MOCK_DATA === 'true';

export async function GET(request, { params }) {
  const { id } = params;
  
  // If mock data is forced, return mock bids
  if (FORCE_MOCK_DATA) {
    console.log(`Using mock bids data for project ID: ${id} (forced)`);
    const bids = getBidsByProjectId(id);
    return Response.json(bids);
  }
  
  try {
    // For MongoDB, check if it's a valid ObjectId
    const isMockId = id && id.startsWith('mock-');
    
    if (!isMockId && !ObjectId.isValid(id)) {
      // If it's neither a valid ObjectId nor a mock ID, return an error
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // If it's a mock ID, use mock data
    if (isMockId) {
      const mockProject = getProjectById(id);
      if (!mockProject) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      return Response.json(getBidsByProjectId(id));
    }
    
    // Try MongoDB connection with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
    );
    
    const client = await Promise.race([
      clientPromise,
      timeoutPromise
    ]);
    
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      // Try mock data fallback
      const mockProject = getProjectById(id);
      if (mockProject) {
        console.log(`Falling back to mock bids for project ID: ${id}`);
        return Response.json(getBidsByProjectId(id));
      }
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get bids for this project
    const bids = await db.collection("bids")
      .find({ projectId: id })
      .sort({ submittedAt: -1 })
      .toArray();
    
    return Response.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    
    // Try mock data fallback
    console.log(`Falling back to mock bids for project ID: ${id}`);
    return Response.json(getBidsByProjectId(id));
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Add projectId to data for validation
    const bidData = {
      ...data,
      projectId: id
    };
    
    // Validate the incoming data
    const validation = validateBid(bidData);
    if (!validation.success) {
      return Response.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }
    
    const validData = validation.data;
    
    // If using mock data, use the mock service
    if (FORCE_MOCK_DATA || (id && id.startsWith('mock-'))) {
      console.log(`Creating mock bid for project ID: ${id}`);
      const mockProject = getProjectById(id);
      if (!mockProject) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      const newBid = createBid(validData);
      return Response.json(newBid, { status: 201 });
    }
    
    try {
      // For MongoDB flow
      if (!ObjectId.isValid(id)) {
        return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
      }
      
      // Add timestamp and status
      const newBid = {
        ...validData,
        submittedAt: new Date(),
        status: 'pending'
      };
      
      const client = await clientPromise;
      const db = client.db("bidleveling");
      
      // Check if project exists
      const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Insert the bid
      const result = await db.collection("bids").insertOne(newBid);
      
      // Update project bid count
      await db.collection("projects").updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { bidCount: 1 },
          $set: { updatedAt: new Date() }
        }
      );
      
      // Return the created bid with its ID
      return Response.json({
        ...newBid,
        _id: result.insertedId
      }, { status: 201 });
    } catch (dbError) {
      console.error('MongoDB error when creating bid:', dbError);
      
      // Fall back to mock data
      console.log(`Falling back to mock data for bid creation (project ID: ${id})`);
      const mockProject = getProjectById(id);
      if (!mockProject) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      const newBid = createBid(validData);
      return Response.json(newBid, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating bid:', error);
    return Response.json({ 
      error: 'Failed to create bid',
      message: error.message 
    }, { status: 500 });
  }
}
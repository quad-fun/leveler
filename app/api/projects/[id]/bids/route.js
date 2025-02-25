// app/api/projects/[id]/bids/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { validateBid } from '@/lib/validation/bidValidation';

export async function GET(request, { params }) {
  try {
    const { id: projectId } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get bids for this project
    const bids = await db.collection("bids")
      .find({ projectId: projectId })
      .sort({ submittedAt: -1 })
      .toArray();
    
    return Response.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    return Response.json({ 
      error: 'Failed to fetch bids',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: projectId } = params;
    const data = await request.json();
    
    // Validate ObjectId format
    if (!ObjectId.isValid(projectId)) {
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Add projectId to data for validation
    const bidData = {
      ...data,
      projectId: projectId
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
    
    // Add timestamp and status
    const newBid = {
      ...validData,
      submittedAt: new Date(),
      status: 'pending'
    };
    
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Insert the bid
    const result = await db.collection("bids").insertOne(newBid);
    
    // Update project bid count
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
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
  } catch (error) {
    console.error('Error creating bid:', error);
    return Response.json({ 
      error: 'Failed to create bid',
      message: error.message 
    }, { status: 500 });
  }
}
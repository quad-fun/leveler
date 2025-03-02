// app/api/projects/[id]/bids/route.js
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    console.log(`Fetching bids for project with ID: ${params.id}`);
    
    const { id } = params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid project ID format: ${id}`);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bidleveling");
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get bids for this project
    const bids = await db.collection("bids")
      .find({ projectId: id })
      .sort({ submittedAt: -1 })
      .toArray();
    
    console.log(`Found ${bids.length} bids for project: ${project.name}`);
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
    console.log(`Creating bid for project with ID: ${params.id}`);
    
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
    
    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Create the bid
    const newBid = {
      ...data,
      projectId: id,
      submittedAt: new Date(),
      status: 'pending'
    };
    
    const result = await db.collection("bids").insertOne(newBid);
    
    // Update project bid count
    await db.collection("projects").updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { bidCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log(`Created bid for project: ${project.name}`);
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
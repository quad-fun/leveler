// app/api/test-db/route.js
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Connect to the client
    const client = await clientPromise;
    
    // Get the database
    const db = client.db("bidleveling");
    
    // Perform a simple query
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    return Response.json({ 
      status: 'success', 
      message: 'Connected to MongoDB successfully',
      collections: collectionNames
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return Response.json({ 
      status: 'error', 
      message: 'Failed to connect to MongoDB',
      error: error.message
    }, { status: 500 });
  }
}
// app/api/test-mongodb/route.js
import clientPromise from '@/lib/mongodb';

export async function GET() {
  console.log('Test MongoDB connection API called');
  
  try {
    console.log('Attempting to connect to MongoDB...');
    const client = await clientPromise;
    console.log('Connection successful!');
    
    const db = client.db("bidleveling");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Count documents in projects collection if it exists
    let projectCount = 0;
    if (collectionNames.includes('projects')) {
      projectCount = await db.collection('projects').countDocuments();
      console.log(`Projects collection has ${projectCount} documents`);
    }
    
    // Count documents in bids collection if it exists
    let bidCount = 0;
    if (collectionNames.includes('bids')) {
      bidCount = await db.collection('bids').countDocuments();
      console.log(`Bids collection has ${bidCount} documents`);
    }
    
    return Response.json({
      status: 'success',
      connected: true,
      collections: collectionNames,
      counts: {
        projects: projectCount,
        bids: bidCount
      }
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    
    return Response.json({
      status: 'error',
      connected: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
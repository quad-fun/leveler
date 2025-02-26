// Handle DELETE request for bids
export async function DELETE(request, { params }) {
  const { id, bidId } = params;
  
  try {
    // Add your database deletion logic here
    // Example with MongoDB:
    // await db.collection('bids').deleteOne({ _id: bidId, projectId: id });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting bid:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete bid' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
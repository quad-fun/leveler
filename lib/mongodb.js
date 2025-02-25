// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = { useUnifiedTopology: true };

let client;
let clientPromise;

// In development mode, use a global variable to avoid multiple instances
if (process.env.NODE_ENV === 'development') {
  // In development, we want to reuse our database connection
  let globalWithMongo = global;
  
  if (!globalWithMongo._mongoClientPromise) {
    if (!uri) {
      throw new Error('Please define the MONGODB_URI environment variable in .env.local');
    }
    
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new connection for each request
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
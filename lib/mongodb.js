// lib/mongodb.js
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

// Get URI from environment, but remove any conflicting TLS parameters
let uri = process.env.MONGODB_URI;

// Remove tlsInsecure from URI if present
if (uri.includes('tlsInsecure=true')) {
  uri = uri.replace('tlsInsecure=true', '').replace('&&', '&').replace(/&$/, '');
}

// Simplified connection options with only necessary TLS settings
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  // Only use one of these options, not both
  tlsAllowInvalidCertificates: true
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    console.log('Creating new MongoDB client for development');
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      console.log('Unable to establish MongoDB connection. Check your connection string and network.');
      // Return a promise that never resolves
      return new Promise(() => {});
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise
export default clientPromise;
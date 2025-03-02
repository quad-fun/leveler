// lib/mongodb.js
import { MongoClient } from 'mongodb';

// Check if MONGODB_URI is defined
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  throw new Error('Please add your MongoDB URI to .env.local');
}

// Get URI from environment, but remove any conflicting TLS parameters
let uri = process.env.MONGODB_URI;
console.log('MongoDB URI format check:', uri.substring(0, 15) + '...');

// Clean up URI if needed
if (uri.includes('tlsInsecure=true')) {
  uri = uri.replace('tlsInsecure=true', '').replace('&&', '&').replace(/&$/, '');
  console.log('Removed tlsInsecure parameter from URI');
}

// Connection options with clear TLS settings
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tlsAllowInvalidCertificates: true,
  // Add sensible timeouts
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  // Add retry capability
  retryWrites: true
};

console.log('MongoDB connection options:', JSON.stringify(options));

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    console.log('Creating new MongoDB client for development');
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB global connection established successfully');
        return client;
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB (global):', err);
        throw new Error(`Unable to establish MongoDB connection: ${err.message}`);
      });
  } else {
    console.log('Using existing MongoDB client from global variable');
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Creating MongoDB client for production');
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB connection established successfully');
      return client;
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw new Error(`Unable to establish MongoDB connection: ${err.message}`);
    });
}

// Export a module-scoped MongoClient promise
export default clientPromise;
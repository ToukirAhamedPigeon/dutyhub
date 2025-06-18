// Import necessary types and functions from mongoose
import mongoose, { Mongoose } from 'mongoose';

// Get the MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Define a TypeScript interface to structure the cached connection
interface MongooseConnection {
    conn: Mongoose | null;                    // Stores the established Mongoose connection
    promise: Promise<Mongoose> | null;        // Stores the promise while connection is being established
}

// Access the global object to use a shared cache for the connection across hot reloads (mainly for dev environment)
let cached: MongooseConnection = (global as any).mongoose;

// If no connection is cached yet, initialize it with null values
if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

// This function ensures that we only create one MongoDB connection instance
export async function dbConnect() {
    // If a connection has already been established, reuse it
    if (cached.conn) return cached.conn;

    // If no MongoDB URI is found in the environment, throw an error
    if (!MONGODB_URI) throw new Error('Please add your Mongo URI to .env.local');

    // If a connection promise isn't already in progress, start one
    // Connect to MongoDB with a custom database name and prevent automatic buffering of commands
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: 'dutyhub',
        bufferCommands: false
    });

    // Wait for the connection to be established and store it
    cached.conn = await cached.promise;

    // Return the active Mongoose connection
    return cached.conn;
}
import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
    if (cached.conn) return cached.conn;

    if (!MONGODB_URI) throw new Error('Please add your Mongo URI to .env.local');
    
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI,{dbName: 'imageai', bufferCommands: false});

    cached.conn = await cached.promise;

    return cached.conn;
}

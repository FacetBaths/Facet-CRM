import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export default async function () {
  await mongoose.disconnect();
  await (global as any).mongoServer.stop();
}
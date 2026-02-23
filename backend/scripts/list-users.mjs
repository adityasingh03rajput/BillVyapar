import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

const limit = Number(process.argv[2] || 50);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing in backend .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const users = await User.find({})
  .sort({ createdAt: -1 })
  .limit(Number.isFinite(limit) ? limit : 50)
  .select({ email: 1, name: 1, phone: 1, createdAt: 1, updatedAt: 1 });

console.log(
  users.map(u => ({
    id: String(u._id),
    email: u.email,
    name: u.name,
    phone: u.phone,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }))
);

await mongoose.disconnect();

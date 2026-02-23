import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Subscription } from '../src/models/Subscription.js';

const emailArg = process.argv[2] || 'adityarajsir161@gmail.com';
const email = String(emailArg).toLowerCase();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOne({ email });
if (!user) {
  console.error('User not found:', email);
  await mongoose.disconnect();
  process.exit(1);
}

const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

const result = await Subscription.updateOne(
  { userId: user._id },
  { $set: { endDate } }
);

const sub = await Subscription.findOne({ userId: user._id });

console.log(JSON.stringify({
  matched: result.matchedCount,
  modified: result.modifiedCount,
  userId: String(user._id),
  endDate: sub?.endDate?.toISOString?.() ?? null,
}, null, 2));

await mongoose.disconnect();
